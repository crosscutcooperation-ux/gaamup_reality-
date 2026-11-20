import {createPlanFeedback} from '../sai-world-dreams/plan-feedback.js';
import {towerSpecs} from './model.js';
import {PlanViewer} from './plan-viewer.js';
import {GUIDE_HAND} from './scene-guidance.js';

const NS='http://www.w3.org/2000/svg';
const dialog=document.createElement('dialog');dialog.id='floor-dialog';dialog.setAttribute('aria-labelledby','floor-title');
dialog.innerHTML=`
 <header class="floor-header plan-header"><div><p id="floor-project">VENUS SKKY CITY</p><h2 id="floor-title">Choose your perspective.</h2></div><button id="floor-close" aria-label="Close floor plan">×</button></header>
 <div class="floor-toolbar plan-toolbar"><div class="plan-selectors"><label>Building<select id="floor-building" aria-label="Floor plan building"></select></label><label>Floor<select id="floor-number" aria-label="Floor number"></select></label></div><div class="floor-switch plan-modes" role="group" aria-label="Floor plan view"><button data-floor-mode="2d" aria-pressed="true">2D house plan</button><button data-floor-mode="furnished" aria-pressed="false">Furnished view</button><button data-floor-mode="rotate" aria-pressed="false">3D rotate model</button></div></div>
 <nav id="floor-levels" aria-label="Floor levels"></nav>
 <aside id="floor-apartment-sidebar"><button id="floor-back" hidden><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6"/></svg><span>Back to floor</span></button><p id="floor-apartment-level"></p><h3 id="floor-apartment-type"></h3><p id="floor-apartment-number"></p><p class="apartment-instruction">Tap the plan for the furnished 3D image.</p></aside>
 <div class="floor-body" id="floor-content"><section class="floor-scene plan-stage"><div class="floor-breadcrumb"><span id="floor-context"></span></div><div id="floor-2d"><div id="floor-drawing"><img id="floor-image" alt=""><svg id="floor-hotspots" aria-label="Select an apartment"></svg></div></div><div id="floor-3d" hidden></div><div id="floor-busy" role="status" hidden></div><div id="floor-empty" hidden><h3>Drawing not supplied for this floor.</h3><p id="floor-empty-note"></p><div id="floor-alternatives"></div><button id="floor-samples">Explore available apartment layouts</button></div><div class="floor-view-tools plan-zoom"><button id="floor-plus" aria-label="Zoom into floor plan">+</button><button id="floor-minus" aria-label="Zoom out of floor plan">−</button><button id="floor-fit">Fit view</button><button id="floor-spin" hidden>Pause rotation</button><button id="floor-export" hidden>Download this 3D model</button></div></section><aside class="floor-unit-panel"><p id="floor-summary"></p><div id="floor-unit-list" aria-label="Apartments on this floor"></div></aside><p id="floor-help"></p></div>
 <footer class="floor-footer plan-footer"><span id="floor-note"></span><a id="floor-source" target="_blank" rel="noopener">Original source</a></footer>`;
