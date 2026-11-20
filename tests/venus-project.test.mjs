import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {Window} from './helpers/scene-dom.mjs';
import {bundledProjects,projectsForCity} from '../lib/projects.js';
const base=new URL('../public/scenes/venus-skky-city/',import.meta.url);
test('Venus is a persistent Dombivli project with all nine supplied GLB tower identities',async()=>{
 const project=bundledProjects.find(p=>p.id==='venus-skky-city');assert.ok(projectsForCity(bundledProjects,'dombivli').includes(project));assert.ok(!projectsForCity(bundledProjects,'kalyan').includes(project));
 const seed=JSON.parse(await readFile(new URL('../backend/venus-project-seed.json',import.meta.url)));assert.deepEqual(seed,project);
 const data=await readFile(new URL('assets/venus-skky-city-web.glb',base));assert.equal(data.subarray(0,4).toString(),'glTF');const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)));const ids=json.nodes.filter(n=>n.extras?.kind==='tower').map(n=>'venus-'+n.extras.id).sort();assert.deepEqual(ids,project.manifest.nodes.filter(n=>n.type==='building').map(n=>n.id).sort());
 for(const id of ['A','C','F','lavista','aristo']){const layout=JSON.parse(await readFile(new URL('assets/plans/'+id+'.json',base)));assert.ok(layout.units.length);for(const unit of layout.units)for(const file of [unit.image,unit.data])assert.ok((await stat(new URL(file,base))).size>0);}
});
test('Venus floor and house selection opens matching supplied apartment GLBs',async()=>{
 const win=new Window({url:'http://localhost/scenes/venus-skky-city/index.html',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true,disableJavaScriptEvaluation:true}});
 Object.assign(globalThis,{window:win,document:win.document,Option:function(text,value){const o=win.document.createElement('option');o.text=text;o.value=value;return o;},Event:win.Event,CustomEvent:win.CustomEvent,ResizeObserver:class{observe(){}},requestAnimationFrame:()=>0,parent:{postMessage(){}},fetch:async p=>new Response(await readFile(new URL(p,base)))});
 win.HTMLImageElement.prototype.decode=async function(){};
 win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};win.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new win.Event('close'));};
 const stub='data:text/javascript,'+encodeURIComponent('export class PlanViewer{constructor(){this.controls={autoRotate:true};}setActive(){}setMode(){}async load(){return true;}async loadModel(url){globalThis.__venusLoadedModel=url;return true;}resize(){}reset(){}}');
 let source=await readFile(new URL('plan-explorer.js',base),'utf8');source=source.replace("'../sai-world-dreams/plan-feedback.js'",JSON.stringify(new URL('../sai-world-dreams/plan-feedback.js',base).href)).replace("'./plan-viewer.js'",JSON.stringify(stub)).replace("'./model.js'",JSON.stringify(new URL('model.js',base).href)).replace("'./scene-guidance.js'",JSON.stringify(new URL('scene-guidance.js',base).href));const module=await import('data:text/javascript,'+encodeURIComponent(source));
 await module.openPlanExplorer('C',2);assert.equal(win.document.querySelectorAll('.floor-unit').length,12);win.document.querySelector('.floor-unit[data-flat="C-01"]').click();await new Promise(r=>setTimeout(r,0));assert.match(win.document.querySelector('#floor-title').textContent,/Flat 01/);
 win.document.querySelector('[data-floor-mode="furnished"]').click();assert.match(win.document.querySelector('#floor-image').src,/C-01-furnished/);win.document.querySelector('[data-floor-mode="rotate"]').click();await new Promise(r=>setTimeout(r,0));assert.equal(globalThis.__venusLoadedModel,'/scene-assets/venus-apartments/C-01.glb');assert.equal(win.document.querySelector('#floor-busy').hidden,true);
 await module.openPlanExplorer('B',2);assert.equal(win.document.querySelector('#floor-empty').hidden,false);assert.match(win.document.querySelector('#floor-empty-note').textContent,/does not include/);win.happyDOM.abort();
});
