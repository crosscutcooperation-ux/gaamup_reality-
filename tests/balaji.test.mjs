import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bundledProjects} from '../lib/projects.js';
import {projectFacts,searchCatalog} from '../lib/catalog-search.js';
import {hasTypicalPlan} from '../public/scenes/balaji-classica/plan-data.js';
import {Window} from './helpers/scene-dom.mjs';
const base=new URL('../public/scenes/balaji-classica/',import.meta.url);
const json=async url=>JSON.parse(await readFile(url,'utf8'));

test('Balaji keeps supplied sales facts, separate possession estimates and enquiry information',async()=>{
 const project=bundledProjects.find(p=>p.id==='balaji-classica');
 assert.deepEqual(project,await json(new URL('../backend/balaji-project-seed.json',import.meta.url)));
 const facts=projectFacts(project);assert.equal(project.price,'₹31.99 L++ onwards');
 assert.equal(facts.offers[0].amount,3199000);assert.equal(facts.offers[1].amount,undefined);
 assert.match(JSON.stringify(facts.details),/December 2027/);assert.match(JSON.stringify(facts.details),/June 2028/);
 assert.match(JSON.stringify(facts.details),/9867004872/);assert.ok(facts.brochure.endsWith('.pdf'));
 assert.ok(searchCatalog(bundledProjects,{bhk:['1'],maxPrice:'3500000'}).some(p=>p.id===project.id));
});

test('all 40 numbered Balaji models and the unassigned Jodi preserve their exact supplied bytes',async()=>{
 const index=await json(new URL('assets/apartments/index.json',base)),plans=await json(new URL('assets/plans/apartment-map.json',base));
 assert.equal(Object.keys(index.units).length,40);assert.equal(index.alternatives.length,1);
 for(const layout of plans.layouts)for(const unit of layout.units){
  const model=index.units[unit.id];assert.ok(model,unit.id);assert.equal(Number(model.flat),Number(unit.flat));
  assert.equal(model.building.toLowerCase(),layout.id);assert.ok([1,2].includes(model.bedrooms));
 }
 for(const model of [...Object.values(index.units),...index.alternatives]){
  const bytes=await readFile(new URL('../backend/data'+model.url,import.meta.url));
  assert.equal(bytes.subarray(0,4).toString(),'glTF');assert.equal(bytes.readUInt32LE(8),model.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),model.sha256);
  const doc=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  for(const resource of [...doc.buffers||[],...doc.images||[]])assert.ok(!resource.uri||resource.uri.startsWith('data:'));
 }
 for(const id of ['ATHENA','IRIS','NOVA']){
  for(const f of [1,7,9,12,14,17,19,22])assert.equal(hasTypicalPlan(id,f),true);
  for(const f of [0,8,13,18,23])assert.equal(hasTypicalPlan(id,f),false);
 }
 assert.equal(hasTypicalPlan('T4',2),false);
});

test('the imported Balaji runtime has a closed local module graph',async()=>{
 const seen=new Set();async function visit(url){url.search='';if(seen.has(url.href))return;seen.add(url.href);
  const source=await readFile(url,'utf8');for(const m of source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)\s*['"](\.[^'"]+)['"]/g))await visit(new URL(m[1],url));
 }
 await visit(new URL('app.js',base));await visit(new URL('bridge.js',base));assert.ok([...seen].some(url=>url.endsWith('/plan-explorer.js')));assert.ok([...seen].some(url=>url.endsWith('/shared/vendor/three.module.js')));
 for(const file of ['balaji-towers-pbr.glb','balaji-site-pbr.glb','balaji-motion-pbr.glb','balaji-brochure.pdf'])assert.ok((await stat(new URL('assets/'+file,base))).size>0);
});

