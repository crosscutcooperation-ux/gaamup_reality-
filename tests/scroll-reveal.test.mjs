import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {observeProjectMotion} from '../lib/scroll-reveal.js';

test('project animations exit, replay on re-entry, and reset on cleanup',()=>{
  const window=new Window(),root=window.document.createElement('main');
  root.innerHTML='<div class="experience-heading"></div><figure class="story-residence-image"></figure><div class="colony-view"></div>';
  let callback,disconnects=0;const observed=new Set();
  class Observer{constructor(fn){callback=fn;}observe(element){observed.add(element);}disconnect(){disconnects++;}}
  const cleanup=observeProjectMotion(root,Observer),target=root.firstElementChild;
  assert.equal(observed.size,3);
  const trigger=(visible,top=20)=>callback([{target,isIntersecting:visible,intersectionRatio:visible?.8:0,boundingClientRect:{top}}]);
  trigger(true);assert.ok(target.classList.contains('page-in-view'));
  trigger(false,-100);assert.equal(target.classList.contains('page-in-view'),false);assert.equal(target.style.getPropertyValue('--page-exit-y'),'-40px');
  trigger(true);assert.ok(target.classList.contains('page-in-view'),'A second entrance must replay');
  trigger(false,900);assert.equal(target.style.getPropertyValue('--page-exit-y'),'40px');
  trigger(true);assert.ok(target.classList.contains('page-in-view'),'Replays in both scroll directions');
  cleanup();assert.equal(disconnects,1);assert.equal(root.classList.contains('project-motion-ready'),false);assert.equal(target.classList.contains('page-reveal'),false);
  window.happyDOM.abort();
});
