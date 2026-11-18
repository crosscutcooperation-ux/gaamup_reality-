import test from 'node:test';
import assert from 'node:assert/strict';
import {completeStationJourney} from '../lib/journey-flow.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('station navigation waits for scene readiness, the physical train and the fade',async()=>{
  const ready=deferred(),arrival=deferred(),fade=deferred(),events=[];const scene={travelTo(){}};
  const flow=completeStationJourney({ready:ready.promise,play:async value=>{assert.equal(value,scene);events.push('train');await arrival.promise;},cover:async()=>{events.push('fade');await fade.promise;},navigate:()=>events.push('destination')});
  await tick();assert.deepEqual(events,[]);
  ready.resolve(scene);await tick();assert.deepEqual(events,['train']);
  arrival.resolve();await tick();assert.deepEqual(events,['train','fade']);
  fade.resolve();await flow;assert.deepEqual(events,['train','fade','destination']);
});
test('a missing scene keeps the user on the homepage',async()=>{
  let navigated=false;await assert.rejects(completeStationJourney({ready:Promise.resolve(null),play:async()=>{},cover:async()=>{},navigate:()=>{navigated=true;}}),/not ready/);assert.equal(navigated,false);
});
test('an animation failure never navigates or covers up the error',async()=>{
  const events=[];await assert.rejects(completeStationJourney({ready:Promise.resolve({travelTo(){}}),play:async()=>{throw new Error('Graphics connection lost');},cover:async()=>events.push('fade'),navigate:()=>events.push('destination')}),/Graphics connection/);assert.deepEqual(events,[]);
});
test('cancelling during a journey prevents a late redirect',async()=>{
  const abort=new AbortController(),arrival=deferred();let navigated=false;
  const flow=completeStationJourney({ready:Promise.resolve({travelTo(){}}),signal:abort.signal,play:()=>arrival.promise,cover:async()=>{},navigate:()=>{navigated=true;}});
  await tick();abort.abort(new Error('Returned to homepage'));arrival.resolve();await assert.rejects(flow,/Returned/);assert.equal(navigated,false);
});
test('a failed fade does not open a destination prematurely',async()=>{
  let navigated=false;await assert.rejects(completeStationJourney({ready:Promise.resolve({travelTo(){}}),play:async()=>{},cover:async()=>{throw new Error('Interrupted fade');},navigate:()=>{navigated=true;}}),/Interrupted/);assert.equal(navigated,false);
});
