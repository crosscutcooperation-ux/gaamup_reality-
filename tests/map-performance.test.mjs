import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {mapRenderQuality} from '../lib/map-performance.js';
import {LANDSCAPE_ASSETS,TRAIN_MODEL_URL} from '../lib/landscape-assets.js';
import {createForestBreeze} from '../lib/forest-breeze.js';
import {createImportedTrain} from '../lib/imported-train.js';
import {makeRoute} from '../lib/railway.js';
import {loadTrainGeometry} from './helpers/load-model.mjs';

test('GPU buffers stay within budget on phones, high-DPI laptops and 4K desktops',()=>{
 for(const [width,height,dpr,memory,cores] of [[390,570,3,4,4],[1920,900,2,8,8],[3840,1600,2,16,16]]){
  const quality=mapRenderQuality({width,height,pixelRatio:dpr,memory,cores});
  const budget=width<600?1_000_000:1_800_000;
  assert.ok(width*height*quality.pixelRatio**2<=budget+1);
  assert.ok(quality.pixelRatio>0&&quality.pixelRatio<=dpr);
 }
});
test('optimized landscape preserves route bounds and uses baked wind without runtime vertex scans',async()=>{
 const {scene}=await loadTrainGeometry(new URL('../public'+LANDSCAPE_ASSETS.model,import.meta.url));
 const bounds=new T.Box3().setFromObject(scene),route=makeRoute();
 assert.ok(Math.abs(bounds.getSize(new T.Vector3()).x-260)<.05);
 for(let i=0;i<=100;i++)assert.ok(bounds.containsPoint(route.getPointAt(i/100)));
 const meshes=[];
 scene.traverse(mesh=>{
  if(!mesh.isMesh)return;meshes.push(mesh);
  const position=mesh.geometry.getAttribute('position'),baked=mesh.geometry.getAttribute('_canopy_wind');
  assert.equal(baked.count,position.count);
  assert.ok(baked.array.every(Number.isFinite));
  position.getX=()=>{throw new Error('Wind must not rescan vertices on the UI thread');};
 });
 createForestBreeze(scene).update(1);
 for(const mesh of meshes)assert.equal(mesh.geometry.getAttribute('canopyWind'),mesh.geometry.getAttribute('_canopy_wind'));
});
test('train download is below 1 MB and passenger coaches share geometry with independent pivots',async()=>{
 const bytes=await readFile(new URL('../public'+TRAIN_MODEL_URL,import.meta.url));assert.ok(bytes.length<1_000_000);
 const {scene}=await loadTrainGeometry(),train=createImportedTrain(scene),first=train[1],second=train[2];
 assert.equal(train.length,12);assert.equal(first.children[0].geometry,second.children[0].geometry);
 const firstMesh=first.children.find(part=>part.isMesh),secondMesh=second.getObjectByName(firstMesh.name);
 assert.equal(firstMesh.geometry,secondMesh.geometry);
 assert.notEqual(first.userData.bogies[0],second.userData.bogies[0]);
 const previous=second.userData.wheels[0].rotation.z;first.userData.wheels[0].rotation.z+=1;
 assert.equal(second.userData.wheels[0].rotation.z,previous);
});
