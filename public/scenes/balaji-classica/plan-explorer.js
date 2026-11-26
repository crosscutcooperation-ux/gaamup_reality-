import {createPlanFeedback} from '../sai-world-dreams/plan-feedback.js';
import {towerSpecs} from './project-data.js';
import {hasTypicalPlan} from './plan-data.js';
import {mapPolygon} from './plan-selection.js';

const dialog=document.createElement('dialog');
dialog.id='elements-plan';
dialog.setAttribute('aria-label','Balaji Classica floor and apartment plans');
dialog.innerHTML=`<header class="elements-plan-header"><h2 id="plan-title"></h2><button id="close-plan" aria-label="Close plan">×</button></header>
<div class="elements-plan-controls"><label>Tower<select id="drawing-tower"></select></label><label>Floor<select id="drawing-floor"></select></label><button id="back-floor" hidden>← Back to floor</button><div role="group" aria-label="Plan view"><button id="view-2d" aria-pressed="true">2D Plan</button><button id="view-3d" aria-pressed="false" disabled>Furnished view</button><button id="view-model" aria-pressed="false" hidden>3D rotate model</button></div></div>
<div class="elements-plan-body"><aside id="elements-apartment-info" hidden><p id="elements-apartment-level"></p><h2 id="elements-apartment-type"></h2><p id="elements-apartment-number"></p><p class="apartment-instruction">Explore the plan, furnished view or complete 3D apartment.</p><div id="elements-apartment-tabs"></div></aside><section class="elements-plan-drawing plan-stage" aria-label="Selectable plan"><div id="plan-frame" hidden><img id="plan-image" alt=""><svg id="apartment-hotspots" xmlns="http://www.w3.org/2000/svg" aria-label="Select an apartment"></svg></div><div id="apartment-model" hidden></div><div id="plan-status" role="status"></div></section><aside id="apartment-list" aria-label="Apartments on this floor"></aside></div>
<div class="elements-plan-tools"><button id="plan-less" aria-label="Zoom plan out">−</button><button id="plan-fit">Fit view</button><button id="plan-more" aria-label="Zoom plan in">+</button><span id="plan-help"></span></div>`;
document.body.append(dialog);
const $=s=>dialog.querySelector(s),feedback=createPlanFeedback($('#plan-status')),svgNS='http://www.w3.org/2000/svg';
let data=null,loadError=null,selected=null,mode='2d',zoom=1,viewer,renderVersion=0;
function loadData(){loadError=null;return Promise.all(['assets/plans/apartment-map.json','assets/apartments/index.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('Project plans could not load.');return r.json();}))).then(([plans,models])=>{
 data=plans;for(const layout of data.layouts)for(const unit of layout.units){const supplied=models.units[unit.id];unit.model=supplied?.url;if(supplied)unit.beds=supplied.bedrooms;}
}).catch(e=>{loadError=e;});}
let ready=loadData();
for(const t of towerSpecs)$('#drawing-tower').add(new Option(t.name,t.id));
for(let f=0;f<=22;f++)$('#drawing-floor').add(new Option(f===0?'Ground floor':`Floor ${f}`,f));
const bhkColors={'1':'#588348','2':'#c39a35','2.5':'#bd655c','3':'#9273ad'};
const unitColor=beds=>bhkColors[String(beds)]||'#62746b';
const novaFloor={image:'assets/plans/nova-typical.webp',size:[2371,1268],bounds:[202,128,2010,1075]};
const currentTower=()=>towerSpecs.find(t=>t.id===$('#drawing-tower').value);
const currentLayout=()=>data?.layouts.find(l=>l.id===currentTower()?.plan);
const available=()=>hasTypicalPlan($('#drawing-tower').value,Number($('#drawing-floor').value));
const template=()=>data?.templates.find(t=>t.id===selected?.template);

function fit(){
 const host=$('.elements-plan-drawing'),im=$('#plan-image');if(!im.naturalWidth||$('#plan-frame').hidden)return;
 const scale=Math.max(.025,Math.min((host.clientWidth-24)/im.naturalWidth,(host.clientHeight-24)/im.naturalHeight)*zoom);
 $('#plan-frame').style.width=im.naturalWidth*scale+'px';$('#plan-frame').style.height=im.naturalHeight*scale+'px';
}
new ResizeObserver(fit).observe($('.elements-plan-drawing'));
async function showModel(){
 if(!selected?.model)return;const revision=++renderVersion,url=selected.model;mode='rotate';viewer?.setActive(false);
 $('#plan-frame').hidden=true;$('#apartment-model').hidden=true;feedback.cancel();
 $('#view-2d').setAttribute('aria-pressed','false');$('#view-3d').setAttribute('aria-pressed','false');$('#view-model').setAttribute('aria-pressed','true');
 await feedback.run(async()=>{
  const {PlanViewer}=await import('/scenes/venus-skky-city/plan-viewer.js');if(revision!==renderVersion||!dialog.open)return;
  $('#apartment-model').hidden=false;viewer ||= new PlanViewer($('#apartment-model'));
  if(await viewer.loadModel(url)===false||revision!==renderVersion||!dialog.open)return;
  viewer.setMode('rotate');viewer.setActive(true);viewer.reset();
 },'Loading furnished apartment…',{valid:()=>revision===renderVersion&&dialog.open,ready:()=>{
  $('#plan-help').textContent='Drag to orbit the complete furnished apartment. Scroll or pinch to zoom.';
 },error:'The apartment model could not load. Choose 2D Plan or Furnished view to continue.'});
}

