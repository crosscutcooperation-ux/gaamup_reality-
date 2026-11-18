import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RGBELoader} from './vendor/addons/loaders/RGBELoader.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';
import {FontLoader} from './vendor/addons/loaders/FontLoader.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';
import {buildSite,setArchitecturalMaterials} from './model.js';
import {createTowerElevation} from './tower-elevation.js';
import {createArchitecturalLighting} from './architectural-lighting.js';
import {Sky} from './vendor/addons/objects/Sky.js';
import {mergeStaticPieces} from './scene-optimization.js';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status');
const send=data=>parent.postMessage({source:'aero-scene',...data},'*');
let renderer,controls,scene,camera,frame=0,model,elevation,lighting,disposed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const generic=new URLSearchParams(location.search).get('model');
async function init(){
  renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<800?1.25:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  scene=new T.Scene();scene.background=new T.Color(0xc9d8d7);scene.fog=new T.FogExp2(0xc9d8d7,.0006);
  camera=new T.PerspectiveCamera(45,1,.15,1800);
  controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.065;controls.maxPolarAngle=Math.PI/2-.025;controls.minDistance=38;controls.maxDistance=690;controls.autoRotate=!reduced;controls.autoRotateSpeed=.42;
  const sun=new T.DirectionalLight(0xfff0dc,2.3);sun.position.set(-160,205,195);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-190,right:190,top:190,bottom:-190,near:10,far:650});sun.shadow.bias=-.00015;sun.shadow.normalBias=.15;const ambient=new T.HemisphereLight(0xe2f1ff,0x6b7256,.6);scene.add(sun,ambient);
  const fill=new T.DirectionalLight(0xd6eaff,.3);fill.position.set(100,100,-200);scene.add(fill);
  const hdr=await new RGBELoader().loadAsync('./assets/environment.hdr');const pmrem=new T.PMREMGenerator(renderer);const environment=pmrem.fromEquirectangular(hdr);scene.environment=environment.texture;scene.environmentIntensity=.55;hdr.dispose();pmrem.dispose();
  if(generic){
    if(!generic.startsWith('/scene-assets/')||generic.includes('..')||generic.includes('\\'))throw new Error('Choose a local project GLB.');
    const asset=await new GLTFLoader().loadAsync(generic);model={root:asset.scene,towers:[]};scene.add(asset.scene);
    asset.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    const bounds=new T.Box3().setFromObject(asset.scene),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    const radius=Math.max(size.x,size.y,size.z)*.75||1;
    controls.minDistance=radius*.12;controls.maxDistance=radius*6;controls.target.copy(center);camera.near=Math.max(radius/2000,.001);camera.far=radius*30;scene.fog=null;camera.updateProjectionMatrix();
    camera.position.copy(center).add(new T.Vector3(radius*1.3,radius*.8,radius*1.5));
    Object.assign(sun.shadow.camera,{left:-radius*2,right:radius*2,top:radius*2,bottom:-radius*2,near:.1,far:radius*15});sun.position.copy(center).add(new T.Vector3(-radius*2,radius*3,radius*2));sun.target.position.copy(center);scene.add(sun.target);sun.shadow.camera.updateProjectionMatrix();
  }else{
    const loader=new T.TextureLoader();
    const load=async(name,color=true,repeat=null)=>{const tex=await loader.loadAsync('./assets/'+name);tex.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(repeat){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(...repeat);}return tex;};
    const entries=await Promise.all([
      ...['center','left','right'].map(n=>load(`facade-35-${n}.jpg`).then(t=>[n,t])),
      ...['center','left','right'].flatMap(n=>['Roughness','Metalness','Glass'].map(s=>load(`facade-35-${n}-${s.toLowerCase()}.jpg`,false).then(t=>[n+s,t]))),
      ...[['canopy','canopy-spray.webp',true],['stone','stone.jpg',true,[2,8]],['bump','stone-bump.jpg',false,[12,12]],['grass','grass.jpg',true,[45,30]],['water','water-bump.jpg',false,[7,7]],['asphalt','asphalt.jpg',true,[40,3]],['poolPattern','pool-pattern.jpg',true,[6,2]],['wood','wood-deck.jpg',true,[40,8]],['shopDisplay','shop-display.jpg',true],['shopUpper','shop-upper.jpg',true],['relief','plaza-relief.jpg',true]].map(([key,...args])=>load(...args).then(t=>[key,t])),
      ...['clerestory','posters-west','posters-east','arcade-glass'].map(key=>load(key+'.jpg').then(t=>[key,t])),
      fetch('./vendor/fonts/helvetiker_regular.typeface.json').then(r=>{if(!r.ok)throw new Error('Font unavailable');return r.json();}).then(j=>['font',new FontLoader().parse(j)])
    ]);setArchitecturalMaterials(Object.fromEntries(entries));model=buildSite();
    const imported=await new GLTFLoader().loadAsync('./assets/residential-facades.glb');
    for(const tower of model.towers){
      const facade=tower.getObjectByName('Plan-shaped facade with projecting wings and recessed courts'),source=imported.scene.getObjectByName(tower.userData.name);if(source&&facade){const pieces=[];source.traverse(n=>{if(n.isMesh)pieces.push(n);});const geometry=mergeGeometries(pieces.map(p=>p.geometry),true);if(geometry){facade.geometry.dispose();facade.geometry=geometry;facade.material=pieces.map(p=>p.material);}}
      tower.userData.entityId='tower-'+tower.userData.towerId;
      tower.traverse(o=>{if(o.name==='Fine ornamental balcony balusters')o.castShadow=false;});mergeStaticPieces(tower);
    }
    model.land.remove(model.businessPark);mergeStaticPieces(model.businessPark);mergeStaticPieces(model.land);model.land.add(model.businessPark);mergeStaticPieces(model.context);scene.add(model.root,model.context);
    const ground=new T.Mesh(new T.PlaneGeometry(2800,2800),new T.MeshStandardMaterial({color:0x8c9981,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-3.1;ground.receiveShadow=true;scene.add(ground);
    controls.target.set(0,38,4);camera.position.set(-195,175,265);
  }
  if(!generic){
    const sky=new Sky();sky.scale.setScalar(1300);const uniforms=sky.material.uniforms;uniforms.turbidity.value=4;uniforms.rayleigh.value=1.4;uniforms.mieCoefficient.value=.004;uniforms.mieDirectionalG.value=.78;uniforms.sunPosition.value.set(-.5,.8,.6).normalize();sky.visible=false;scene.add(sky);
    const nightSky=new T.Mesh(new T.SphereGeometry(1050,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,toneMapped:false,uniforms:{horizon:{value:new T.Color(0xd7ecf1)},skyBlue:{value:new T.Color(0x369bef)}},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 direction;uniform vec3 horizon;uniform vec3 skyBlue;void main(){float altitude=normalize(direction).y;float t=1.-exp(-5.5*max(altitude+.018,0.));gl_FragColor=vec4(mix(horizon,skyBlue,t),1.);#include <colorspace_fragment>\n}'.replace('#include','\n#include')}));nightSky.renderOrder=-10;scene.add(nightSky);
    lighting=createArchitecturalLighting({scene,renderer,sun,ambient,fill,sky,nightSky,model,invalidate(){if(elevation?.active)elevation.resize();else renderer.render(scene,camera);},announce(message){send({type:'announcement',message});}});
    elevation=createTowerElevation({renderer,canvas,environment:scene.environment,
      open(background,selected){
        const rect=canvas.getBoundingClientRect(),bounds=new T.Box3().setFromObject(selected),center=bounds.getCenter(new T.Vector3()).project(camera),top=new T.Vector3(selected.position.x,bounds.max.y,selected.position.z).project(camera),bottom=new T.Vector3(selected.position.x,bounds.min.y,selected.position.z).project(camera);
        selected.visible=false;try{renderer.render(scene,camera);background.width=canvas.width;background.height=canvas.height;background.getContext('2d').drawImage(canvas,0,0);}finally{selected.visible=true;}
        controls.autoRotate=false;controls.enabled=false;send({type:'orbit',playing:false});send({type:'view',view:'building',building:selected.userData.towerId||'business'});
        return {x:rect.left+(center.x+1)*rect.width/2,y:rect.top+(1-center.y)*rect.height/2,height:Math.abs(top.y-bottom.y)*rect.height/2};
      },close(){controls.enabled=true;resize();renderer.shadowMap.needsUpdate=true;send({type:'view',view:'colony'});}
    });
    document.addEventListener('switch-elevation-tower',event=>focusTower(event.detail));
    document.querySelectorAll('[data-lighting]').forEach(button=>button.addEventListener('click',()=>setLighting(button.dataset.lighting)));
    lighting.set('day');
  }
  function setLighting(name){if(!['day','evening','night'].includes(name)||!lighting)return;lighting.set(name);send({type:'lighting',name});}
  function focusTower(id){const tower=id==='business'?model.businessPark:model.towers.find(t=>t.userData.towerId===id);if(tower)elevation?.show(id,tower);}
  const home={position:camera.position.clone(),target:controls.target.clone()};
  controls.update();renderer.shadowMap.needsUpdate=true;
  function resize(){if(elevation?.active){elevation.resize();return;}const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  controls.addEventListener('start',()=>{controls.autoRotate=false;send({type:'orbit',playing:false});});
  addEventListener('message',event=>{if(event.source!==parent||event.data?.source!=='aero-controls')return;switch(event.data.action){case 'lighting':setLighting(event.data.value);break;case 'building':if(!generic)focusTower(event.data.id);break;case 'bindings':if(Array.isArray(event.data.nodes))for(const node of event.data.nodes.slice(0,20000)){if(typeof node.id!=='string')continue;const object=model.root.getObjectByName(node.objectName||node.id);if(object){object.userData.entityId=node.id;object.userData.name=node.name||node.id;}}break;case 'rotate':controls.autoRotate=!controls.autoRotate;send({type:'orbit',playing:controls.autoRotate});break;case 'reset':camera.position.copy(home.position);controls.target.copy(home.target);controls.update();break;case 'in':case 'out':camera.position.sub(controls.target).multiplyScalar(event.data.action==='in'?.85:1.18).add(controls.target);controls.update();break;}});
  const pointer=new T.Vector2(),ray=new T.Raycaster();let start;
  canvas.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];});
  canvas.addEventListener('pointerup',e=>{if(elevation?.active||!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(model.towers.length?[...model.towers,model.businessPark]:[model.root],true)[0];if(!hit)return;let object=hit.object;while(object.parent&&object!==model.businessPark&&!object.userData.entityId&&!object.userData.towerId)object=object.parent;const entityId=object.userData.entityId||object.userData.towerId||hit.object.name;send({type:'selection',id:entityId,name:object.userData.name||hit.object.name||'Model'});if(!generic){focusTower(object.userData.towerId||'business');}});
  let previous=performance.now();function render(now){if(disposed)return;const dt=Math.min((now-previous)/1000,.05);previous=now;if(!document.hidden&&!elevation?.active){controls.update(dt);renderer.render(scene,camera);}frame=requestAnimationFrame(render);}frame=requestAnimationFrame(render);
  status.hidden=true;canvas.dataset.modelReady='true';send({type:'ready',playing:controls.autoRotate});
}
init().catch(error=>{console.error(error);status.replaceChildren(document.createTextNode('The 3D view could not load. '));const button=document.createElement('button');button.textContent='Try again';button.onclick=()=>location.reload();status.append(button);send({type:'error',message:'The model could not load. Try again or check the project assets.'});});
addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);controls?.dispose();const geometry=new Set(),materials=new Set(),textures=new Set();scene?.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const t of Object.values(m))if(t?.isTexture)textures.add(t);}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene?.environment?.dispose();renderer?.dispose();});
