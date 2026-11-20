import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import * as T from 'three';
import {pendingDestination} from '../lib/navigation-feedback.js';
import {createForestBreeze} from '../lib/forest-breeze.js';
import {observeCompanyMotion} from '../public/company/motion.js';

test('navigation feedback ignores same-page anchors, external links and new tabs',()=>{
 const win=new Window({url:'https://gaamupproperties.com/'}),link=win.document.createElement('a');win.document.body.append(link);
 const event={button:0,target:link};link.href='/about';assert.equal(pendingDestination(event,win.location),'/about');
 link.href='/#locations';assert.equal(pendingDestination(event,win.location),null);link.href='https://example.com/about';assert.equal(pendingDestination(event,win.location),null);
 link.href='/contact';link.target='_blank';assert.equal(pendingDestination(event,win.location),null);link.target='';assert.equal(pendingDestination({...event,ctrlKey:true},win.location),null);
});
test('company entrances wait for a painted starting pose and cancel on unmount',()=>{
 const win=new Window(),root=win.document.body;root.innerHTML='<section class="phero"><h1>Our company</h1></section>';
 const queue=[];let observed=0;class Observer{observe(){observed++;}disconnect(){}}
 const stop=observeCompanyMotion(root,Observer,cb=>queue.push(cb));assert.equal(observed,0);queue.shift()();assert.equal(observed,0);queue.shift()();assert.equal(observed,1);stop();
 root.innerHTML='<section class="phero"><h1>Contact</h1></section>';const stopEarly=observeCompanyMotion(root,Observer,cb=>queue.push(cb));stopEarly();queue.shift()();queue.shift()();assert.equal(observed,1);
});
test('forest breeze pins the ground, preserves every source position and respects reduced motion',()=>{
 const root=new T.Group(),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,1,1,10,1],3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1],2));
 const material=new T.MeshStandardMaterial({map:new T.Texture()});let originalHook=false;material.onBeforeCompile=s=>{originalHook=true;s.vertexShader+='\n// original edge treatment';};root.add(new T.Mesh(geometry,material));
 const before=geometry.attributes.position.array.slice(),breeze=createForestBreeze(root),weights=geometry.attributes.canopyWind;
 assert.equal(weights.getX(0),0);assert.equal(weights.getX(1),0);assert.ok(weights.getX(2)>0);assert.deepEqual(geometry.attributes.position.array,before);
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>'};material.onBeforeCompile(shader);assert.ok(originalHook);assert.match(shader.vertexShader,/original edge treatment/);
 breeze.update(10);assert.equal(shader.uniforms.forestTime.value,10);breeze.update(20,{reduced:true});assert.equal(shader.uniforms.forestStrength.value,0);geometry.dispose();material.map.dispose();material.dispose();
});