document.body.appendChild(dialog);const hint=document.createElement('span');hint.className='unit-guide';hint.innerHTML=GUIDE_HAND+'<span>Tap a coloured home</span>';dialog.querySelector('#floor-2d').append(hint);
const $=s=>dialog.querySelector(s),$$=s=>[...dialog.querySelectorAll(s)];
const feedback=createPlanFeedback($('#floor-busy'));
let layout=null,selected=null,mode='2d',viewer=null,zoom=1,revision=0,loadedKey='',building='C',floor=2;
const cache=new Map();
let modelIndexPromise;
async function readLayout(id){if(!cache.has(id))cache.set(id,Promise.all([
 fetch(`assets/plans/${id}.json`).then(r=>{if(!r.ok)throw Error('The floor drawing could not load.');return r.json();}),
 modelIndexPromise??=fetch('assets/apartments/index.json').then(r=>r.ok?r.json():{units:{}})
]).then(([data,index])=>{data.image=`assets/plans/generated/${id}-selector.webp`;data.units.forEach(u=>{u.image=`assets/plans/generated/${u.id}-2d-clean.webp`;u.furnished=`assets/plans/generated/${u.id}-furnished.webp`;u.model=index.units[u.id]?.url||null;});return data;}).catch(error=>{cache.delete(id);throw error;}));return cache.get(id);}
const nameOf=u=>u.sample?`${u.area} sq ft · ${u.beds} bed`:`Flat ${String(u.flat).padStart(2,'0')} · ${u.beds} bed${u.area?' · '+u.area+' sq ft':''}`;
function syncFloors(){
 const spec=towerSpecs.find(t=>t.id===building);$('#floor-number').replaceChildren();$('#floor-levels').replaceChildren();
 $('#floor-number').disabled=building==='sample';
 if(building==='sample'){const o=new Option('Sample layouts','0');$('#floor-number').add(o);$('#floor-levels').hidden=true;return;}
 $('#floor-levels').hidden=false;const max=spec?.floors||33;floor=Math.max(0,Math.min(floor,max));
 for(let n=0;n<=max;n++)$('#floor-number').add(new Option(n===0?'Ground floor':'Floor '+n,String(n)));
 $('#floor-number').value=String(floor);
 for(let n=max;n>=0;n--){const b=document.createElement('button');b.textContent=n===0?'G':String(n).padStart(2,'0');b.setAttribute('aria-label','Open floor '+n);b.setAttribute('aria-current',String(n===floor));b.onclick=()=>{floor=n;$('#floor-number').value=String(n);syncFloors();showFloor();};$('#floor-levels').appendChild(b);}
 requestAnimationFrame(()=>{const rail=$('#floor-levels'),active=rail.querySelector('[aria-current="true"]');if(active)rail.scrollTop=active.offsetTop-rail.offsetTop-rail.clientHeight/2+active.clientHeight/2;});
}
function setNote(){
 if(!layout)return;
 $('#floor-note').textContent=building==='sample'?'Sample apartment layout · furniture and geometry approximate · no building or floor assignment.':layout.rangeVerified?`Typical layout supplied for floors ${layout.start}–${layout.floors}. Presentation drawings follow the selected source layout.`:'Typical layout reference. The source does not assign this drawing to individual floor numbers. Regenerated presentation drawings are illustrative.';
 $('#floor-source').href=layout.sourceUrl;$('#floor-source').title=layout.source;
}
function renderUnits(){
 const list=$('#floor-unit-list');list.replaceChildren();const svg=$('#floor-hotspots');svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${layout.width} ${layout.height}`);
 for(const u of layout.units){
  const b=document.createElement('button');b.className='floor-unit';b.dataset.flat=u.id;b.textContent=nameOf(u);b.onclick=()=>chooseFlat(u.id);list.appendChild(b);
  if(u.sample)continue;
  const g=document.createElementNS(NS,'g');g.style.setProperty('--home-color',u.beds>=3?'#c58f44':u.beds===2?'#7eaa5e':'#6a9ba3');g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',nameOf(u));g.dataset.flat=u.id;
  const p=document.createElementNS(NS,'polygon');p.setAttribute('points',u.polygon.map(p=>p.join(',')).join(' '));const t=document.createElementNS(NS,'text');t.setAttribute('x',u.center[0]);t.setAttribute('y',u.center[1]);t.textContent=String(u.flat).padStart(2,'0');g.append(p,t);g.onclick=()=>chooseFlat(u.id);g.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();chooseFlat(u.id);}};svg.appendChild(g);
  b.onpointerenter=()=>g.classList.add('highlight');b.onpointerleave=()=>g.classList.remove('highlight');
 }
 $('#floor-summary').textContent=building==='sample'?'Five available apartment layouts.':`${layout.units.length} flats · click any highlighted residence.`;
}
function fitImage(){
 const host=$('#floor-2d'),im=$('#floor-image');if(!im.naturalWidth||host.hidden)return;
 const base=Math.min((host.clientWidth-40)/im.naturalWidth,(host.clientHeight-35)/im.naturalHeight),s=Math.max(.02,base)*zoom;
 $('#floor-drawing').style.width=im.naturalWidth*s+'px';$('#floor-drawing').style.height=im.naturalHeight*s+'px';
}
new ResizeObserver(()=>fitImage()).observe($('#floor-2d'));
function updateSelection(){
 dialog.classList.toggle('apartment',!!selected);$('#floor-apartment-level').textContent=`${layout.name} / LEVEL ${String(floor).padStart(2,'0')}`;$('#floor-apartment-type').textContent=selected?`${selected.beds} BHK`:'';$('#floor-apartment-number').textContent=selected?'APARTMENT '+String(selected.flat).padStart(2,'0'):'';
 const title=building==='sample'?'Apartment layouts':`${layout.name} · Floor ${String(floor).padStart(2,'0')}`;
 $('#floor-title').textContent=selected?nameOf(selected):title;
 $('#floor-context').textContent=selected?`${title} / ${selected.sample?'Selected layout':'Flat '+selected.flat}`:`${title} / ${layout.kind} floor plan`;
 $('#floor-back').hidden=!selected||building==='sample';$('.floor-switch').hidden=!selected;
 $('#floor-hotspots').toggleAttribute('hidden',!!selected);$('#floor-image').alt=selected?nameOf(selected)+' — clean 2D house plan':layout.name+' — clickable original floor drawing';
 $('#floor-image').tabIndex=selected?0:-1;
 $$('.floor-unit').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flat===selected?.id)));
 zoom=1;fitImage();
}
async function chooseFlat(id){const u=layout?.units.find(u=>u.id===id);if(!u)return;selected=u;loadedKey='';updateSelection();await setPlanMode('2d');}
async function setPlanMode(value){
 feedback.cancel();mode=value;const request=++revision;
 $$('[data-floor-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.floorMode===mode)));
 const interactive=!['2d','furnished'].includes(mode);$('#floor-2d').hidden=interactive;$('#floor-3d').hidden=!interactive;$('#floor-spin').hidden=mode!=='rotate';$('#floor-export').hidden=!interactive;$('#floor-busy').hidden=true;
 $('#floor-help').textContent=['2d','furnished'].includes(mode)?(selected?'Click the plan to open its 3D model.':'Click a highlighted flat to open its own 2D plan.'):
  mode==='3d'?(selected?'3D wall cutaway · click the model for 360° rotation.':'3D floor cutaway · click a residence to open it.'):'Drag to orbit · scroll to zoom · right-drag to pan · use Pause rotation to stop automatic rotation.';
 if(!interactive){viewer?.setActive(false);const src=selected?(mode==='furnished'?selected.furnished:selected.image):layout.image;$('#floor-help').textContent=mode==='furnished'?'Furnished view · furniture and finishes are illustrative.':'2D plan redrawn from the supplied reference · use + / − to zoom';await feedback.image($('#floor-image'),src,mode==='furnished'?'Loading the furnished view…':selected?'Loading your 2D house plan…':'Loading the 2D floor plan…',{valid:()=>request===revision&&dialog.open,ready:fitImage});return;}
 if(selected&&!selected.model){viewer?.setActive(false);$('#floor-spin').hidden=true;$('#floor-export').hidden=true;$('#floor-help').textContent='Return to 2D Plan to view the supplied drawing.';$('#floor-busy').hidden=false;$('#floor-busy').dataset.loading='false';$('#floor-busy').textContent='3D view coming soon. Explore the 2D house plan or furnished view for now.';return;}
 viewer??=new PlanViewer($('#floor-3d'),{pick:id=>chooseFlat(id),rotate:()=>setPlanMode('rotate')});viewer.setActive(true);viewer.setMode(mode);
 const key=selected?.model||layout.id+'/'+(selected?.id||'floor');
 if(loadedKey!==key){feedback.begin('Loading your furnished apartment…');
  try{const ok=selected?.model?await viewer.loadModel(selected.model):await viewer.load(layout,selected);if(request!==revision||!dialog.open)return;if(ok){loadedKey=key;feedback.cancel();viewer.setMode(mode);}}
  catch(e){if(request===revision){$('#floor-busy').hidden=false;$('#floor-busy').dataset.loading='false';$('#floor-busy').textContent='This apartment could not load. Choose 2D house plan to return, or retry 3D rotate model.';}console.error(e);return;}
 }
 $('#floor-spin').textContent=viewer.controls.autoRotate?'Pause rotation':'Start rotation';
}
function unavailable(message){feedback.cancel();dialog.classList.remove('apartment');
 layout=null;selected=null;viewer?.setActive(false);$('#floor-empty').hidden=false;$('#floor-empty-note').textContent=message;$('#floor-2d').hidden=true;$('#floor-3d').hidden=true;$('#floor-busy').hidden=true;$('.floor-switch').hidden=true;$('.floor-view-tools').hidden=true;$('.floor-unit-panel').hidden=true;$('#floor-back').hidden=true;$('#floor-title').textContent=`${towerSpecs.find(t=>t.id===building)?.name||'Building'} · ${floor===0?'Ground':'Floor '+floor}`;$('#floor-context').textContent='Source plan availability';$('#floor-help').textContent='Choose another floor, or explore an available drawing below.';$('#floor-note').textContent='A missing source plan is not replaced with a different building’s drawing.';$('#floor-source').href='https://drive.google.com/drive/folders/1-JZJ0tgcBSCGfygBEWN_B1rXHWEE5pUT';
 $('#floor-alternatives').replaceChildren();for(const id of ['C','F','A','lavista','aristo']){const b=document.createElement('button');b.textContent=towerSpecs.find(t=>t.id===id).name;b.onclick=()=>openPlanExplorer(id,2);$('#floor-alternatives').appendChild(b);}
}
async function showFloor(){
 const request=++revision;viewer?.setActive(false);loadedKey='';$('#floor-empty').hidden=true;feedback.begin('Opening the floor panel…');
 if(!['C','F','A','lavista','aristo'].includes(building)){unavailable('The supplied digital kit does not include a residential floor drawing for this building. Its exterior model is available; use the supplied floor plans below to explore individual residences.');return;}
 try{const next=await readLayout(building);if(request!==revision||!dialog.open)return;
  if(floor<next.start){unavailable(`The supplied ${next.name} drawing covers ${next.rangeVerified?'floors '+next.start+'–'+next.floors:'typical residential floors'}. A drawing for this floor is not included.`);return;}
  layout=next;selected=null;$('.floor-switch').hidden=false;$('.floor-view-tools').hidden=false;$('.floor-unit-panel').hidden=false;renderUnits();setNote();updateSelection();await setPlanMode('2d');
 }catch(e){if(request===revision)unavailable(e.message);}
}
export async function openPlanExplorer(id='C',level=2){
 building=towerSpecs.some(t=>t.id===id)?id:'C';floor=Number.isInteger(level)?level:2;dialog.dataset.building=building;dialog.dataset.floor=String(floor);$('#floor-building').value=building;syncFloors();if(!dialog.open)dialog.showModal();parent.postMessage({source:'aero-scene',type:'view',view:'floor'},'*');document.dispatchEvent(new CustomEvent('plan-explorer-state',{detail:{open:true}}));await showFloor();
}
export async function openSampleExplorer(id='436'){
 const request=++revision;building='sample';floor=0;$('#floor-building').value='sample';syncFloors();if(!dialog.open)dialog.showModal();parent.postMessage({source:'aero-scene',type:'view',view:'floor'},'*');document.dispatchEvent(new CustomEvent('plan-explorer-state',{detail:{open:true}}));viewer?.setActive(false);loadedKey='';
 const r=await fetch('assets/units.json'),data=await r.json();if(request!==revision)return;
 layout={id:'sample',name:'Apartment layouts',kind:'Sample',width:1,height:1,source:'Supplied individual apartment plans',sourceUrl:'https://drive.google.com/drive/folders/1cMhcFmKqCa5A6LJQRUNVQe3mzvTPdrC8',units:data.map(u=>({id:u.id,flat:u.id,beds:u.beds,area:u.area,sample:true,data:`assets/plans/sample-${u.id}.json`,image:`assets/unit-${u.id}.webp`}))};
 $('#floor-empty').hidden=true;$('.floor-switch').hidden=false;$('.floor-view-tools').hidden=false;$('.floor-unit-panel').hidden=false;renderUnits();setNote();await chooseFlat(data.some(u=>u.id===id)?id:'436');
}
$('#floor-building').innerHTML=towerSpecs.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')+'<option value="sample">Sample apartment layouts</option>';
$('#floor-building').onchange=()=>$('#floor-building').value==='sample'?openSampleExplorer():openPlanExplorer($('#floor-building').value,floor);
$('#floor-number').onchange=()=>{floor=Number($('#floor-number').value);syncFloors();showFloor();};
$('#floor-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{feedback.cancel();document.dispatchEvent(new CustomEvent('floor-plan-close'));revision++;viewer?.setActive(false);parent.postMessage({source:'aero-scene',type:'view',view:'colony'},'*');document.dispatchEvent(new CustomEvent('plan-explorer-state',{detail:{open:false}}));});
dialog.addEventListener('cancel',e=>{if(selected&&building!=='sample'){e.preventDefault();selected=null;loadedKey='';updateSelection();setPlanMode('2d');}});
$('#floor-back').onclick=()=>{selected=null;loadedKey='';updateSelection();setPlanMode('2d');};$('#floor-samples').onclick=()=>openSampleExplorer();
$('#floor-image').onclick=()=>{if(selected)setPlanMode(mode==='2d'?'furnished':'rotate');};$('#floor-image').onkeydown=e=>{if(selected&&['Enter',' '].includes(e.key)){e.preventDefault();setPlanMode(mode==='2d'?'furnished':'rotate');}};
$$('[data-floor-mode]').forEach(b=>b.onclick=()=>setPlanMode(b.dataset.floorMode));
$('#floor-plus').onclick=()=>['2d','furnished'].includes(mode)?(zoom=Math.min(5,zoom*1.25),fitImage()):viewer?.zoom(.8);
$('#floor-minus').onclick=()=>['2d','furnished'].includes(mode)?(zoom=Math.max(.5,zoom/1.25),fitImage()):viewer?.zoom(1.25);
$('#floor-fit').onclick=()=>{zoom=1;['2d','furnished'].includes(mode)?fitImage():viewer?.reset();};
$('#floor-spin').onclick=()=>{$('#floor-spin').textContent=viewer.toggleSpin()?'Pause rotation':'Start rotation';};
$('#floor-export').onclick=async()=>{const button=$('#floor-export');button.disabled=true;button.textContent='Preparing GLB…';try{await viewer.download(`${building}-floor-${floor}-${selected?.id||'complete'}`);}catch(e){$('#floor-help').textContent='Download could not complete. Retry after the model finishes loading.';console.error(e);}finally{button.disabled=false;button.textContent='Download this 3D model ↓';}};
