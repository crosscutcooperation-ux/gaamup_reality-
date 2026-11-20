import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from './helpers/scene-dom.mjs';
import {createPlanFeedback} from '../public/scenes/sai-world-dreams/plan-feedback.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('plan loading stays visible until decoding finishes, including furnished images',async()=>{
 const win=new Window(),status=win.document.createElement('div'),image=win.document.createElement('img'),feedback=createPlanFeedback(status),pending=deferred();image.decode=()=>pending.promise;
 let ready=0;const done=feedback.image(image,'/furnished.webp','Loading the furnished view…',{ready:()=>ready++});assert.equal(status.hidden,false);assert.equal(status.dataset.loading,'true');assert.match(status.textContent,/furnished/);assert.equal(ready,0);
 pending.resolve();assert.equal(await done,true);assert.equal(status.hidden,true);assert.equal(ready,1);await win.happyDOM.close();
});
test('a superseded image cannot dismiss a newer floor or 3D loader',async()=>{
 const win=new Window(),status=win.document.createElement('div'),feedback=createPlanFeedback(status),a=deferred(),b=deferred();let stalePaint=false;
 const first=feedback.run(()=>a.promise,'Loading house A',{ready:()=>stalePaint=true});const second=feedback.run(()=>b.promise,'Loading house B');a.resolve();await first;assert.equal(stalePaint,false);assert.equal(status.hidden,false);assert.equal(status.textContent,'Loading house B');b.resolve();await second;assert.equal(status.hidden,true);
 const c=deferred(),closed=feedback.run(()=>c.promise,'Loading a floor');feedback.cancel();c.resolve();await closed;assert.equal(status.hidden,true);await win.happyDOM.close();
});
test('a failed drawing presents recovery text and stops the spinner',async()=>{
 const win=new Window(),status=win.document.createElement('div'),feedback=createPlanFeedback(status);const ok=await feedback.run(()=>Promise.reject(new Error('decode failed')),'Loading 2D…');assert.equal(ok,false);assert.equal(status.hidden,false);assert.equal(status.dataset.loading,'false');assert.match(status.textContent,/retry/);await win.happyDOM.close();
});
