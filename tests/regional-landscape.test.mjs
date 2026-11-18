import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createElevationSampler,createRegionalArchitecture} from '../lib/regional-landscape.js';
import * as T from 'three';
import {REGION,geoToWorld,LOCATION_ANCHORS,JOURNEY_COORDINATES} from '../lib/region.js';
const makeRoute=()=>new T.CatmullRomCurve3(JOURNEY_COORDINATES.map(p=>{const [x,z]=geoToWorld(...p);return new T.Vector3(x,0,z);}),false,'centripetal');
const terrain=JSON.parse(await readFile(new URL('../public/assets/region/terrain.json',import.meta.url)));
const architecture=JSON.parse(await readFile(new URL('../public/assets/region/architecture.json',import.meta.url)));
test('the archived regional dataset retains measured elevation and hill locations',()=>{
  assert.deepEqual(terrain.bounds,REGION.bounds);assert.equal(terrain.heights.length,terrain.columns*terrain.rows);
  assert.equal(terrain.tiles.length,9);assert.ok(terrain.heights.some(h=>h>500));
  const height=createElevationSampler(terrain);
  for(const [x,z] of [[-110,60],[-120,0],[40,-40],[0,0]])assert.ok(Number.isFinite(height(x,z))&&height(x,z)>=0);

});
test('the landscape builds real architecture and woodland without blocking the railway corridor',()=>{
  const route=makeRoute(),scene=createRegionalArchitecture({terrain,architecture,route});
  assert.ok(scene.group.userData.buildingCount>10000);assert.ok(scene.group.userData.treeCount>3000);
  for(const name of ['Measured terrain relief','Mapped buildings — textured walls','Mapped rooftops','Mapped road network','Ulhas river and mapped waterways','Instanced hillside woodland'])assert.ok(scene.group.getObjectByName(name),name);
  const buildings=scene.group.getObjectByName('Mapped buildings — textured walls');buildings.geometry.computeBoundingBox();assert.ok(buildings.geometry.boundingBox.max.y>3);
  for(let i=0;i<=100;i++){const p=route.getPointAt(i/100);assert.equal(scene.height(p.x,p.z),0,'Rails remain grounded through the whole journey');}
  const resources=new Set();scene.group.traverse(object=>{if(object.geometry)resources.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])resources.add(material);});for(const resource of resources)resource.dispose();
});
