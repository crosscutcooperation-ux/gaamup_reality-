import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {observeCompanyMotion} from '../public/company/motion.js';

test('company sections animate in, reset outside either edge, and replay on return',()=>{
 const window=new Window(),root=window.document.body;
 root.innerHTML='<section class="phero"><h1>Let’s talk.</h1><p class="lead">Start a conversation.</p></section>';
 let deliver,disconnected=false;
 class Observer{constructor(callback){deliver=callback;}observe(){}disconnect(){disconnected=true;}}
 const cleanup=observeCompanyMotion(root,Observer),heading=root.querySelector('h1');
 const send=(visible,top)=>deliver([{target:heading,isIntersecting:visible,intersectionRatio:visible?.5:0,boundingClientRect:{top}}]);
 send(true,50);assert.ok(heading.classList.contains('company-in-view'));
 send(false,-90);assert.ok(!heading.classList.contains('company-in-view'));assert.equal(heading.style.getPropertyValue('--company-exit-y'),'-40px');
 send(true,20);assert.ok(heading.classList.contains('company-in-view'));
 send(false,800);assert.equal(heading.style.getPropertyValue('--company-exit-y'),'40px');
 cleanup();assert.ok(disconnected);assert.ok(!root.classList.contains('company-motion-ready'));assert.ok(!heading.classList.contains('company-reveal'));
});
