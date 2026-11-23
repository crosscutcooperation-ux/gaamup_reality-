import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {loadTrainGeometry} from './helpers/load-model.mjs';
import {prepareScannedLandscape,SCAN_MODEL_URL} from '../lib/scanned-landscape.js';
import {makeRoute,railPose,makeTrackLine,createTrackBed,stationDistance} from '../lib/railway.js';
const root=new URL('../',import.meta.url);
test('the downloaded landscape is a local textured GLB with attribution and checked ground contact',async()=>{
  const manifest=JSON.parse(await readFile(new URL('public/assets/landscape/manifest.json',root)));
  const source=await readFile(new URL('public/models/nature-landscape.glb',root));
  assert.equal(source.length,manifest.bytes);assert.equal(createHash('sha256').update(source).digest('hex'),manifest.sha256);
  const bytes=await readFile(new URL('public'+SCAN_MODEL_URL,root));
  assert.ok(bytes.length<source.length,'The browser model is smaller than the attributed source');
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  assert.match(json.asset.extras.author,/Laslo.S/);assert.match(json.asset.extras.license,/CC-BY-4.0/);assert.ok(json.images.length>=8);
  const asset=await loadTrainGeometry(new URL('public'+SCAN_MODEL_URL,root)),{group,bounds}=prepareScannedLandscape(asset.scene);
  assert.equal(manifest.bounds.max[0]-manifest.bounds.min[0],260);
  // The new simplified runtime mesh uses the same 5cm envelope as map-performance.test.
  assert.ok(Math.abs(bounds.getSize(new T.Vector3()).x-260)<.05);assert.ok(bounds.getSize(new T.Vector3()).y>10);
  const route=makeRoute();for(let i=0;i<=100;i++)assert.ok(bounds.containsPoint(route.getPointAt(i/100)),'The track stays within the actual scan');
  for(let i=0;i<3;i++)assert.ok(stationDistance(i,3)>.2&&stationDistance(i,3)<.8);
  const validation=JSON.parse(await readFile(new URL('public/assets/landscape/grounding-validation.json',root)));
  assert.equal(validation.passed,true);assert.equal(validation.misses,0);assert.ok(validation.checks>=1200);assert.ok(validation.maximumGroundError<.01);
  group.traverse(object=>{object.geometry?.dispose();for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])material.dispose();});
});
test('the solid ballast supports the sleepers and faces upward along both graded tracks',()=>{
  const route=makeRoute(),ray=new T.Raycaster();
  for(const side of [0,-1.7]){
    const line=makeTrackLine(route,side),material=new T.MeshStandardMaterial(),bed=createTrackBed(line,1.55,material);bed.updateMatrixWorld();
    for(const u of [.15,.3,.5,.7,.85]){
      const pose=railPose(line,u);ray.set(pose.point.clone().add(new T.Vector3(0,5,0)),new T.Vector3(0,-1,0));
      const hit=ray.intersectObject(bed)[0];assert.ok(hit,'The ballast top is visible from above');
      assert.ok(Math.abs(hit.point.y-pose.point.y-.04)<.005,'The bed follows the route height');
      assert.ok(hit.point.y>pose.point.y+.0245,'Sleeper bottoms intersect the ballast');
      assert.ok(pose.up.y>.9,'The train remains upright on the grade');
    }
    bed.geometry.dispose();material.dispose();
  }
});
