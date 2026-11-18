import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLandscape} from '../lib/landscape.js';
import {makeRoute,makeTrackLine,railPose} from '../lib/railway.js';
test('the complete ground uses in-bounds satellite UVs instead of stretching the edge pixels',async()=>{
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(256*170*4).fill(120)})})})};
  try{
    const {geometry}=createLandscape({image:{}},makeRoute());
    for(const value of geometry.attributes.uv.array)assert.ok(value>=0&&value<=1);
    for(const value of geometry.attributes.position.array)assert.ok(Number.isFinite(value));
    for(const value of geometry.attributes.normal.array)assert.ok(Number.isFinite(value));
    geometry.dispose();
    const image=await readFile(new URL('../public/assets/landscape/woodland-surroundings.webp',import.meta.url));
    assert.equal(image.toString('ascii',0,4),'RIFF');
  }finally{globalThis.document=previous;}
});
test('each physical line ends on the scan instead of extending beyond the model',()=>{
  const route=makeRoute();
  for(const side of [0,-1.7]){
    const line=makeTrackLine(route,side);
    assert.ok(line.getPoint(0).distanceTo(railPose(route,0,side).point)<1e-8);
    assert.ok(line.getPoint(1).distanceTo(railPose(route,1,side).point)<1e-8);
    for(let i=1;i<line.points.length;i++)assert.ok(line.points[i].distanceTo(line.points[i-1])>.01,'No repeated seam vertices');
  }
});
