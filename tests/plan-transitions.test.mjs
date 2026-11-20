import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from './helpers/scene-dom.mjs';
for(const [slug,building,flat,count] of [['venus-skky-city','C','C-01',12],['elements-new-panvel','T1','T1-01',8]])test(slug+' waits for floor/2D/furnished pixels and opens selected homes in 2D',async()=>{
 const base=new URL('../public/scenes/'+slug+'/',import.meta.url),win=new Window({url:'http://localhost/scenes/'+slug+'/index.html'});let release,waitForDecode=false;
 Object.assign(globalThis,{window:win,document:win.document,Option:function(text,value){const o=win.document.createElement('option');o.text=text;o.value=value;return o;},Event:win.Event,CustomEvent:win.CustomEvent,ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>setImmediate(fn),parent:{postMessage(){}},fetch:async p=>new Response(await readFile(new URL(String(p).split('?')[0],base)))});
 win.HTMLImageElement.prototype.decode=function(){return waitForDecode?new Promise(r=>{release=r;}):Promise.resolve();};win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};win.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new win.Event('close'));};
 const flushPaint=async()=>{for(let frame=0;frame<8;frame++)await new Promise(resolve=>setImmediate(resolve));};
 const stub='data:text/javascript,'+encodeURIComponent('export class PlanViewer{constructor(){this.controls={autoRotate:false};}setActive(){}setMode(){}async load(){return true;}async loadModel(){return true;}resize(){}reset(){}}');
 let source=await readFile(new URL('plan-explorer.js',base),'utf8');source=source.replace(/from '([^']+)'/g,(_,p)=>`from '${p.endsWith('plan-viewer.js')?stub:new URL(p,base).href}'`);const module=await import('data:text/javascript,'+encodeURIComponent(source));
 try{
  await module.openPlanExplorer(building,2);const doc=win.document,status=doc.querySelector('#floor-busy');assert.equal(doc.querySelectorAll('.floor-unit').length,count);
  waitForDecode=true;const unit=doc.querySelector(`.floor-unit[data-flat="${flat}"]`)||doc.querySelector('.floor-unit');unit.click();assert.equal(doc.querySelector('[data-floor-mode="2d"]').getAttribute('aria-pressed'),'true');assert.equal(status.hidden,false);assert.equal(status.closest('.plan-stage').dataset.planLoading,'true');assert.equal(status.closest('[hidden]'),null);assert.match(status.textContent,/2D house/);release();await flushPaint();assert.equal(status.hidden,true);assert.equal(status.closest('.plan-stage').dataset.planLoading,undefined);
  doc.querySelector('[data-floor-mode="furnished"]').click();assert.equal(status.hidden,false);assert.match(status.textContent,/furnished view/);release();await flushPaint();assert.equal(status.hidden,true);
  doc.querySelector('[data-floor-mode="rotate"]').click();await flushPaint();assert.equal(status.hidden,true);assert.equal(status.closest('.plan-stage').dataset.planLoading,undefined);assert.equal(doc.querySelector('#floor-3d').hidden,false);
  doc.querySelector('#floor-back').click();assert.equal(doc.querySelector('#floor-dialog').classList.contains('apartment'),false);assert.equal(status.hidden,false);assert.match(status.textContent,/2D floor/);doc.querySelector('#floor-close').click();release();await flushPaint();assert.equal(status.hidden,true);
 }finally{await win.happyDOM.close();}
});
