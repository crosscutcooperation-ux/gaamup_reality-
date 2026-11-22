import * as THREE from 'three';
import {LANDSCAPE_ASSETS,TRAIN_MODEL_URL} from './landscape-assets.js';
import {mapRenderQuality,yieldToBrowser} from './map-performance.js';
import {createForestBreeze} from './forest-breeze.js';
import {createCameraFlight,JOURNEY_DURATION,TRAIN_APPROACH_DISTANCE,TRAIN_SPEED} from './camera-flight.js';
import {makeScanRoute,prepareScannedLandscape,SCAN_MODEL_URL,SCAN_STATIONS} from './scanned-landscape.js';
import {fitLockedMap} from './map-framing.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {createImportedTrain} from './imported-train.js';
import {createTrainAdvertTexture} from './train-branding.js';
import {createOutdoorReflections} from './train-finish.js';
import {createJourneyEnvironment,JOURNEY_SCENERY} from './journey-environment.js';

const clamp = n => Math.max(0,Math.min(1,n));
export function makeRoute(){return makeScanRoute();}
export function stationDistance(index,count){return count===3?SCAN_STATIONS[index]:.27+index/Math.max(1,count-1)*.46;}
export function transitionHead(stop,progress,routeLength){return stop+(-3.2+clamp(progress)*TRAIN_APPROACH_DISTANCE)/routeLength;}
export function railPose(route, distance, side = 0) {
  const u=clamp(distance),point=route.getPointAt(u),tangent=route.getTangentAt(u).normalize();
  if(distance!==u)point.addScaledVector(tangent,(distance-u)*route.getLength());
  const normal=new THREE.Vector3(-tangent.z,0,tangent.x).normalize(),up=new THREE.Vector3().crossVectors(normal,tangent).normalize();
  const quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent,up,normal));
  return {point:point.addScaledVector(normal,side),tangent,normal,up,quaternion,heading:Math.atan2(-tangent.z,tangent.x)};
}
/** One unbroken track, including both tangent extensions. */
export function makeTrackLine(route,side=0,extension=0){
  const length=route.getLength(),span=length+extension*2;
  return new THREE.CatmullRomCurve3(Array.from({length:601},(_,i)=>railPose(route,(-extension+i/600*span)/length,side).point),false,'centripetal');
}
function proceduralTexture(kind) {
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  let seed=12345;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  ctx.fillStyle=kind==='ballast'?'#777166':'#8b8776';ctx.fillRect(0,0,256,256);
  for(let i=0;i<9000;i++){const v=Math.floor(55+rand()*110);ctx.fillStyle=`rgb(${v+8},${v+5},${v})`;const r=rand()*2.5+.6;ctx.fillRect(rand()*256,rand()*256,r*1.5,r);}
  const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,80);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