function heading(text){const h=document.createElement('h3');h.textContent=text;$('#apartment-list').append(h);}
function choice(label,detail,active,click,attrs={}){
 const b=document.createElement('button');b.type='button';b.className='apartment-choice';b.setAttribute('aria-pressed',String(active));b.append(document.createTextNode(label));
 if(detail){const s=document.createElement('small');s.textContent=detail;b.append(s);}Object.assign(b.dataset,attrs);b.onclick=click;$('#apartment-list').append(b);return b;
}
function selectUnit(unit){selected=unit;mode='2d';show(true);}
function drawRegion(region,kind,label,action,active=false){
 const g=document.createElementNS(svgNS,'g'),p=document.createElementNS(svgNS,'polygon'),title=document.createElementNS(svgNS,'title');
 g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',label);g.setAttribute('aria-pressed',String(active));g.classList.add(kind);g.dataset.apartment=region.id;g.dataset.beds=String(region.beds);g.style.setProperty('--unit-color',unitColor(region.beds));
 p.setAttribute('points',region.polygon.map(p=>p.join(',')).join(' '));title.textContent=label;g.append(title,p);
 g.onclick=e=>{e.stopPropagation();action();};g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};$('#apartment-hotspots').append(g);
 if(kind==='apartment-region'){
  const text=document.createElementNS(svgNS,'text'),xs=region.polygon.map(p=>p[0]),ys=region.polygon.map(p=>p[1]);
  text.setAttribute('x',(Math.min(...xs)+Math.max(...xs))/2);text.setAttribute('y',(Math.min(...ys)+Math.max(...ys))/2);text.textContent=String(region.flat).padStart(2,'0');g.append(text);
 }
}

