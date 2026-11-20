import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {BUILDINGS,resolvePlan} from '../public/scenes/sai-world-dreams/floor-plan-data.js';
import {LIGHTING_PRESETS} from '../public/scenes/sai-world-dreams/architectural-lighting.js';
import {Window} from './helpers/scene-dom.mjs';
const base=new URL('../public/scenes/sai-world-dreams/',import.meta.url),plans=new URL('assets/plans/',base);
test('every selectable floor preserves the source availability rules',()=>{
  for(const building of BUILDINGS){assert.equal(resolvePlan(building.id,0).available,false);assert.equal(resolvePlan(building.id,-1).available,false);assert.equal(resolvePlan(building.id,building.floors+1).available,false);}
  assert.equal(resolvePlan('orchard',9).available,true);assert.equal(resolvePlan('orchard',9).key,'spring-typical');assert.equal(resolvePlan('orchard',9).sharedReference,'spring');assert.equal(resolvePlan('business',9).available,false);
  assert.equal(resolvePlan('breeze',5).available,false);assert.equal(resolvePlan('breeze',7).key,'breeze-low-refuge');assert.equal(resolvePlan('breeze',12).key,'breeze-high-refuge');assert.equal(resolvePlan('breeze',13).key,'breeze-high-typical');
  assert.equal(resolvePlan('castle',9).verified,false,'Unconfirmed typical-floor assignments stay explicit');
});
test('all 134 selectable houses retain their supplied 2D and furnished image pairs',async()=>{
  let count=0;const families=new Set();
  for(const name of (await readdir(plans)).filter(n=>n.endsWith('-units.json'))){
    const data=JSON.parse(await readFile(new URL(name,plans),'utf8'));const key=name.replace('-units.json','');
    for(const filename of [key+'-floor.png',key+'.json'])assert.ok((await stat(new URL(filename,plans))).size>0,filename);
    for(const unit of data.units){count++;assert.ok(unit.polygons.length);assert.ok(unit.renderPair);families.add(unit.renderPair);
      for(const suffix of ['-flat.webp','-furnished.webp'])assert.ok((await stat(new URL(unit.renderPair+suffix,plans))).size>0,unit.renderPair+suffix);
    }
  }
  assert.equal(count,134);assert.equal(families.size,47);

});
test('day, evening and night retain separate source lighting and window emission',()=>{
  assert.deepEqual(Object.keys(LIGHTING_PRESETS),['day','evening','night']);assert.equal(LIGHTING_PRESETS.day.windows,0);assert.ok(LIGHTING_PRESETS.night.windows>1);assert.ok(LIGHTING_PRESETS.night.lamps>0);assert.ok(LIGHTING_PRESETS.evening.sun[1]<LIGHTING_PRESETS.day.sun[1]);
});
test('the original floor controller completes floor → house → furnished image → rotating model and back',async()=>{
  const win=new Window({url:'http://localhost/scenes/sai-world-dreams/index.html',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true,disableJavaScriptEvaluation:true}});
  win.document.write(await readFile(new URL('index.html',base),'utf8'));
  const calls=[],messages=[];
  Object.assign(globalThis,{window:win,document:win.document,Image:win.Image,Event:win.Event,CustomEvent:win.CustomEvent,ResizeObserver:class{observe(){}disconnect(){}},getComputedStyle:win.getComputedStyle.bind(win),matchMedia:()=>({matches:true}),requestAnimationFrame:fn=>setTimeout(()=>fn(performance.now()+2000),0),cancelAnimationFrame:clearTimeout,parent:{postMessage:data=>messages.push(data)},addEventListener:win.addEventListener.bind(win),__floorCalls:calls});
  win.HTMLImageElement.prototype.decode=async function(){};
  for(const d of win.document.querySelectorAll('dialog')){d.showModal=function(){this.open=true;};d.close=function(){this.open=false;this.dispatchEvent(new win.Event('close'));};}
  win.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){}});
  globalThis.fetch=async path=>{const bytes=await readFile(new URL(String(path).split('?')[0],base));return new Response(bytes);};
  const stub='data:text/javascript,'+encodeURIComponent(`export class FloorPlanViewer {constructor(){globalThis.__floorCalls.push(['created']);}setActive(active){globalThis.__floorCalls.push(['active',active]);}async load(key){globalThis.__floorCalls.push(['floor',key]);}async loadModel(key){globalThis.__floorCalls.push(['model',key]);}reset(){}zoom(){}dispose(){}}`);
  let source=await readFile(new URL('floor-plans.js',base),'utf8');
  source=source.replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p,base).href}'`).replace(/import\('\.\/floor-plan-viewer\.js[^']*'\)/,`import(${JSON.stringify(stub)})`);
  await import('data:text/javascript,'+encodeURIComponent(source));
  const doc=win.document,tick=()=>new Promise(r=>setTimeout(r,25));
  try{
    doc.dispatchEvent(new win.CustomEvent('open-block-floor',{detail:{id:'A',floor:9}}));await tick();
    const dialog=doc.getElementById('floor-plan-dialog');assert.equal(dialog.open,true);assert.equal(dialog.dataset.building,'castle');assert.equal(dialog.dataset.floor,'9');assert.equal(dialog.dataset.plan,'castle-typical');
    assert.ok(doc.querySelectorAll('#apartment-list button').length>0);
    const data=JSON.parse(await readFile(new URL('castle-typical-units.json',plans),'utf8')),unit=data.units[0];doc.querySelector('#apartment-list button').click();
    assert.equal(dialog.classList.contains('apartment'),true);assert.ok(doc.getElementById('floor-plan-image').src.endsWith(unit.renderPair+'-flat.webp'));
    assert.equal(doc.getElementById('apartment-number').textContent,'APARTMENT '+unit.id);
    doc.querySelector('[data-plan-mode="3d"]').click();await tick();
    assert.equal(doc.querySelector('[data-plan-mode="3d"]').textContent,'Furnished view');assert.ok(doc.querySelector('.unit-cutaway').src.endsWith(unit.renderPair+'-furnished.webp'));
    doc.querySelector('[data-plan-mode="rotate"]').click();await tick();assert.deepEqual(calls.find(c=>c[0]==='model'),['model','assets/apartments/castle/typical/'+unit.id+'.glb?v='+JSON.parse(await readFile(new URL('assets/apartments/index.json',base),'utf8')).apartments['castle:typical:'+unit.id].sha256.slice(0,12)]);assert.equal(doc.getElementById('plan-3d').hidden,false);
    doc.getElementById('apartment-back').click();assert.equal(dialog.classList.contains('apartment'),false);assert.equal(dialog.dataset.floor,'9');
    doc.getElementById('plan-next').click();await tick();assert.equal(dialog.dataset.floor,'10');
    doc.dispatchEvent(new win.CustomEvent('open-block-floor',{detail:{id:'E',floor:9}}));await tick();assert.equal(doc.getElementById('plan-empty').hidden,true);assert.equal(dialog.dataset.plan,'spring-typical');assert.match(doc.getElementById('plan-note').textContent,/Orchard preview uses the neighbouring Spring/);
    doc.querySelector('#apartment-list button').click();doc.querySelector('[data-plan-mode="rotate"]').click();await tick();assert.ok(calls.some(c=>c[0]==='model'&&c[1].startsWith('assets/apartments/spring/typical/')));
    doc.getElementById('close-floor-plan').click();assert.equal(dialog.open,false);assert.ok(messages.some(m=>m.view==='unit'&&m.unit===unit.id));
  }finally{await win.happyDOM.close();}
});

