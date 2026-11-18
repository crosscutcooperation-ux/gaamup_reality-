import {spaceWalkHotspots} from './shared/overlay-layout.js';
import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {OrbitControls} from './vendor/OrbitControls.js';
import {buildSite,towerSpecs} from './model.js?v=daylight-1';
import {createLighting,prepareMaterials} from './lighting.js?v=daylight-1';
import {createAtmosphere} from './site-atmosphere.js';
import {createTowerDetail} from './tower-detail.js?v=elements-23';
import {openPlanExplorer} from './plan-explorer.js?v=elements-23';
import {createTours} from './tours.js?v=elements-22';
import {canWalk} from './walk-navigation.js?v=elements-22';
import {GLTFLoader} from './shared/vendor/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from './shared/vendor/addons/loaders/DRACOLoader.js';
import {createRenderProfile} from './render-profile.js?v=elements-22';
import {createTowerPicker} from './interaction-performance.js?v=elements-22';
import {optimizeFiniteLights} from './finite-light-performance.js?v=elements-22';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const canvas=$('#scene'),host=$('#viewport'),stage=$('#viewer');
const scene=new T.Scene();scene.background=new T.Color(0xb5d6e7);scene.fog=new T.FogExp2(0xc4d6d6,.00082);
const camera=new T.PerspectiveCamera(39,1,.35,1800);
optimizeFiniteLights();
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1;
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.10;controls.maxPolarAngle=Math.PI/2-.025;controls.minDistance=38;controls.maxDistance=750;controls.autoRotateSpeed=.62;controls.zoomSpeed=.72;controls.rotateSpeed=.65;controls.target.set(0,42,-30);
canvas.tabIndex=0;controls.listenToKeyEvents(canvas);
const profile=createRenderProfile(canvas,renderer);
canvas.dataset.build='elements-daylight-1';
const ambient=new T.HemisphereLight(0xe2f1ff,0x6b7256,.48),sun=new T.DirectionalLight(0xfff0dc,2.3),fill=new T.DirectionalLight(0xd6eaff,.28);scene.add(ambient,sun,fill);
sun.position.set(-160,205,195);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-95,right:95,top:105,bottom:-95,near:10,far:650});sun.shadow.bias=-.00008;sun.shadow.normalBias=.08;fill.position.set(100,100,-200);
const presets={courtyard:{p:[-74,78,141],t:[1,43,4],name:'The residential courtyard'},aerial:{p:[0,200,10],t:[0,5,0],name:'Aerial'},street:{p:[85,20,-95],t:[0,30,0],name:'The boulevard'},plan:{p:[0,240,0],t:[0,0,0],name:'Site plan'}};
let site,towers=[],pickTower,lighting,detail,tours,atmosphere,dirty=true,transition=null,walk=false,walkYaw=-.5,walkPitch=.02,drag=null,press=null,last=0,planOpen=false,elevationOpen=false;
let frameRequest=0,viewportVisible=true,ready=false,interacting=false;
const keys=new Set(),labels=[],ray=new T.Raycaster(),pointer=new T.Vector2(),context=new T.Group();context.name='Illustrative city blocks';context.visible=false;scene.add(context);
function requestFrame(){if(ready&&!frameRequest&&!document.hidden&&viewportVisible)frameRequest=requestAnimationFrame(animate);}
function invalidate(){dirty=true;requestFrame();}
function announce(message){$('#announcement').textContent=message;if(/video|recording/i.test(message))$('#clip-status').textContent=message;}
function fitted(p,t){const target=new T.Vector3(...t);return new T.Vector3(...p).sub(target).multiplyScalar(Math.max(1,.95/camera.aspect)).add(target);}
function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;const next=r.width/r.height;for(const marker of labels)marker.width=0;if(!walk&&!transition){const scale=Math.max(1,.95/next)/Math.max(1,.95/camera.aspect);camera.position.sub(controls.target).multiplyScalar(scale).add(controls.target);}camera.aspect=next;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);invalidate();}
new ResizeObserver(resize).observe(host);
new IntersectionObserver(([entry])=>{viewportVisible=entry.isIntersecting;if(viewportVisible)invalidate();}).observe(host);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameRequest);frameRequest=0;last=0;}else invalidate();});
function moveCamera(p,t,duration=400){transition={start:performance.now(),duration,p0:camera.position.clone(),t0:controls.target.clone(),p,t};invalidate();}
function view(name){if(walk)exitWalk();const v=presets[name];if(!v)return;transition={start:performance.now(),p0:camera.position.clone(),t0:controls.target.clone(),p:fitted(v.p,v.t),t:new T.Vector3(...v.t)};$('#view-name').textContent=v.name;$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));invalidate();}
function selectTower(id){setDrawer(false);setRotation(false);transition=null;if(!id){view('courtyard');return;}if(walk)exitWalk();$('#tower').value=id;$('#plan-building').value=id;floorChoices();detail.open(id);}
function label(spec){const el=document.createElement('span');el.className='roof-label';const caption=document.createElement('button');caption.className='roof-caption';caption.textContent=spec.name;caption.setAttribute('aria-label','Explore '+spec.name+' levels');caption.onclick=()=>selectTower(spec.id);const arrow=document.createElement('span');arrow.className='roof-arrow';arrow.setAttribute('aria-hidden','true');arrow.onclick=()=>selectTower(spec.id);el.append(caption,arrow);host.append(el);labels.push({el,caption,arrow,width:0,height:0,pos:new T.Vector3(spec.x,spec.floors*3.05+16,spec.z)});}
function updateOverlays(){
 const w=host.clientWidth,h=host.clientHeight,visible=[];
 for(const marker of labels){const p=marker.pos.clone().project(camera),x=(p.x+1)/2*w,y=(1-p.y)/2*h-3;marker.el.hidden=walk||p.z>1||x<0||x>w||y<0||y>h;if(!marker.el.hidden)visible.push({marker,x,y});}
 for(const {marker} of visible)if(!marker.width){marker.width=marker.caption.offsetWidth;marker.height=marker.caption.offsetHeight;}
 const placed=[];
 for(const {marker,x,y} of visible.sort((a,b)=>b.y-a.y)){
  const left=Math.max(2,Math.min(w-marker.width-2,x-marker.width/2));let top=y-19-marker.height;
  for(const box of placed)if(left<box.right+3&&left+marker.width>box.left-3&&top<box.bottom+3&&top+marker.height+19>box.top-3)top=box.top-marker.height-23;
  top=Math.max(2,top);placed.push({left,right:left+marker.width,top,bottom:top+marker.height+19});placed.sort((a,b)=>b.top-a.top);
  marker.el.style.transform=`translate(${x}px,${y}px)`;marker.caption.style.left=(left-x)+'px';marker.caption.style.top=(top-y)+'px';marker.arrow.style.left=(left+marker.width/2-x-8)+'px';marker.arrow.style.top=(top-y+marker.height+4)+'px';marker.arrow.style.bottom='auto';
 }
 const hotspots=[];
 for(const [id,p] of [['pool-hotspot',[-15,8,28]],['garden-hotspot',[17,8,-36]]]){const node=$('#'+id),q=new T.Vector3(...p).project(camera),x=(q.x+1)/2*w,y=(1-q.y)/2*h;node.hidden=walk||$('#view-name').textContent==='Site plan'||q.z>1||x<30||x>w-30||y<75||y>h-100;if(!node.hidden)hotspots.push({node,x,y});}
 spaceWalkHotspots(hotspots);
 for(const item of hotspots){item.node.style.left=item.x+'px';item.node.style.top=item.y+'px';}
}
function enterWalk(zone='garden'){setDrawer(false);send('view',{view:'walk'});stage.dataset.mode='walk';$('#walk-launcher').hidden=true;$('#show-scene-help').hidden=true;transition=null;walk=true;controls.enabled=false;setRotation(false);camera.position.set(...(zone==='pool'?[-24,8.7,27]:[26,8.7,-44]));walkYaw=zone==='pool'?-1.57:2.3;walkPitch=.02;tours.show(true);$('#walk-zone-title').textContent=zone==='pool'?'Pool terrace':'The courtyard';$('#walk-status').textContent='Drag to look · WASD or arrows to walk';$('#walk-hotspots').hidden=true;$('.scene-bottom').hidden=true;$$('[data-walk-zone]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.walkZone===zone)));invalidate();}
function exitWalk(){send('view',{view:'colony'});stage.dataset.mode='colony';$('#walk-launcher').hidden=false;$('#show-scene-help').hidden=false;tours?.show(false);walk=false;keys.clear();controls.enabled=!planOpen&&!elevationOpen;controls.target.copy(camera.position).add(new T.Vector3(-Math.sin(walkYaw)*20,0,-Math.cos(walkYaw)*20));$('#walk-hotspots').hidden=false;$('.scene-bottom').hidden=false;invalidate();}
function walkFrame(dt){const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);const speed=8*dt,dx=(-Math.sin(walkYaw)*forward+Math.cos(walkYaw)*side)*speed,dz=(-Math.cos(walkYaw)*forward-Math.sin(walkYaw)*side)*speed;
  if(canWalk(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(canWalk(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
  camera.lookAt(camera.position.clone().add(new T.Vector3(-Math.sin(walkYaw)*Math.cos(walkPitch),Math.sin(walkPitch),-Math.cos(walkYaw)*Math.cos(walkPitch))));invalidate();
}
function animate(now){
  frameRequest=0;if(document.hidden||!viewportVisible)return;
  const dt=Math.min(.05,(now-last)/1000||.016);last=now;
  if(transition){const t=Math.min(1,(now-transition.start)/(transition.duration||900)),e=1-(1-t)**3;camera.position.lerpVectors(transition.p0,transition.p,e);controls.target.lerpVectors(transition.t0,transition.t,e);invalidate();if(t===1)transition=null;}
  if(walk&&!tours.update(dt)&&(dirty||keys.size))walkFrame(dt);
  const changed=controls.enabled&&controls.update(dt);
  canvas.dataset.cameraSettled=String(!changed&&!transition&&!interacting&&!controls.autoRotate);
  if(!planOpen&&!elevationOpen&&(dirty||changed||controls.autoRotate)){
    profile.begin(now);renderer.render(scene,camera);updateOverlays();profile.end();dirty=renderer.shadowMap.needsUpdate;
  }
  if(!planOpen&&!elevationOpen&&(dirty||changed||transition||(controls.enabled&&controls.autoRotate)||(walk&&(keys.size||tours.running))))requestFrame();else last=0;
}
function floorChoices(){const spec=towerSpecs.find(s=>s.id===$('#plan-building').value);$('#plan-floor').replaceChildren();$('#plan-floor').disabled=!spec;$('#open-floor-plan').disabled=!spec;if(!spec)return;for(let n=0;n<=spec.floors;n++)$('#plan-floor').add(new Option(n===0?'Ground floor':'Floor '+n,String(n)));$('#plan-floor').value=spec.id==='G'?'0':'2';$('#plan-availability').textContent=spec.plan?'Original floor drawing available':spec.id==='G'?'Original ground-floor drawing available. Residential-floor plan not supplied.':'Drawing not supplied for this building';}
function setDrawer(open){$('#explore-drawer').hidden=!open;$('#explore-toggle').setAttribute('aria-expanded',String(open));}
function send(type,detail={}){if(window.parent!==window)window.parent.postMessage({source:'aero-scene',type,...detail},'*');}
function setRotation(on){
  controls.autoRotate = on;
  const button = $('#rotate');
  button.setAttribute('aria-pressed', String(on));
  button.setAttribute('aria-label', on ? 'Pause 360 degree rotation' : 'Start 360 degree rotation');
  invalidate();
}
function bind(){
  $('#explore-toggle').onclick=()=>setDrawer($('#explore-drawer').hidden);$('#close-explore').onclick=()=>setDrawer(false);
  $('#show-scene-help').onclick=()=>{const first=labels[0]?.caption;first?.focus();first?.animate([{scale:1},{scale:1.15},{scale:1}],{duration:750,iterations:2});};
  const amenityMenu=$('#amenity-menu');for(const [name,place] of [['Swimming pool','pool'],['Landscaped gardens','garden'],['Retail promenade','retail'],['Fitness & wellbeing','garden'],['Children’s play area','garden']]){const button=document.createElement('button');button.className='place';button.textContent=name;button.onclick=()=>{setDrawer(false);document.querySelector(`[data-place="${place}"]`)?.click();};amenityMenu.append(button);}
  window.addEventListener('message',event=>{if(event.source!==parent||event.data?.source!=='aero-controls')return;if(event.data.action==='floor-picker'){setDrawer(true);$('#plan-building').focus();}});
  $('#browse-plans').onclick=()=>openPlanExplorer($('#plan-building').value||'T1',Number($('#plan-floor').value)||1);
  $('#tower').onchange=()=>selectTower($('#tower').value);$('#plan-building').add(new Option('Choose a building',''));for(const s of towerSpecs)$('#plan-building').add(new Option(s.name,s.id));$('#plan-building').onchange=floorChoices;const openSelectedFloor=()=>openPlanExplorer($('#plan-building').value,Number($('#plan-floor').value));$('#open-floor-plan').onclick=openSelectedFloor;$('#plan-floor').onchange=openSelectedFloor;
  $$('button[data-lighting]').forEach(b=>b.onclick=()=>lighting.set(b.dataset.lighting));$$('[data-view]').forEach(b=>b.onclick=()=>{setRotation(false);view(b.dataset.view);});$$('[data-place]').forEach(b=>b.onclick=()=>{view({residences:'courtyard',garden:'aerial',pool:'courtyard',retail:'street'}[b.dataset.place]);$$('[data-place]').forEach(p=>p.classList.toggle('active',p===b));if(b.dataset.place==='pool')transition={start:performance.now(),p0:camera.position.clone(),t0:controls.target.clone(),p:fitted([-69,34,16],[-8,12,-26]),t:new T.Vector3(-8,12,-26)};});
  $('#rotate').onclick=()=>setRotation(!controls.autoRotate);
  for(const [id,scale] of [['zoom-in',.84],['zoom-out',1.18]])$('#'+id).onclick=()=>{moveCamera(camera.position.clone().sub(controls.target).multiplyScalar(scale).add(controls.target),controls.target.clone(),320);};
  $$('[data-orbit]').forEach(b=>b.onclick=()=>{const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),b.dataset.orbit==='left'?.12:-.12);moveCamera(controls.target.clone().add(offset),controls.target.clone(),300);});$('#reset').onclick=()=>{setRotation(false);view('courtyard');};
  $('#context').onclick=()=>{context.visible=!context.visible;$('#context').setAttribute('aria-pressed',String(context.visible));renderer.shadowMap.needsUpdate=true;invalidate();};$('#fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():stage.requestFullscreen?.();
  $$('[data-enter-walk]').forEach(b=>b.onclick=()=>enterWalk(b.dataset.enterWalk));$$('[data-walk-zone]').forEach(b=>b.onclick=()=>enterWalk(b.dataset.walkZone));$('#exit-walk').onclick=()=>{exitWalk();view('courtyard');};
  $$('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);tours.stop();keys.add(b.dataset.move);invalidate();};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.move);});
  canvas.addEventListener('pointerdown',e=>{press=[e.clientX,e.clientY];if(walk){tours.stop();drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(walk&&drag){walkYaw-=(e.clientX-drag[0])*.005;walkPitch=T.MathUtils.clamp(walkPitch-(e.clientY-drag[1])*.005,-1.1,1.1);drag=[e.clientX,e.clientY];invalidate();}});
  canvas.addEventListener('pointerup',e=>{drag=null;if(walk||!press||Math.hypot(e.clientX-press[0],e.clientY-press[1])>5)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const id=pickTower(ray);if(id)selectTower(id);else{const point=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-7.1),new T.Vector3());if(point&&Math.abs(point.x+20)<25&&Math.abs(point.z+25)<32)enterWalk('pool');}});
  controls.addEventListener('start',()=>{interacting=true;transition=null;setRotation(false);});controls.addEventListener('end',()=>{interacting=false;invalidate();});controls.addEventListener('change',invalidate);
  window.addEventListener('keydown',e=>{if($$('dialog[open]').length)return;const k=e.key.toLowerCase();if(k==='escape'){if(walk)exitWalk();view('courtyard');}if(walk&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();tours.stop();keys.add(k);invalidate();}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
  document.addEventListener('plan-explorer-state',e=>{planOpen=e.detail.open;send('view',{view:planOpen?'floor':elevationOpen?'building':'colony'});controls.enabled=!walk&&!planOpen&&!elevationOpen;invalidate();});
  document.addEventListener('tower-detail-state',e=>{elevationOpen=e.detail.open;send('view',{view:elevationOpen?'building':planOpen?'floor':'colony'});if(!elevationOpen)$('#tower').value='';controls.enabled=!walk&&!planOpen&&!elevationOpen;invalidate();});
}
async function init(){try{
  const dayEnvironment=await prepareMaterials(renderer,invalidate),built=buildSite();site=built.root;towers=built.towers;scene.add(site);atmosphere=createAtmosphere(scene,invalidate);setInterval(()=>{if(!document.hidden&&viewportVisible&&atmosphere?.update(performance.now()))invalidate();},100);
  const decoder=new DRACOLoader().setDecoderPath('shared/vendor/draco/').setDecoderConfig({type:'wasm'}).setWorkerLimit(2);
  const loader=new GLTFLoader().setDRACOLoader(decoder);
  const detailed=await loader.loadAsync('assets/elements-towers.glb?v=facades-1');decoder.dispose();
  const byId=new Map();detailed.scene.traverse(object=>{if(object.userData.id)byId.set(object.userData.id,object);});
  detailed.scene.traverse(object=>{if(!object.isMesh)return;for(const material of Array.isArray(object.material)?object.material:[object.material])for(const texture of Object.values(material))if(texture?.isTexture)texture.anisotropy=renderer.capabilities.getMaxAnisotropy();});
  for(const tower of towers){const source=byId.get(tower.userData.id);if(!source)throw Error('Detailed facade missing for '+tower.userData.id);
    tower.traverse(object=>{if(object.isMesh)object.geometry.dispose();});tower.clear();const full=new T.Group();full.userData.renderTier='detail';for(const child of [...source.children])full.add(child);tower.add(full);
    tower.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  }
  pickTower=createTowerPicker(towers);canvas.dataset.facadeSource='Blender solid architecture, no facade photographs';
  lighting=createLighting({scene,renderer,sun,hemi:ambient,fill,site,towers,invalidate,announce,dayEnvironment});lighting.set('day');
  detail=createTowerDetail({towers,lighting,snapshot:()=>{renderer.render(scene,camera);return canvas.toDataURL('image/jpeg',.86);},openPlan:openPlanExplorer,getEnvironment:()=>({texture:scene.environment,intensity:scene.environmentIntensity})});
  tours=createTours({canvas,camera,enterWalk,isWalking:()=>walk,invalidate,toast:announce,onPose:d=>{walkYaw=Math.atan2(-d.x,-d.z);walkPitch=Math.asin(d.y);}});
  stage.append($('#labels'));$('#labels').hidden=false;towerSpecs.forEach(label);
  const mat=new T.MeshStandardMaterial({color:0xa7ac9f,roughness:1});for(let i=0;i<18;i++){const h=8+(i%5)*4,b=new T.Mesh(new T.BoxGeometry(18,h,24),mat);b.position.set(i%2?-205:205,h/2,-175+Math.floor(i/2)*40);context.add(b);}
  bind();resize();camera.position.copy(fitted(presets.courtyard.p,presets.courtyard.t));controls.target.set(...presets.courtyard.t);controls.update();
  $('#loading-message').textContent='Preparing facade reflections and lightingâ€¦';
  renderer.compile(scene,camera);renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);
  $('#loading').hidden=true;ready=true;setRotation(!matchMedia('(prefers-reduced-motion: reduce)').matches);send('ready',{playing:controls.autoRotate});invalidate();
}catch(error){console.error(error);$('#loading').hidden=true;$('#error').hidden=false;send('error',{message:'The 3D view could not start.'});}}
init();