function show(resetZoom=false){
 renderVersion++;feedback.cancel();viewer?.setActive(false);if(viewer)viewer.revision++;$('#apartment-model').hidden=true;$('#view-model').hidden=!selected?.model;$('#view-model').setAttribute('aria-pressed','false');
 const tower=currentTower(),floor=Number($('#drawing-floor').value),layout=currentLayout(),valid=!!layout&&available();if(resetZoom)zoom=1;
 $('#elements-apartment-info').hidden=!selected;const tabs=$('[role=group]');if(selected){$('#elements-apartment-tabs').append(tabs);$('#elements-apartment-level').textContent=tower.name+' / LEVEL '+String(floor).padStart(2,'0');$('#elements-apartment-type').textContent=selected.beds+' BHK';$('#elements-apartment-number').textContent='APARTMENT '+String(selected.flat).padStart(2,'0');$('#elements-apartment-info').prepend($('#back-floor'));}else{$('.elements-plan-controls').append($('#back-floor'),tabs);}
 $('#plan-title').textContent=`${tower.name} · ${floor===0?'Ground floor':'Level '+String(floor).padStart(2,'0')}${selected?' · Apartment '+String(selected.flat).padStart(2,'0'):''}`;
 const renderReady=!selected||!!template()?.renderSize;
 if(mode==='3d'&&!renderReady)mode='2d';
 $('#back-floor').hidden=!selected;$('#view-2d').setAttribute('aria-pressed',String(mode==='2d'));$('#view-3d').setAttribute('aria-pressed',String(mode==='3d'));$('#view-3d').disabled=!valid||!renderReady;
 $('#plan-frame').hidden=true;feedback.begin('Loading '+(selected?'apartment':'floor')+' plan…');
 $('#apartment-list').hidden=!!selected;$('#apartment-hotspots').toggleAttribute('hidden',!!selected);
 $('.elements-plan-body').classList.toggle('has-apartment',!!selected);
 $('#apartment-list').replaceChildren();$('#apartment-hotspots').replaceChildren();$('#elements-apartment-info').style.setProperty('--unit-color',unitColor(selected?.beds));dialog.dataset.apartment=selected?.id||'';dialog.dataset.mode=mode;
 const imageButton=!!selected&&renderReady;
 $('#plan-image').tabIndex=imageButton?0:-1;
 if(imageButton){$('#plan-image').setAttribute('role','button');$('#plan-image').setAttribute('aria-label',mode==='2d'?'Open furnished 3D plan':'Return to 2D plan');}
 else{$('#plan-image').removeAttribute('role');$('#plan-image').removeAttribute('aria-label');}
 if(!valid){
  $('#plan-status').dataset.loading='false';
  $('#plan-status').textContent=loadError?'The floor plan data could not load. Close and reopen this viewer.':tower.plan?`The brochure does not include the ${floor===0?'ground-floor':'floor '+floor} drawing. Its typical plan covers floors 1–7, 9–12, 14–17 and 19–22.`:'A floor plan for this wing was not supplied. Original drawings are available for Athena, Iris and Nova.';
  heading('Available tower plans');for(const t of towerSpecs.filter(t=>t.plan))choice(t.name,'Open typical floor',false,()=>{$('#drawing-tower').value=t.id;$('#drawing-floor').value='2';selected=null;show(true);});
  $('#plan-help').textContent='Choose an available tower plan.';return;
 }
 let src,size;
 if(selected){
  const t=template();src=mode==='2d'?selected.image:selected.render;size=mode==='2d'?selected.imageSize:t.renderSize;
  $('#plan-help').textContent=mode==='2d'?'Click the plan to open the furnished 3D image.':'Click the furnished image to return to the 2D plan.';
 }else{
  src=mode==='2d'&&layout.id==='nova'?novaFloor.image:mode==='2d'?layout.image:layout.render;size=mode==='2d'&&layout.id==='nova'?novaFloor.size:mode==='2d'?[layout.width,layout.height]:layout.renderSize;heading(`${layout.units.length} apartments on this floor`);const legend=document.createElement('div');legend.className='bhk-legend';legend.setAttribute('aria-label','Apartment colour key');for(const beds of [...new Set(layout.units.map(u=>u.beds))].sort((a,b)=>a-b)){const item=document.createElement('span');item.style.setProperty('--unit-color',unitColor(beds));item.textContent=beds+' BHK';legend.append(item);}$('#apartment-list').append(legend);
  for(const u of layout.units){const label=`Apartment ${String(u.flat).padStart(2,'0')} · ${u.beds} BHK`;const b=choice(label,'2D plan and furnished 3D image',false,()=>selectUnit(u),{apartment:u.id});b.dataset.beds=String(u.beds);b.style.setProperty('--unit-color',unitColor(u.beds));const polygon=mode==='2d'&&layout.id==='nova'?mapPolygon(u.polygon,layout.contentBounds,novaFloor.bounds):mode==='2d'?u.polygon:mapPolygon(u.polygon,layout.contentBounds,layout.renderBounds);drawRegion({...u,polygon},'apartment-region',label,()=>selectUnit(u));}
  $('#apartment-list').setAttribute('aria-label','Apartments on this floor');$('#apartment-hotspots').setAttribute('aria-label','Select an apartment');$('#plan-help').textContent='Select an apartment to open its 2D plan.';
 }
 $('#apartment-hotspots').setAttribute('viewBox',`0 0 ${size[0]} ${size[1]}`);

 $('#plan-image').alt=`${tower.name}, ${selected?'apartment '+selected.flat+', '+selected.beds+' BHK':'full typical floor'}, ${mode==='2d'?'original 2D plan':'3D furnished plan image'}`;
 const current=renderVersion;feedback.image($('#plan-image'),src,mode==='3d'?'Loading furnished view…':selected?'Loading apartment plan…':'Loading floor plan…',{valid:()=>dialog.open&&current===renderVersion&&mode!=='rotate',ready:()=>{$('#plan-frame').hidden=false;fit();}});
}
export async function openPlanExplorer(id='NOVA',floor=2){
 $('#drawing-tower').value=towerSpecs.some(t=>t.id===id)?id:'NOVA';$('#drawing-floor').value=String(Math.max(0,Math.min(22,floor)));selected=null;mode='2d';$('#plan-status').textContent='Loading floor plans…';$('#plan-status').hidden=false;$('#plan-frame').hidden=true;
 if(!dialog.open)dialog.showModal();document.dispatchEvent(new CustomEvent('plan-explorer-state',{detail:{open:true}}));if(loadError)ready=loadData();await ready;show(true);
}
$('#drawing-tower').onchange=$('#drawing-floor').onchange=()=>{selected=null;mode='2d';show(true);};$('#back-floor').onclick=()=>{selected=null;mode='2d';show(true);};$('#view-2d').onclick=()=>{mode='2d';show(true);};$('#view-3d').onclick=()=>{if(available()){mode='3d';show(true);}};
function togglePlanImage(){if(selected&&template()?.renderSize){mode=mode==='2d'?'3d':'2d';show(true);}}
$('#plan-image').onclick=togglePlanImage;
$('#plan-image').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();togglePlanImage();}};
$('#view-model').onclick=showModel;
$('#plan-more').onclick=()=>{if(mode==='rotate')viewer?.zoom(1/1.3);else{zoom=Math.min(6,zoom*1.3);fit();}};$('#plan-less').onclick=()=>{if(mode==='rotate')viewer?.zoom(1.3);else{zoom=Math.max(.6,zoom/1.3);fit();}};$('#plan-fit').onclick=()=>{if(mode==='rotate')viewer?.reset();else{zoom=1;fit();}};$('#close-plan').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{renderVersion++;feedback.cancel();viewer?.setActive(false);if(viewer)viewer.revision++;document.dispatchEvent(new CustomEvent('plan-explorer-state',{detail:{open:false}}));});
