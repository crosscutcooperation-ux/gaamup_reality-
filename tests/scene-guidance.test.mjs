import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import * as T from '../public/scenes/sai-world-dreams/vendor/three.module.js';
import {createSceneGuidance} from '../public/scenes/sai-world-dreams/scene-guidance.js';
import {APARTMENT_LIGHTING,frameApartmentLights} from '../public/scenes/sai-world-dreams/apartment-lighting.js';
test('the demonstration hand follows real buildings, opens only on click and can be replayed',async()=>{
  const win=new Window();globalThis.document=win.document;globalThis.CustomEvent=win.CustomEvent;
  document.body.innerHTML='<div id="viewport"></div><button id="show-scene-help"></button><div id="elevation-stage"></div><div id="plan-2d"></div>';
  const host=document.getElementById('viewport');Object.defineProperties(host,{clientWidth:{value:900},clientHeight:{value:700}});
  const camera=new T.PerspectiveCamera(45,900/700,.1,500);camera.position.set(0,100,180);camera.lookAt(0,40,0);camera.updateMatrixWorld();
  const towers=['Castle','Spring','Breeze'].map((name,index)=>{const group=new T.Group();group.position.x=index*15;group.userData={name,towerId:['A','D','H'][index]};return group;});
  const calls=[],guide=createSceneGuidance({camera,towers,host,focusTower:id=>calls.push(id)});
  try{
    guide.update(0,true);const button=document.querySelector('.architecture-guide');assert.equal(button.hidden,false);assert.match(button.textContent,/Castle/);
    const first=button.style.left;guide.update(6300,true);assert.match(button.textContent,/Spring/);assert.notEqual(button.style.left,first);assert.deepEqual(calls,[],'The demonstration does not navigate automatically');
    button.click();assert.deepEqual(calls,['D']);guide.update(6400,true);assert.equal(button.hidden,true);
    document.getElementById('show-scene-help').click();guide.update(6500,true);assert.equal(button.hidden,false);
    document.dispatchEvent(new win.CustomEvent('tower-focus',{detail:'A'}));guide.update(6600,true);assert.equal(button.hidden,true);
  }finally{guide.dispose();assert.equal(document.querySelector('.architecture-guide'),null);await win.happyDOM.close();}
});
test('apartment lighting preserves contrast with low ambient, a directional key and fitted shadows',()=>{
  assert.ok(APARTMENT_LIGHTING.hemisphere<.5);assert.ok(APARTMENT_LIGHTING.environment<.4);assert.ok(APARTMENT_LIGHTING.exposure<=1);
  const key=new T.DirectionalLight(),fill=new T.DirectionalLight(),rim=new T.DirectionalLight(),center=new T.Vector3(0,.7,0);
  frameApartmentLights({key,fill,rim,span:14,center});
  assert.ok(key.position.y>14);assert.ok(key.shadow.camera.right<12);assert.ok(key.target.position.distanceTo(center)<1e-8);assert.ok(key.shadow.normalBias<.02);
});