test('Balaji swaps plans under a loader, opens matching GLBs and cancels stale model loads',async()=>{
 const win=new Window({settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true,disableJavaScriptEvaluation:true}}),prior={};
 const calls=[];let finishModel;const binding={window:win,document:win.document,Option:function(text,value){const o=win.document.createElement('option');o.text=text;o.value=value;return o;},CustomEvent:win.CustomEvent,ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>setTimeout(fn,0),__balajiCalls:calls,__balajiWait:()=>new Promise(resolve=>{finishModel=resolve;})};
 for(const [key,value]of Object.entries(binding)){prior[key]=globalThis[key];globalThis[key]=value;}prior.fetch=globalThis.fetch;
 globalThis.fetch=async path=>new Response(await readFile(new URL(path,base)));
 win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};win.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new win.Event('close'));};
 const stub='data:text/javascript,'+encodeURIComponent(`export class PlanViewer{revision=0;async loadModel(url){globalThis.__balajiCalls.push(url);await globalThis.__balajiWait();return true;}setActive(){}setMode(){}reset(){}zoom(){}}`);
 let source=await readFile(new URL('plan-explorer.js',base),'utf8');source=source.replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,base).href}'`).replace("import('/scenes/venus-skky-city/plan-viewer.js')",`import('${stub}')`);
 win.HTMLImageElement.prototype.decode=async function(){};
 const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
 try{
  const {openPlanExplorer}=await import('data:text/javascript,'+encodeURIComponent(source));await openPlanExplorer('ATHENA',2);
  const doc=win.document;assert.equal(doc.querySelectorAll('a').length,0);assert.equal(doc.querySelectorAll('.apartment-choice').length,14);assert.deepEqual([...doc.querySelectorAll('.bhk-legend span')].map(e=>e.textContent),['1 BHK','2 BHK']);for(const beds of [1,2]){const card=doc.querySelector(`.apartment-choice[data-beds="${beds}"]`),region=doc.querySelector(`#apartment-hotspots g[data-beds="${beds}"]`);assert.ok(card);assert.ok(region);assert.equal(card.style.getPropertyValue('--unit-color'),region.style.getPropertyValue('--unit-color'));assert.equal(card.style.getPropertyValue('--unit-color'),beds===1?'#588348':'#c39a35');}assert.match(doc.querySelector('[data-apartment="athena-13"]').textContent,/2 BHK/);
  doc.querySelector('.apartment-choice').click();assert.match(doc.querySelector('#plan-image').src,/athena-01-2d.webp/);assert.equal(doc.querySelector('#plan-frame').hidden,true);assert.equal(doc.querySelector('#plan-status').hidden,false);
  doc.querySelector('#view-3d').click();assert.match(doc.querySelector('#plan-image').src,/athena-01/);assert.equal(doc.querySelector('#plan-frame').hidden,true);
  doc.querySelector('#view-model').click();await tick();assert.match(calls[0],/balaji-classica-athena-flat-01.glb$/);assert.match(doc.querySelector('#plan-status').textContent,/Loading furnished/);
  doc.querySelector('#back-floor').click();finishModel();await tick();assert.equal(doc.querySelector('#apartment-model').hidden,true);assert.equal(doc.querySelectorAll('.apartment-choice').length,14);assert.equal(doc.querySelectorAll('a').length,0);
  await openPlanExplorer('ATHENA',8);assert.match(doc.querySelector('#plan-status').textContent,/does not include/);
 }finally{for(const [key,value]of Object.entries(prior)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}await win.happyDOM.close();}
});

test('the local Balaji viewer reuses existing controls, feedback and sky while preserving PBR textures',async()=>{
 const html=await readFile(new URL('index.html',base),'utf8'),viewer=await readFile(new URL('viewer.js',base),'utf8'),lighting=await readFile(new URL('lighting.js',base),'utf8');
 const win=new Window();try{win.document.write(html);assert.equal(win.document.querySelector('#explore-drawer').hidden,true);for(const id of ['explore-toggle','close-explore','walk-launcher','show-scene-help','loading','rotate'])assert.ok(win.document.getElementById(id),id);}finally{await win.happyDOM.close();}
 assert.match(viewer,/createSceneGuidance/);assert.doesNotMatch(html,/id="(?:walk-hotspots|pool-hotspot|garden-hotspot)"/);assert.match(viewer,/courtyard:\{p:\[135,66,270\],t:\[0,35,2\]/);assert.match(viewer,/\$\('#reset'\)\.onclick=\(\)=>\{controls.autoRotate=false;/);assert.match(viewer,/createAtmosphere/);assert.match(viewer,/T.NeutralToneMapping/);assert.doesNotMatch(lighting,/sky.visible=false/);assert.match(lighting,/materials.terrain.map=terrainMap/);
 const plans=await readFile(new URL('plan-explorer.js',base),'utf8');assert.match(plans,/createPlanFeedback/);assert.match(plans,/feedback.image/);assert.match(plans,/feedback.run/);
 const lod=await readFile(new URL('model-lod.js',base),'utf8');assert.doesNotMatch(lod,/normalMap=null/);
});
