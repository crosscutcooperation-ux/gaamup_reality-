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
 send(false,-90);assert.ok(!heading.classList.contains('company-in-view'));assert.equal(heading.style.getPropertyValue('--company-exit-y'),'-20px');
 send(true,20);assert.ok(heading.classList.contains('company-in-view'));
 send(false,800);assert.equal(heading.style.getPropertyValue('--company-exit-y'),'20px');
 cleanup();assert.ok(disconnected);assert.ok(!root.classList.contains('company-motion-ready'));assert.ok(!heading.classList.contains('company-reveal'));
});


test('word motion preserves text, emphasis, forms and the original DOM after cleanup',()=>{
 const win=new Window(),root=win.document.body;
 root.innerHTML='<section class="phero"><h1>A home. <em>Your story.</em></h1><p class="lead">A clear new beginning.</p></section><form><label>Your name<input name="name" value="Buyer"/></label></form>';
 const text=root.textContent,original=root.querySelector('h1').firstChild;
 class Observer{observe(){}disconnect(){}}
 const stop=observeCompanyMotion(root,Observer);
 assert.equal(root.textContent,text);assert.equal(root.querySelector('em').textContent,'Your story.');
 assert.equal(root.querySelectorAll('.company-word').length,8);assert.equal(root.querySelector('form .company-word'),null);
 assert.equal(root.querySelector('input').value,'Buyer');stop();
 assert.equal(root.querySelector('h1').firstChild,original);assert.equal(root.querySelectorAll('.company-word-group').length,0);assert.equal(root.textContent,text);
});
