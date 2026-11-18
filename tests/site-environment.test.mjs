import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import * as T from '../public/scenes/sai-world-dreams/vendor/three.module.js';
import {createSiteEnvironment,SITE_SURROUNDINGS} from '../public/scenes/sai-world-dreams/site-environment.js';
test('the surroundings use a real locally stored satellite JPEG with location and attribution metadata',async()=>{
 const path=new URL('../public/scenes/sai-world-dreams/assets/dombivli-satellite-2016.jpg',import.meta.url);const bytes=await readFile(path);assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.ok(bytes.length>100000);
 const metadata=JSON.parse(await readFile(new URL('dombivli-satellite-2016.json',path),'utf8'));assert.equal(metadata.license,'CC BY 4.0');assert.deepEqual(metadata.bounds,SITE_SURROUNDINGS.bounds);assert.equal(metadata.source,'EOX Sentinel-2 cloudless 2016');
});
test('clouds, stars and the moon follow the scene lighting and release their resources',async()=>{
 const win=new Window();Object.assign(globalThis,{document:win.document,matchMedia:()=>({matches:false})});
 win.HTMLCanvasElement.prototype.getContext=()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}});
 const load=T.TextureLoader.prototype.loadAsync;T.TextureLoader.prototype.loadAsync=async()=>new T.Texture();
 const scene=new T.Scene(),context=new T.Group(),ground=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshStandardMaterial());ground.name='Context ground';context.add(ground);let environment;
 try{
  environment=await createSiteEnvironment({scene,renderer:{capabilities:{getMaxAnisotropy:()=>8}},model:{context}});
  assert.equal(ground.visible,false);const stars=environment.group.getObjectByName('Night stars'),moon=environment.group.getObjectByName('Moon and soft halo'),clouds=environment.group.getObjectByName('Soft drifting cloud layer');
  assert.equal(stars.geometry.attributes.position.count,1400);assert.equal(stars.material.uniforms.intensity.value,0);assert.equal(moon.material.opacity,0);
  win.document.dispatchEvent(new win.CustomEvent('architectural-lighting-change',{detail:{name:'night'}}));assert.equal(environment.lighting,'night');assert.equal(stars.material.uniforms.intensity.value,1);assert.ok(moon.material.opacity>.9);assert.equal(clouds.material.uniforms.night.value,1);
  win.document.dispatchEvent(new win.CustomEvent('architectural-lighting-change',{detail:{name:'day'}}));assert.equal(stars.material.uniforms.intensity.value,0);assert.equal(moon.material.opacity,0);assert.equal(environment.update(200),true);assert.equal(environment.update(210),false);
  environment.dispose();assert.equal(scene.children.length,0);
 }finally{T.TextureLoader.prototype.loadAsync=load;await win.happyDOM.close();}
});
