import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {createJourneyEnvironment,JOURNEY_SCENERY} from '../lib/journey-environment.js';
import {fitLockedMap} from '../lib/map-framing.js';
import sharp from 'sharp';
import {makeRoute,railPose} from '../lib/railway.js';

test('surrounding terrain stays below both tracks and station platforms',async()=>{
  const relief=JSON.parse(await readFile(new URL('../public'+JOURNEY_SCENERY.relief,import.meta.url)));
  const scenery=createJourneyEnvironment({groundTexture:new T.Texture(),cloudTexture:new T.Texture(),relief});
  scenery.ground.updateMatrixWorld();const route=makeRoute(),ray=new T.Raycaster();
  for(let i=0;i<=400;i++)for(const side of [-5.3,-2.45,-1.7,-.95,-.75,0,.75,5.3]){
    const point=railPose(route,i/400,side).point;
    ray.set(point.clone().add(new T.Vector3(0,100,0)),new T.Vector3(0,-1,0));
    const hit=ray.intersectObject(scenery.ground)[0];
    assert.ok(hit&&hit.point.y<point.y-.1,`Terrain protrudes at route ${i/400}, offset ${side}`);
  }
  scenery.group.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});
});

test('surrounding scenery fills the aerial camera outside the scan on phone and desktop',async()=>{
  const relief=JSON.parse(await readFile(new URL('../public'+JOURNEY_SCENERY.relief,import.meta.url)));
  const scenery=createJourneyEnvironment({groundTexture:new T.Texture(),cloudTexture:new T.Texture(),relief});
  scenery.ground.updateMatrixWorld();
  const bounds=new T.Box3(new T.Vector3(-130,0,-107.05),new T.Vector3(130,19.1,107.05));
  const ray=new T.Raycaster();
  for(const aspect of [805/570,16/9,390/570]){
    const camera=new T.PerspectiveCamera(44,aspect,.2,650);fitLockedMap(camera,bounds);
    for(const x of [-.99,0,.99])for(const y of [-.99,0,.99]){
      ray.setFromCamera(new T.Vector2(x,y),camera);
      assert.ok(ray.intersectObject(scenery.ground).length,'Terrain fills every sampled aerial corner');
    }
  }
  assert.ok(scenery.sky.isMesh);assert.ok(scenery.clouds.length>=8);
  assert.ok(scenery.clouds.every(cloud=>!cloud.visible),"The map overview stays clear of white cloud overlays");
  const camera=new T.PerspectiveCamera();camera.position.set(0,250,250);
  scenery.update(10,camera);const start=scenery.clouds[0].position.clone();scenery.update(60,camera);
  assert.ok(start.distanceTo(scenery.clouds[0].position)>1,'Clouds drift in world space');
  scenery.update(60,camera,{reduced:true});assert.deepEqual(scenery.clouds[0].position,scenery.clouds[0].userData.origin);
  for(const cloud of scenery.clouds)assert.equal(cloud.material.depthWrite,false,'Transparent clouds cannot cut holes through the scene');
  scenery.beginFlight({sample:t=>({position:new T.Vector3(10,200*t,20)})});
  for(const cloud of scenery.flightClouds){assert.equal(cloud.visible,true);assert.ok(cloud.position.y>70,'Descent wisps occupy aerial flight coordinates');}
  camera.position.copy(scenery.flightClouds[0].position).add(new T.Vector3(0,0,3));scenery.update(99,camera);
  assert.ok(scenery.flightClouds[0].material.opacity>.4,'The camera reaches the visible cloud rather than fading it away on approach');
  scenery.resetFlight();assert.ok(scenery.clouds.every(cloud=>!cloud.visible));
  scenery.group.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});
});

test('the scan edge blends without making either railway line transparent',async()=>{
  const {data,info}=await sharp(fileURLToPath(new URL('../public/assets/landscape/scan-edge-mask.png',import.meta.url))).raw().toBuffer({resolveWithObject:true});
  const route=makeRoute();
  for(const side of [0,-1.7])for(let i=0;i<=120;i++){
    const p=railPose(route,i/120,side).point;
    const x=Math.round((p.x+132)/264*(info.width-1)),y=Math.round((1-(p.z+110)/220)*(info.height-1));
    assert.equal(data[(y*info.width+x)*info.channels],255,'Terrain under the railway must stay opaque');
  }
  const alpha=(await sharp(fileURLToPath(new URL('../public'+JOURNEY_SCENERY.clouds,import.meta.url))).stats()).channels[3];
  assert.equal(alpha.min,0);assert.ok(alpha.max>240,'The generated cloud keeps its transparency');
});