export function createTrackBed(route,width,material){
  const count=480,positions=[],uv=[],indices=[];
  const profile=[[-.5,-.05],[-.5,0],[-.37,.04],[.37,.04],[.5,0],[.5,-.05]],stride=profile.length;
  for(let i=0;i<=count;i++)for(const [side,height] of profile){const pose=railPose(route,i/count,side*width);positions.push(pose.point.x,pose.point.y+height,pose.point.z);uv.push(side+.5,i/count);}
  for(let i=0;i<count;i++)for(let j=0;j<stride-1;j++){const a=i*stride+j,b=a+stride;indices.push(a,a+1,b,a+1,b+1,b);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Graded, solid ballast bed';mesh.receiveShadow=true;return mesh;
}
function offsetCurve(route,offset,y) {
  return new THREE.CatmullRomCurve3(Array.from({length:301},(_,i)=>{const p=railPose(route,i/300,offset).point;p.y+=y;return p;}),false,'centripetal');
}
function box(w,h,d,material,x,y,z,parent) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

export async function createRailway({canvas,world,stations,cities,signal,onError}) {
  const started=performance.now();let initialized=false;
  signal?.throwIfAborted();
  // Load before claiming the canvas. StrictMode cleanup/retries cannot leave two
  // renderers fighting over the same WebGL context while images are in flight.
  const loader=new THREE.TextureLoader();
  const draco=new DRACOLoader().setDecoderPath('/scenes/venus-skky-city/vendor/draco/').setWorkerLimit(2);
  const assets=await Promise.allSettled([
    new GLTFLoader().setDRACOLoader(draco).loadAsync(SCAN_MODEL_URL),
    new GLTFLoader().setDRACOLoader(draco).loadAsync(TRAIN_MODEL_URL),
    new RGBELoader().loadAsync('/scenes/sai-world-dreams/assets/environment.hdr').catch(()=>null),
    loader.loadAsync(JOURNEY_SCENERY.ground),
    loader.loadAsync(JOURNEY_SCENERY.clouds),
    fetch(JOURNEY_SCENERY.relief,{signal}).then(response=>{if(!response.ok)throw new Error('Surrounding terrain could not load.');return response.json();}),
    loader.loadAsync(LANDSCAPE_ASSETS.edgeMask),
    loader.loadAsync('/assets/brand/panpops-logo.png'),
    loader.loadAsync('/assets/brand/panpops-train-artwork.png'),
  ]);
  draco.dispose();
  function releaseAsset(asset){
    if(asset?.isTexture){asset.dispose();return;}
    const textures=new Set(),materials=new Set();asset?.scene?.traverse(object=>{object.geometry?.dispose();for(const material of Array.isArray(object.material)?object.material:[object.material])if(material){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
    for(const value of textures)value.dispose();for(const value of materials)value.dispose();
  }
  const failure=assets.find(result=>result.status==='rejected');
  if(signal?.aborted||failure){for(const result of assets)if(result.status==='fulfilled')releaseAsset(result.value);signal?.throwIfAborted();throw failure.reason;}
  const [landscapeAsset,trainAsset,skyTexture,groundTexture,cloudTexture,relief,edgeMask,brandLogo,brandArtwork]=assets.map(result=>result.value);
  const assetsReady=performance.now();await yieldToBrowser();
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
  catch(error){for(const result of assets)releaseAsset(result.value);throw error;}
  renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b8d2df');scene.fog=new THREE.Fog('#bdcdbd',205,420);
  const pmrem=skyTexture?new THREE.PMREMGenerator(renderer):null;
  const environment=skyTexture?pmrem.fromEquirectangular(skyTexture):createOutdoorReflections(renderer);skyTexture?.dispose();pmrem?.dispose();scene.environment=environment.texture;scene.environmentIntensity=.8;
  // Keep useful depth precision at aerial distance without clipping the trackside pass.
  const camera=new THREE.PerspectiveCamera(44,1,.2,650);
  const overview=new THREE.Vector3(22,140,135), overviewTarget=new THREE.Vector3(10,0,7);camera.position.copy(overview);camera.lookAt(overviewTarget);
  scene.add(new THREE.HemisphereLight(0xfaf6e9,0x7c755e,.6));
  const sun=new THREE.DirectionalLight(0xffedcc,2.0);sun.position.set(-35,65,30);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.normalBias=.015;sun.shadow.bias=-.0001;scene.add(sun,sun.target);
  await yieldToBrowser();
  const route=makeRoute(),routeLength=route.getLength();
  const landscape=prepareScannedLandscape(landscapeAsset.scene,{edgeMask});scene.add(landscape.group);
  const landscapeBounds=landscape.bounds,forestBreeze=createForestBreeze(landscape.group);
  const scenery=createJourneyEnvironment({groundTexture,cloudTexture,relief});scene.add(scenery.group);
  groundTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  landscape.group.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])for(const value of Object.values(material))if(value?.isTexture)value.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});
  await yieldToBrowser();
  const sleeperGeo=new THREE.BoxGeometry(.13,.075,1.03),sleeperMat=new THREE.MeshStandardMaterial({color:0xaaa695,roughness:.98});
  const railMat=new THREE.MeshStandardMaterial({color:0x90938d,metalness:.9,roughness:.33});
  const ballastMat=new THREE.MeshStandardMaterial({map:proceduralTexture('ballast'),roughness:1});
  for(const side of [0,-1.7]){
    const line=makeTrackLine(route,side),length=line.getLength();
    scene.add(createTrackBed(line,1.55,ballastMat));
    for(const offset of [-.3,.3])scene.add(new THREE.Mesh(new THREE.TubeGeometry(offsetCurve(line,offset,.13),768,.032,6,false),railMat));
    const count=Math.ceil(length/.25),ties=new THREE.InstancedMesh(sleeperGeo,sleeperMat,count),dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){const pose=railPose(line,i/(count-1));dummy.position.copy(pose.point);dummy.position.y+=.062;dummy.quaternion.copy(pose.quaternion);dummy.updateMatrix();ties.setMatrixAt(i,dummy.matrix);}
    ties.receiveShadow=true;scene.add(ties);
    await yieldToBrowser();
  }
  // Trackside platforms and signs share the railway's world coordinates, rather than floating over a diagram.
  const stationPoints=[];const platformMat=new THREE.MeshStandardMaterial({color:0xb9b2a1,roughness:1}),edgeMat=new THREE.MeshStandardMaterial({color:0xe5d6a5,roughness:.9}),postMat=new THREE.MeshStandardMaterial({color:0x383b31,roughness:.8});
  for(let i=0;i<cities.length;i++){
    const u=stationDistance(i,cities.length),side=i%2===0?4.5:-4.5,pose=railPose(route,u,side),platform=new THREE.Group();platform.position.copy(pose.point);platform.quaternion.copy(pose.quaternion);
    box(5,.18,1.6,platformMat,0,.065,0,platform);box(5,.02,.12,edgeMat,0,.17,-.73,platform);
    scene.add(platform);
    for(const end of [-1,1]){box(.06,1.05,.06,postMat,end*1.9,.68,0,platform);}
    box(4.6,.08,1.45,edgeMat,0,1.25,0,platform);
    box(1.2,.1,.35,postMat,0,.38,0,platform);
    const arrowShape=new THREE.Shape();arrowShape.moveTo(-.9,-.22);arrowShape.lineTo(.25,-.22);arrowShape.lineTo(.25,-.45);arrowShape.lineTo(.9,0);arrowShape.lineTo(.25,.45);arrowShape.lineTo(.25,.22);arrowShape.lineTo(-.9,.22);arrowShape.closePath();
    const marker=new THREE.Mesh(new THREE.ShapeGeometry(arrowShape),new THREE.MeshStandardMaterial({color:0xeff1df,roughness:.85,side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.rotation.z=side>0?Math.PI/2:-Math.PI/2;marker.position.copy(pose.point);marker.position.y+=.185;scene.add(marker);
    const point=pose.point.clone();point.y+=1.5;stationPoints.push(point);
  }
  let mapHead=.13;
  const advert=createTrainAdvertTexture(brandLogo.image,brandArtwork.image);brandLogo.dispose();brandArtwork.dispose();
  const coaches=createImportedTrain(trainAsset.scene,{adTexture:advert});coaches.forEach(c=>scene.add(c));
  // Imported geometry has been cloned into articulated runtime coaches.
  trainAsset.scene.traverse(object=>object.geometry?.dispose());
  let head=.13,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,lastTime=performance.now(),journey=null,visible=false,suspended=false,travelActive=false,destroyed=false,animationFrame=0,lastPaint=0,needsPaint=true,lastScroll=-Infinity,lastShadow=-Infinity;
  const coachOffsets=coaches.map((_,index)=>index*6.05);
  function positionTrain(){for(let i=0;i<coaches.length;i++){
    const u=head-coachOffsets[i]/routeLength,pose=railPose(route,u),coach=coaches[i];coach.visible=u>=3.2/routeLength&&u<=1-3.2/routeLength;coach.position.copy(pose.point);coach.quaternion.copy(pose.quaternion);
    for(const bogie of coach.userData.bogies){const bp=railPose(route,u+bogie.userData.offset/routeLength);const inverse=pose.quaternion.clone().invert(),local=bp.point.clone().sub(pose.point).applyQuaternion(inverse);bogie.position.copy(local);bogie.quaternion.copy(inverse.multiply(bp.quaternion));}
    for(const wheel of coach.userData.wheels)wheel.rotation[wheel.userData.rollAxis||'y']=-head*routeLength/.14;
  }}
  let viewWidth=0,viewHeight=0;
  function frameOverview(){
    const fitted=fitLockedMap(camera,landscapeBounds);overview.copy(camera.position);overviewTarget.copy(fitted.target);
    scene.fog.near=fitted.distance+fitted.diagonal*.3;scene.fog.far=fitted.distance+fitted.diagonal*2;
  }
  function resize(){const r=world.getBoundingClientRect();if(!r.width||!r.height)return;
    if(r.width===viewWidth&&r.height===viewHeight)return;
    viewWidth=r.width;viewHeight=r.height;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();if(!travelActive)frameOverview();
    renderer.setPixelRatio(mapRenderQuality({width:r.width,height:r.height,pixelRatio:devicePixelRatio,memory:navigator.deviceMemory,cores:navigator.hardwareConcurrency}).pixelRatio);
    // setSize clears the drawing buffer; paint in the same task to avoid a blank flash.
    if(initialized){updateLabels();renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);}
  }
  const ro=new ResizeObserver(resize);ro.observe(world);resize();
  const schedule=()=>{if(initialized&&!destroyed&&!animationFrame)animationFrame=requestAnimationFrame(animate);};
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();},{rootMargin:'100px'});io.observe(canvas);
  const scrolling=()=>{lastScroll=performance.now();};window.addEventListener('scroll',scrolling,{passive:true});document.addEventListener('visibilitychange',schedule);
  function updateLabels(){for(let i=0;i<stations.length;i++){const projected=stationPoints[i].clone().project(camera);const el=stations[i];if(!el)continue;el.style.left=`${(projected.x*.5+.5)*100}%`;el.style.top=`${(-projected.y*.5+.5)*100}%`;el.style.visibility=projected.z>1?'hidden':'visible';}}
  function rejectJourney(reason){if(!journey)return;const pending=journey;journey=null;pending.cleanup?.();pending.reject(reason);}
  function focusShadows(point=null){
    const center=point||new THREE.Vector3();sun.position.copy(center).add(new THREE.Vector3(-35,65,30));sun.target.position.copy(center);sun.target.updateMatrixWorld();
    const extent=point?18:80;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:point?18:65,bottom:point?-18:-65});sun.shadow.camera.updateProjectionMatrix();
  }
  function travelTo(index,{signal:journeySignal}={}){
    if(destroyed)return Promise.reject(new Error('The railway was closed.'));
    if(journey)return Promise.reject(new Error('Journey already in progress'));
    if(!Number.isInteger(index)||index<0||index>=cities.length)return Promise.reject(new Error('Unknown railway station.'));
    if(journeySignal?.aborted)return Promise.reject(journeySignal.reason);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced)return new Promise((resolve,reject)=>{
      const abort=()=>{clearTimeout(timer);reject(journeySignal.reason);};
      const timer=setTimeout(()=>{journeySignal?.removeEventListener('abort',abort);resolve();},200);
      journeySignal?.addEventListener('abort',abort,{once:true});
    });
    mapHead=head;
    const stop=stationDistance(index,cities.length),station=railPose(route,stop);
    focusShadows(station.point);
    travelActive=true;
    schedule();
    const flight=createCameraFlight({start:camera.position.clone(),startTarget:overviewTarget.clone(),station,aspect:camera.aspect});
    scenery.beginFlight(flight);
    head=transitionHead(stop,0,routeLength);positionTrain();
    return new Promise((resolve,reject)=>{
      const abort=()=>rejectJourney(journeySignal.reason);
      journeySignal?.addEventListener('abort',abort,{once:true});
      journey={start:performance.now(),duration:JOURNEY_DURATION,stop,flight,resolve,reject,cleanup:()=>journeySignal?.removeEventListener('abort',abort)};
    });
  }
  function reset(){rejectJourney(new Error('The train journey was cancelled.'));scenery.resetFlight();head=mapHead;travelActive=false;focusShadows();camera.position.copy(overview);camera.lookAt(overviewTarget);camera.fov=44;camera.updateProjectionMatrix();frameOverview();resize();}
  function animate(now){animationFrame=0;if(destroyed||document.hidden||((!visible||suspended)&&!journey))return;animationFrame=requestAnimationFrame(animate);if(paused&&!journey&&!needsPaint)return;
    // Hold the last map frame while the browser composites the scrolling page.
    if(!journey&&now-lastScroll<120)return;
    if(now-lastPaint<(journey?1000/60:1000/30))return;lastPaint=now;needsPaint=false;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
    if(journey){
      const t=clamp((now-journey.start)/journey.duration);
      // Park the camera after the descent; only the train advances during the two-second pass.
      const view=journey.flight.sample(t);
      head=transitionHead(journey.stop,view.approach,routeLength)+view.passDistance/routeLength;
      camera.position.copy(view.position);camera.quaternion.copy(view.quaternion);
      if(t>=1){const completed=journey;journey=null;completed.cleanup?.();completed.resolve();}
    }else if(!paused){head+=dt*(travelActive?TRAIN_SPEED:2.3)/routeLength;if(head>1.04)head=.07;}
    forestBreeze.update(now/1000,{reduced:paused});scenery.update(now/1000,camera,{reduced:paused});
    positionTrain();if(journey||now-lastShadow>160){renderer.shadowMap.needsUpdate=true;lastShadow=now;}renderer.render(scene,camera);
  }
  positionTrain();updateLabels();await yieldToBrowser();
  const warmTextures=new Set();
  scene.traverse(object=>{for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])for(const value of Object.values(material))if(value?.isTexture)warmTextures.add(value);});
  for(const texture of warmTextures){renderer.initTexture(texture);await yieldToBrowser();}
  await renderer.compileAsync(scene,camera);await yieldToBrowser();
  initialized=true;renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);schedule();
  canvas.dataset.loadMs=Math.round(performance.now()-started);canvas.dataset.assetsMs=Math.round(assetsReady-started);canvas.dataset.drawCalls=renderer.info.render.calls;canvas.dataset.triangles=renderer.info.render.triangles;
  const contextLost=event=>{event.preventDefault();paused=true;const error=new Error('The graphics connection was lost. Retry the railway to continue.');rejectJourney(error);onError?.(error.message);};
  canvas.addEventListener('webglcontextlost',contextLost);
  function dispose(){
    if(destroyed)return;destroyed=true;cancelAnimationFrame(animationFrame);rejectJourney(new Error('The railway was closed.'));
    ro.disconnect();io.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);
    window.removeEventListener('scroll',scrolling);document.removeEventListener('visibilitychange',schedule);
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])if(material){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});
    for(const item of geometries)item.dispose();for(const item of materials)item.dispose();for(const item of textures)item?.dispose();edgeMask.dispose();environment.dispose();sun.shadow.dispose();renderer.dispose();
  }
  return {travelTo,resize,reset,setSuspended(value){suspended=Boolean(value);if(!suspended)schedule();},isPaused:()=>paused,togglePause(){paused=!paused;needsPaint=true;schedule();return paused;},dispose};
}
