import {spaceWalkHotspots} from './shared/overlay-layout.js';
import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {OrbitControls} from './vendor/OrbitControls.js';
import {buildSite,towerSpecs,materials} from './model.js?v=balaji-2';
import {createLighting,prepareMaterials} from './lighting.js?v=approved-materials-1';
import {createTowerDetail} from './tower-detail.js?v=natural-smooth-1';
import {openPlanExplorer} from './plan-explorer.js?v=balaji-rooms-1';
import {createTours} from './tours.js?v=balaji-2';
import {hasTypicalPlan} from './plan-data.js';
import {canWalk} from './walk-navigation.js?v=balaji-2';
import {GLTFLoader} from './shared/vendor/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from './shared/vendor/addons/loaders/DRACOLoader.js';
import {createSmoothRenderer} from './adaptive-renderer.js?v=natural-smooth-1';
import {createModelLOD,createSceneMaterialLOD} from './model-lod.js?v=natural-smooth-1';
import {createRenderProfile} from './render-profile.js?v=balaji-2';
import {createMotionResolution,createTowerPicker} from './interaction-performance.js?v=approved-materials-1';
import {partitionFacadeFaces,createFacadeCuller} from './facade-performance.js?v=balaji-2';
import {optimizeFiniteLights} from './finite-light-performance.js?v=balaji-2';
import {shareFinishTextures} from './finish-materials.js?v=textured-finishes-1';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const canvas=$('#scene'),host=$('#viewport'),stage=$('#viewer');
const scene=new T.Scene();scene.background=new T.Color(0xb5d6e7);scene.fog=new T.FogExp2(0xc4d6d6,.00082);
const camera=new T.PerspectiveCamera(28,1,.35,1800);
optimizeFiniteLights();
const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;renderer.shadowMap.autoUpdate=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.AgXToneMapping;renderer.toneMappingExposure=1.3;
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.10;controls.maxPolarAngle=Math.PI/2-.025;controls.minDistance=38;controls.maxDistance=850;controls.autoRotateSpeed=.62;controls.zoomSpeed=.72;controls.rotateSpeed=.65;controls.target.set(0,32,0);
canvas.tabIndex=0;controls.listenToKeyEvents(canvas);
const profile=createRenderProfile(canvas,renderer),pipeline=createSmoothRenderer(renderer,scene,camera);
canvas.dataset.build='balaji-textured-finishes-1';
const ambient=new T.HemisphereLight(0xe2f1ff,0x6b7256,.48),sun=new T.DirectionalLight(0xfff0dc,2.3),fill=new T.DirectionalLight(0xd6eaff,.28);scene.add(ambient,sun,fill);
sun.position.set(-180,140,140);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-115,right:115,top:110,bottom:-110,near:10,far:650});sun.shadow.bias=-.00004;sun.shadow.normalBias=.025;sun.shadow.radius=4;sun.shadow.blurSamples=8;fill.position.set(120,115,20);
let activeView='courtyard';
const presets={facade:{p:[-26,38.5,53],t:[-29,37.8,44],fov:55,minDistance:3,name:'Facade detail'},interior:{p:[-28,37.6,38],t:[6,20,20],fov:65,name:'Inside floor 11'},courtyard:{p:[155,64,260],t:[0,35,2],name:'The residential courtyard'},aerial:{p:[-45,210,135],t:[0,12,0],name:'Aerial'},street:{p:[30,20,145],t:[0,33,10],name:'The boulevard'},plan:{p:[0,260,.01],t:[0,0,0],name:'Site plan'}};
let site,towers=[],pickTower,cullFacades,updateLOD,updateMaterialLOD,lighting,detail,tours,dirty=true,transition=null,walk=false,walkYaw=-.5,walkPitch=.02,drag=null,press=null,last=0,planOpen=false,elevationOpen=false;
let frameRequest=0,viewportVisible=true,ready=false,interacting=false;
const keys=new Set(),labels=[],ray=new T.Raycaster(),pointer=new T.Vector2(),context=new T.Group();context.name='Illustrative city blocks';context.visible=false;scene.add(context);
function requestFrame(){if(ready&&!frameRequest&&!document.hidden&&viewportVisible)frameRequest=requestAnimationFrame(animate);}
function invalidate(){dirty=true;requestFrame();}
let drawRatio=renderer.getPixelRatio();
const motionResolution=createMotionResolution({getPixelRatio:()=>drawRatio,setPixelRatio:v=>{drawRatio=v;}},canvas,invalidate);
function announce(message){$('#announcement').textContent=message;if(/video|recording/i.test(message))$('#clip-status').textContent=message;}
function fitted(p,t){const target=new T.Vector3(...t);return new T.Vector3(...p).sub(target).multiplyScalar(Math.max(1,1.25/camera.aspect)).add(target);}
function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;const next=r.width/r.height;for(const marker of labels)marker.width=0;if(!walk&&!transition&&activeView!=='interior'){const scale=Math.max(1,1.25/next)/Math.max(1,1.25/camera.aspect);camera.position.sub(controls.target).multiplyScalar(scale).add(controls.target);}camera.aspect=next;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);invalidate();}
new ResizeObserver(resize).observe(host);
new IntersectionObserver(([entry])=>{viewportVisible=entry.isIntersecting;if(viewportVisible)invalidate();}).observe(host);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameRequest);frameRequest=0;last=0;}else invalidate();});
function moveCamera(p,t,duration=400){transition={start:performance.now(),duration,p0:camera.position.clone(),t0:controls.target.clone(),p,t};invalidate();}
function view(name){if(walk)exitWalk();const v=presets[name];if(!v)return;activeView=name;controls.minDistance=v.minDistance||38;camera.fov=v.fov||28;camera.updateProjectionMatrix();transition={start:performance.now(),p0:camera.position.clone(),t0:controls.target.clone(),p:name==='interior'?new T.Vector3(...v.p):fitted(v.p,v.t),t:new T.Vector3(...v.t)};$('#view-name').textContent=v.name;$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));invalidate();}
function selectTower(id){transition=null;motionResolution.stop();updateMaterialLOD?.(false);if(!id){view('courtyard');return;}if(walk)exitWalk();$('#tower').value=id;$('#plan-building').value=id;floorChoices();detail.open(id);}
function label(spec){const el=document.createElement('span');el.className='roof-label';const caption=document.createElement('button');caption.className='roof-caption';caption.textContent=spec.name;caption.setAttribute('aria-label','Explore '+spec.name+' levels');caption.onclick=()=>selectTower(spec.id);const arrow=document.createElement('span');arrow.className='roof-arrow';arrow.setAttribute('aria-hidden','true');arrow.onclick=()=>selectTower(spec.id);el.append(caption,arrow);host.append(el);labels.push({el,caption,arrow,width:0,height:0,pos:new T.Vector3(spec.labelAnchor?.[0]??spec.x,spec.floors*3.1+13,spec.labelAnchor?.[1]??spec.z)});}
function updateOverlays(){
 const w=host.clientWidth,h=host.clientHeight,visible=[];
 for(const marker of labels){const p=marker.pos.clone().project(camera),x=(p.x+1)/2*w,y=(1-p.y)/2*h-3;marker.el.hidden=walk||activeView==='interior'||p.z>1||x<0||x>w||y<0||y>h;if(!marker.el.hidden)visible.push({marker,x,y});}
 for(const {marker} of visible)if(!marker.width){marker.width=marker.caption.offsetWidth;marker.height=marker.caption.offsetHeight;}
 const placed=[];
 for(const {marker,x,y} of visible.sort((a,b)=>b.y-a.y)){
  const left=Math.max(2,Math.min(w-marker.width-2,x-marker.width/2));let top=y-19-marker.height;
  for(const box of placed)if(left<box.right+3&&left+marker.width>box.left-3&&top<box.bottom+3&&top+marker.height+19>box.top-3)top=box.top-marker.height-23;
  top=Math.max(2,top);placed.push({left,right:left+marker.width,top,bottom:top+marker.height+19});placed.sort((a,b)=>b.top-a.top);
  marker.el.style.transform=`translate(${x}px,${y}px)`;marker.caption.style.left=(left-x)+'px';marker.caption.style.top=(top-y)+'px';marker.arrow.style.left=(left+marker.width/2-x-8)+'px';marker.arrow.style.top=(top-y+marker.height+4)+'px';marker.arrow.style.bottom='auto';
 }
 const hotspots=[];
 for(const [id,p] of [['pool-hotspot',[25.5,3,-7.8]],['garden-hotspot',[-9.6,3,-3.3]]]){const node=$('#'+id),q=new T.Vector3(...p).project(camera),x=(q.x+1)/2*w,y=(1-q.y)/2*h;node.hidden=walk||activeView==='interior'||$('#view-name').textContent==='Site plan'||q.z>1||x<30||x>w-30||y<75||y>h-100;if(!node.hidden)hotspots.push({node,x,y});}
 spaceWalkHotspots(hotspots);
 for(const item of hotspots){item.node.style.left=item.x+'px';item.node.style.top=item.y+'px';}
}
function enterWalk(zone='garden'){transition=null;motionResolution.stop();walk=true;controls.enabled=false;controls.autoRotate=false;$('#rotate').setAttribute('aria-pressed','false');camera.position.set(...(zone==='pool'?[13,3.6,-12]:[-24,3.6,22]));walkYaw=zone==='pool'?-1.57:-.4;walkPitch=.02;tours.show(true);$('#walk-zone-title').textContent=zone==='pool'?'Pool terrace':'The courtyard';$('#walk-status').textContent='Drag to look · WASD or arrows to walk';$('#walk-hotspots').hidden=true;$('.scene-bottom').hidden=true;$$('[data-walk-zone]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.walkZone===zone)));invalidate();}
function exitWalk(){tours?.show(false);walk=false;keys.clear();controls.enabled=!planOpen&&!elevationOpen;controls.target.copy(camera.position).add(new T.Vector3(-Math.sin(walkYaw)*20,0,-Math.cos(walkYaw)*20));$('#walk-hotspots').hidden=false;$('.scene-bottom').hidden=false;invalidate();}
function walkFrame(dt){const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);const speed=8*dt,dx=(-Math.sin(walkYaw)*forward+Math.cos(walkYaw)*side)*speed,dz=(-Math.cos(walkYaw)*forward-Math.sin(walkYaw)*side)*speed;
  if(canWalk(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(canWalk(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
  camera.lookAt(camera.position.clone().add(new T.Vector3(-Math.sin(walkYaw)*Math.cos(walkPitch),Math.sin(walkPitch),-Math.cos(walkYaw)*Math.cos(walkPitch))));invalidate();
}
function animate(now){frameRequest=0;if(document.hidden||!viewportVisible)return;const dt=Math.min(.05,(now-last)/1000||.016);last=now;if(transition){if(!motionResolution.active)motionResolution.start();const t=Math.min(1,(now-transition.start)/(transition.duration||900)),e=1-(1-t)**3;camera.position.lerpVectors(transition.p0,transition.p,e);controls.target.lerpVectors(transition.t0,transition.t,e);invalidate();if(t===1){transition=null;motionResolution.stop();}}
  if(walk&&(keys.size||tours.running)&&!motionResolution.active)motionResolution.start();if(walk&&!keys.size&&!tours.running&&!drag&&motionResolution.active)motionResolution.stop();
  if(walk&&!tours.update(dt)&&(dirty||keys.size))walkFrame(dt);const changed=controls.enabled&&controls.update(dt);
  if(changed&&!transition&&!walk&&!motionResolution.active)motionResolution.start();
  if(!changed&&!interacting&&!transition&&!walk&&!controls.autoRotate&&motionResolution.active)motionResolution.stop();
  canvas.dataset.cameraSettled=String(!changed&&!transition&&!interacting&&!controls.autoRotate);
  if(!planOpen&&!elevationOpen&&(dirty||changed||controls.autoRotate)){profile.begin(now);const shadowsPending=renderer.shadowMap.needsUpdate;updateLOD(camera,motionResolution.active,shadowsPending);updateMaterialLOD(motionResolution.active);cullFacades(camera,shadowsPending);pipeline.render(drawRatio,motionResolution.active);updateOverlays();profile.end();motionResolution.sample(now);dirty=shadowsPending;}
  if(!planOpen&&!elevationOpen&&(dirty||changed||transition||(controls.enabled&&controls.autoRotate)||(walk&&(keys.size||tours.running))))requestFrame();else last=0;
}
function floorChoices(){const spec=towerSpecs.find(s=>s.id===$('#plan-building').value);$('#plan-floor').replaceChildren();$('#plan-floor').disabled=!spec;$('#open-floor-plan').disabled=!spec;if(!spec)return;for(let n=0;n<=spec.floors;n++)$('#plan-floor').add(new Option(n===0?'Ground floor':'Floor '+n,String(n)));$('#plan-floor').value='2';$('#plan-availability').textContent=spec.plan?'Original floor drawing available':spec.id==='G'?'Original ground-floor drawing available. Residential-floor plan not supplied.':'Drawing not supplied for this building';}
function bind(){
  $('#browse-plans').onclick=()=>openPlanExplorer($('#plan-building').value||'NOVA',Number($('#plan-floor').value)||1);
  for(const spec of towerSpecs)$('#tower').add(new Option(spec.name,spec.id));$('#tower').onchange=()=>selectTower($('#tower').value);$('#plan-building').add(new Option('Choose a building',''));for(const s of towerSpecs)$('#plan-building').add(new Option(s.name,s.id));$('#plan-building').onchange=floorChoices;const openSelectedFloor=()=>{const id=$('#plan-building').value,n=Number($('#plan-floor').value);$('#plan-availability').textContent=hasTypicalPlan(id,n)?'Original floor drawing available':'Drawing not supplied for this floor';openPlanExplorer(id,n);};$('#open-floor-plan').onclick=openSelectedFloor;$('#plan-floor').onchange=openSelectedFloor;
  $$('button[data-lighting]').forEach(b=>b.onclick=()=>lighting.set(b.dataset.lighting));$$('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$$('[data-place]').forEach(b=>b.onclick=()=>{view({residences:'courtyard',garden:'aerial',pool:'courtyard',retail:'street'}[b.dataset.place]);$$('[data-place]').forEach(p=>p.classList.toggle('active',p===b));if(b.dataset.place==='pool')transition={start:performance.now(),p0:camera.position.clone(),t0:controls.target.clone(),p:fitted([6,23,14],[25.5,2,-7.8]),t:new T.Vector3(25.5,2,-7.8)};});
  $('#rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;if(controls.autoRotate)motionResolution.start();$('#rotate').setAttribute('aria-pressed',String(controls.autoRotate));invalidate();};
  for(const [id,scale] of [['zoom-in',.84],['zoom-out',1.18]])$('#'+id).onclick=()=>{moveCamera(camera.position.clone().sub(controls.target).multiplyScalar(scale).add(controls.target),controls.target.clone(),320);};
  $$('[data-orbit]').forEach(b=>b.onclick=()=>{const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),b.dataset.orbit==='left'?.12:-.12);moveCamera(controls.target.clone().add(offset),controls.target.clone(),300);});$('#reset').onclick=()=>view('courtyard');
  $('#context').onclick=()=>{context.visible=!context.visible;$('#context').setAttribute('aria-pressed',String(context.visible));renderer.shadowMap.needsUpdate=true;invalidate();};$('#fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():stage.requestFullscreen?.();
  $$('[data-enter-walk]').forEach(b=>b.onclick=()=>enterWalk(b.dataset.enterWalk));$$('[data-walk-zone]').forEach(b=>b.onclick=()=>enterWalk(b.dataset.walkZone));$('#exit-walk').onclick=()=>{exitWalk();view('courtyard');};
  $$('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);tours.stop();keys.add(b.dataset.move);invalidate();};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.move);});
  canvas.addEventListener('pointerdown',e=>{press=e.button===0?[e.clientX,e.clientY]:null;if(walk){tours.stop();drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(walk&&drag){walkYaw-=(e.clientX-drag[0])*.005;walkPitch=T.MathUtils.clamp(walkPitch-(e.clientY-drag[1])*.005,-1.1,1.1);drag=[e.clientX,e.clientY];invalidate();}});
  canvas.addEventListener('pointercancel',()=>{press=null;drag=null;});canvas.addEventListener('pointerup',e=>{const down=press;press=null;drag=null;if(walk||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const id=pickTower(ray);if(id)selectTower(id);else{const point=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-2.2),new T.Vector3());if(point&&Math.abs(point.x-25.5)<9&&Math.abs(point.z+7.8)<7)enterWalk('pool');}});
  controls.addEventListener('start',()=>{interacting=true;transition=null;motionResolution.start();});controls.addEventListener('end',()=>{interacting=false;invalidate();});controls.addEventListener('change',invalidate);
  window.addEventListener('keydown',e=>{if($$('dialog[open]').length)return;const k=e.key.toLowerCase();if(k==='escape'){if(walk)exitWalk();view('courtyard');}if(walk&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();tours.stop();keys.add(k);invalidate();}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('plan-explorer-state',e=>{planOpen=e.detail.open;if(planOpen)motionResolution.stop();else if(controls.autoRotate)motionResolution.start();controls.enabled=!walk&&!planOpen&&!elevationOpen;invalidate();});document.addEventListener('tower-detail-state',e=>{elevationOpen=e.detail.open;if(elevationOpen)motionResolution.stop();else if(controls.autoRotate)motionResolution.start();if(!elevationOpen)$('#tower').value='';controls.enabled=!walk&&!planOpen&&!elevationOpen;invalidate();});
}
async function init(){try{
  const dayEnvironment=await prepareMaterials(renderer,invalidate),built=buildSite();site=built.root;towers=built.towers;scene.add(site);
  const decoder=new DRACOLoader().setDecoderPath('shared/vendor/draco/').setDecoderConfig({type:'wasm'}).setWorkerLimit(2);
  const loader=new GLTFLoader().setDRACOLoader(decoder);
  const [detailed,moving,landscape]=await Promise.all([loader.loadAsync('assets/balaji-towers-pbr.glb?v=textured-finishes-1'),loader.loadAsync('assets/balaji-motion-pbr.glb?v=textured-finishes-1'),loader.loadAsync('assets/balaji-site-pbr.glb?v=textured-finishes-1')]);decoder.dispose();site.add(landscape.scene);landscape.scene.traverse(o=>{if(o.isMesh){o.castShadow=!o.name.startsWith('native-glass-');o.receiveShadow=true;if(o.name==='paving'){o.material.map=materials.path.map;o.material.bumpMap=materials.path.bumpMap;o.material.bumpScale=.025;}}});
  canvas.dataset.finishTextures=JSON.stringify(shareFinishTextures([detailed.scene,moving.scene,landscape.scene]));
  const motionById=new Map();moving.scene.traverse(object=>{if(object.userData.id)motionById.set(object.userData.id,object);});
  const byId=new Map();detailed.scene.traverse(object=>{if(object.userData.id)byId.set(object.userData.id,object);});
  for(const tower of towers){const source=byId.get(tower.userData.id);if(!source)throw Error('Detailed facade missing for '+tower.userData.id);
    tower.traverse(object=>{if(object.isMesh)object.geometry.dispose();});tower.clear();const full=new T.Group();full.userData.renderTier='detail';for(const child of [...source.children])full.add(child);tower.add(full);
    const fast=motionById.get(tower.userData.id);if(!fast)throw Error('Motion model missing '+tower.userData.id);fast.userData.renderTier='motion';fast.visible=false;tower.add(fast);
    tower.traverse(object=>{if(object.isMesh){object.castShadow=!object.name.startsWith('native-glass-');object.receiveShadow=true;for(const map of [object.material.map,object.material.normalMap,object.material.roughnessMap,object.material.metalnessMap])if(map){map.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());map.needsUpdate=true;}}});
  }
  for(const tower of towers)partitionFacadeFaces(tower);cullFacades=createFacadeCuller(site);updateLOD=createModelLOD(towers,canvas);
  pickTower=createTowerPicker(towers);canvas.dataset.facadeSource='Approved Blender geometry and portable PBR materials';canvas.dataset.materialBuild='textured-finishes-1';canvas.dataset.continuousFloorLayers=String(towers.filter(t=>t.children.some(c=>c.userData.renderTier==='detail'&&c.children.some(o=>o.userData.structuralFloorLayers))).length);
  lighting=createLighting({scene,renderer,sun,hemi:ambient,fill,site,towers,invalidate,announce,dayEnvironment});lighting.set('day');
  updateMaterialLOD=createSceneMaterialLOD(site);
  detail=createTowerDetail({towers,lighting,snapshot:()=>{pipeline.render(drawRatio);return canvas.toDataURL('image/jpeg',.86);},openPlan:openPlanExplorer,getEnvironment:()=>({texture:scene.environment,intensity:scene.environmentIntensity})});
  tours=createTours({canvas,camera,enterWalk,isWalking:()=>walk,invalidate,toast:announce,onPose:d=>{walkYaw=Math.atan2(-d.x,-d.z);walkPitch=Math.asin(d.y);}});
  stage.append($('#labels'));$('#labels').hidden=false;towerSpecs.forEach(label);
  const mat=new T.MeshStandardMaterial({color:0xa7ac9f,roughness:1});for(let i=0;i<18;i++){const h=8+(i%5)*4,b=new T.Mesh(new T.BoxGeometry(18,h,24),mat);b.position.set(i%2?-205:205,h/2,-175+Math.floor(i/2)*40);context.add(b);}
  bind();const initialView=new URLSearchParams(location.search).get('view');activeView=initialView==='interior'||initialView==='facade'?initialView:'courtyard';const initial=presets[activeView];controls.minDistance=initial.minDistance||38;camera.fov=initial.fov||28;resize();camera.updateProjectionMatrix();camera.position.copy(activeView==='interior'?new T.Vector3(...initial.p):fitted(initial.p,initial.t));controls.target.set(...initial.t);controls.update();$('#view-name').textContent=initial.name;$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===activeView)));
  $('#loading-message').textContent='Preparing facade reflections and lighting…';
  lighting.set('evening');await pipeline.compile();lighting.set('night');await pipeline.compile();lighting.set('day');await pipeline.compile();
  updateLOD(camera,true,false);updateMaterialLOD(true);for(const mode of ['evening','night','day']){lighting.set(mode);await pipeline.compile();}cullFacades(camera,true);pipeline.render(drawRatio,true);updateLOD(camera,false,false);updateMaterialLOD(false);renderer.shadowMap.needsUpdate=true;cullFacades(camera,true);pipeline.render(drawRatio,false);
  $('#loading').hidden=true;ready=true;invalidate();
  const requestedPlan=new URLSearchParams(location.search);if(requestedPlan.has('plan'))openPlanExplorer(requestedPlan.get('tower')||'NOVA',Number(requestedPlan.get('floor')||2));
}catch(error){console.error(error);$('#loading').hidden=true;$('#error').hidden=false;}}
init();