test('building selection isolates the original tower, exposes all levels and restores the colony on return',async()=>{
  const {buildSite}=await import('../public/scenes/sai-world-dreams/model.js');
  const {createTowerElevation}=await import('../public/scenes/sai-world-dreams/tower-elevation.js');
  const win=new Window({url:'http://localhost/scenes/sai-world-dreams/index.html',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true,disableJavaScriptEvaluation:true}});
  win.document.write(await readFile(new URL('index.html',base),'utf8'));
  Object.assign(globalThis,{window:win,document:win.document,Event:win.Event,CustomEvent:win.CustomEvent,ResizeObserver:class{observe(){}disconnect(){}},matchMedia:()=>({matches:false}),addEventListener:win.addEventListener.bind(win)});
  const doc=win.document,dialog=doc.getElementById('elevation'),stage=doc.getElementById('elevation-stage'),canvas=doc.getElementById('scene');
  dialog.showModal=function(){this.open=true;};dialog.close=function(){this.open=false;this.dispatchEvent(new win.Event('close'));};
  canvas.animate=()=>({finished:Promise.resolve(),cancel(){}});
  Object.defineProperties(stage,{clientWidth:{get:()=>600},clientHeight:{get:()=>800}});stage.getBoundingClientRect=()=>({left:0,top:0,width:600,height:800});
  const model=buildSite(),tower=model.towers[0],original=tower.parent,rendered=[];let closed=false,openedFloor;
  const facade=tower.getObjectByName('Plan-shaped facade with projecting wings and recessed courts'),sourceMaterial=facade.material;
  const renderer={setSize(){},setClearAlpha(){},render(scene,camera){rendered.push({scene,position:camera.position.clone()});}};
  const elevation=createTowerElevation({renderer,canvas,environment:null,open(){return{x:300,y:400,height:700};},close(){closed=true;}});
  doc.addEventListener('open-block-floor',e=>{openedFloor=e.detail;});
  try{
    elevation.show('A',tower);await new Promise(r=>setTimeout(r,0));
    assert.equal(elevation.active,true);assert.equal(dialog.open,true);assert.notEqual(tower.parent,original);assert.equal(facade.material,sourceMaterial,'The isolated tower retains its original facade material');assert.equal(doc.getElementById('elevation-name').textContent,'Castle');assert.equal(doc.querySelectorAll('#elevation-levels button').length,36);
    const front=rendered.at(-1).position;
    stage.dispatchEvent(new win.MouseEvent('pointerdown',{bubbles:true,button:0,clientX:200,clientY:300}));
    stage.dispatchEvent(new win.MouseEvent('pointermove',{bubbles:true,button:0,clientX:280,clientY:330}));
    assert.ok(front.distanceTo(rendered.at(-1).position)>1,'Dragging orbits the actual 3D tower');
    doc.querySelector('#elevation-levels button[aria-label="Level 9"]').click();assert.deepEqual(openedFloor,{id:'castle',floor:9});assert.ok(rendered.length>0);
    doc.getElementById('leave-elevation').click();await new Promise(r=>setTimeout(r,0));assert.equal(elevation.active,false);assert.equal(dialog.open,false);assert.equal(tower.parent,original);assert.equal(canvas.parentElement.id,'viewport');assert.equal(closed,true);
  }finally{await win.happyDOM.close();}
});
