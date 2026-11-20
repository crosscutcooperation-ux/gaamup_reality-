import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {makeRoute,railPose,transitionHead,stationDistance} from '../lib/railway.js';
import {createImportedCoach,createImportedTrain} from '../lib/imported-train.js';
import {loadTrainGeometry} from './helpers/load-model.mjs';
const modelAsset=await loadTrainGeometry();
function createCoach({cab=false}={}){return createImportedCoach(modelAsset.scene.getObjectByName(cab?'AC_Driving_Cab':'AC_Local_Coach'),{cab});}
import {createCameraFlight,JOURNEY_DURATION,APPROACH_DURATION,BRAND_PASS_DURATION,TRAIN_SPEED} from '../lib/camera-flight.js';
import {fitLockedMap} from '../lib/map-framing.js';
const mapCamera=new THREE.PerspectiveCamera(44,16/9,.2,1000);
const framing=fitLockedMap(mapCamera,new THREE.Box3(new THREE.Vector3(-130,0,-107.05),new THREE.Vector3(130,20,107.05)));
const start=mapCamera.position.clone(),startTarget=framing.target;
test('graded map rails keep bogies aligned and their gauge constant',()=>{
  const route=makeRoute();
  for(let i=0;i<1000;i++){const u=-.28+i/1000*1.56,{point,tangent,normal,heading}=railPose(route,u),left=railPose(route,u,-.3).point,right=railPose(route,u,.3).point;assert.ok(Math.abs(left.distanceTo(right)-.6)<1e-9);assert.ok(Math.abs(tangent.dot(normal))<1e-9);assert.ok(Number.isFinite(point.y));assert.ok(Math.abs(new THREE.Vector3(1,0,0).applyQuaternion(railPose(route,u).quaternion).dot(tangent)-1)<1e-8);const axle=railPose(route,u+1.856/route.getLength()),local=axle.point.clone().sub(point).applyAxisAngle(new THREE.Vector3(0,1,0),-heading);assert.ok(local.applyAxisAngle(new THREE.Vector3(0,1,0),heading).add(point).distanceTo(axle.point)<1e-8);}
});
test('the train makes one local approach instead of circling the map',()=>{
  const route=makeRoute(),length=route.getLength();
  for(let index=0;index<16;index++){
    const stop=stationDistance(index,16);let previous=-Infinity,oldHeading,rotation=0;
    for(let i=0;i<=200;i++){const head=transitionHead(stop,i/200,length),pose=railPose(route,head);assert.ok(head>previous);previous=head;if(oldHeading!==undefined)rotation+=Math.abs(Math.atan2(Math.sin(pose.heading-oldHeading),Math.cos(pose.heading-oldHeading)));oldHeading=pose.heading;}
    assert.ok(rotation<Math.PI*1.5,`Station ${index}: no full rotations`);assert.ok((transitionHead(stop,1,length)-transitionHead(stop,0,length))*length<22);
  }
});
test('camera descends smoothly from the current aerial view to the opposite side at every station',()=>{
  const route=makeRoute();assert.equal(APPROACH_DURATION,3600);assert.equal(BRAND_PASS_DURATION,2000);assert.equal(JOURNEY_DURATION,5600);
  for(let index=0;index<16;index++){
    const station=railPose(route,stationDistance(index,16)),flight=createCameraFlight({start,startTarget,station});
    assert.ok(flight.sample(0).position.distanceTo(start)<1e-9);assert.ok(flight.sample(0).target.distanceTo(startTarget)<1e-9);
    let last=flight.sample(0);for(let i=1;i<=500;i++){const view=flight.sample(i/500);assert.ok(view.position.y<=last.position.y+1e-8);assert.ok(view.position.y>=station.point.y+1.6-1e-8);assert.ok(last.quaternion.angleTo(view.quaternion)<.08,'No sudden camera spin');last=view;}
    const end=flight.sample(1);assert.ok(Math.abs(end.position.y-station.point.y-1.6)<1e-8);assert.ok(start.clone().sub(station.point).dot(station.normal)*end.position.clone().sub(station.point).dot(station.normal)<=0,'Finish on the other side');const arrival=flight.sample(APPROACH_DURATION/JOURNEY_DURATION);for(let step=0;step<=20;step++){const progress=APPROACH_DURATION/JOURNEY_DURATION+(1-APPROACH_DURATION/JOURNEY_DURATION)*step/20,pass=flight.sample(progress);assert.ok(pass.position.equals(arrival.position),'Camera position must remain exactly fixed for the full two seconds');assert.ok(pass.target.equals(arrival.target),'Camera target must remain exactly fixed');assert.ok(pass.quaternion.equals(arrival.quaternion),'No camera rotation while the train passes');assert.equal(pass.approach,1);assert.ok(Math.abs(pass.passDistance-step/20*(BRAND_PASS_DURATION/1000)*TRAIN_SPEED)<1e-8,'Only the train advances at the approach speed during the two seconds');}
  }
});
test('fixed closer camera keeps the moving carriage centre, roof and wheels visible',()=>{
  const route=makeRoute(),length=route.getLength();
  for(const stop of [.27,.5,.73])for(const aspect of [18/9,16/9,9/19.5,2.4])for(const progress of [APPROACH_DURATION/JOURNEY_DURATION,.8,1]){
    const view=createCameraFlight({start,startTarget,station:railPose(route,stop),aspect}).sample(progress);
    const camera=new THREE.PerspectiveCamera(44,aspect,.2,1000);camera.position.copy(view.position);camera.quaternion.copy(view.quaternion);camera.updateMatrixWorld();
    const head=transitionHead(stop,view.approach,length)+view.passDistance/length;
    const pose=Array.from({length:12},(_,car)=>railPose(route,head-car*6.05/length)).sort((a,b)=>a.point.distanceToSquared(view.target)-b.point.distanceToSquared(view.target))[0],xs=[];
    for(const x of [-3,3])for(const y of [0,2.2])for(const z of [-.6,.6]){
      const p=new THREE.Vector3(x,y,z).applyQuaternion(pose.quaternion).add(pose.point).project(camera);xs.push(p.x);
      assert.ok(Math.abs(p.y)<.96&&p.z<1,`Roof and wheels stay vertically visible at ${aspect}`);
    }
    const centre=pose.point.clone().add(new THREE.Vector3(0,1.1,0)).project(camera);assert.ok(Math.abs(centre.x)<.96,'A passing branded carriage stays in the fixed frame');
    if(aspect>=1.7&&aspect<=2)assert.ok(Math.max(...xs)-Math.min(...xs)>1.6,'Closer carriage fills at least 80% of frame width while its ends pass through');
  }
});

test('train speed stays constant through the approach and the full two-second pass',()=>{
  const route=makeRoute(),length=route.getLength(),stop=.5,flight=createCameraFlight({start,startTarget,station:railPose(route,stop),aspect:2});
  const headAt=ms=>{const view=flight.sample(ms/JOURNEY_DURATION);return transitionHead(stop,view.approach,length)+view.passDistance/length;};
  for(const ms of [1000,APPROACH_DURATION-10,APPROACH_DURATION,APPROACH_DURATION+500,JOURNEY_DURATION-10]){
    const speed=(headAt(ms+10)-headAt(ms))*length/.01;
    assert.ok(Math.abs(speed-21/3.6)<1e-8,`No slowdown at ${ms}ms: ${speed}`);
  }
  assert.ok(Math.abs((headAt(JOURNEY_DURATION)-headAt(APPROACH_DURATION))*length-21/3.6*2)<1e-8);
});

function disposeModel(model){const geometries=new Set(),materials=new Set();model.traverse(part=>{if(part.geometry)geometries.add(part.geometry);if(part.material)materials.add(part.material);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
test('Blender GLB embeds textures and retains solid sides, working pivots and wheel contact',()=>{
  assert.ok(modelAsset.imageCount>=5,'Paint and roof textures are embedded in the GLB');
  for(const cab of [false,true]){
    const model=createCoach({cab});model.updateMatrixWorld(true);
    assert.equal(model.userData.source,'Blender');assert.equal(model.userData.style,'Mumbai AC local EMU');assert.equal(model.userData.wheels.length,8);assert.equal(model.userData.bogies.length,2);
    assert.ok(model.children.filter(part=>part.isMesh).length<=25,'Static detail meshes are batched by material');
    for(const wheel of model.userData.wheels){assert.ok(Math.abs(wheel.position.y-.14-.162)<1e-6,'Wheel contacts rail head');assert.equal(wheel.userData.rollAxis,'z');}
    const ray=new THREE.Raycaster(),half=model.userData.length/2,margin=cab?.1:.03;
    for(const side of [-1,1])for(let x=-half+margin;x<half-margin;x+=.071)for(let y=.45;y<1.24;y+=.073){
      ray.set(new THREE.Vector3(x,y,side*2),new THREE.Vector3(.03,0,-side).normalize());
      const hits=ray.intersectObject(model,true);assert.ok(hits.length,`Closed side at ${x}, ${y}`);
      assert.ok(hits[0].point.z*side>=(cab?.375:.425),'First hit stays on the near skin, including the rounded cab edges');
    }
    model.traverse(part=>{if(part.isMesh)for(const value of part.geometry.attributes.position.array)assert.ok(Number.isFinite(value),'Imported mesh coordinates are finite');});
    disposeModel(model);
  }
});

test('the Mumbai AC local has a 12-car consist with driving cabs at both ends',()=>{const train=createImportedTrain(modelAsset.scene);assert.equal(train.length,12);assert.equal(train[0].name,'Mumbai AC local driving car');assert.equal(train[11].userData.rear,true);for(const car of train){assert.equal(car.userData.length,5.8);disposeModel(car);}});
test('PanPops vinyl wrap surrounds the glazing on both sides of every coach',()=>{
  const train=createImportedTrain(modelAsset.scene,{adTexture:new THREE.Texture()});
  assert.equal(train.length,12);
  for(const car of train){
    const ads=car.children.filter(part=>part.name==='PanPops full-carriage advertisement');
    assert.equal(ads.length,4);
    assert.ok(ads.every(part=>(part.position.y<.84||part.position.y>1.18)&&part.material.map?.isTexture));
    assert.ok(ads.some(part=>part.position.z<0)&&ads.some(part=>part.position.z>0));
    disposeModel(car);
  }
});
test('PanPops artwork uses the actual proportions of each train panel',()=>{
  const textures={
    coachLower:new THREE.Texture({width:2048,height:154}),
    coachUpper:new THREE.Texture({width:2057,height:60}),
    cabLower:new THREE.Texture({width:1024,height:145}),
    cabUpper:new THREE.Texture({width:1024,height:56}),
  };
  for(const cab of [false,true]){
    const car=createImportedCoach(modelAsset.scene.getObjectByName(cab?'AC_Driving_Cab':'AC_Local_Coach'),{cab,adTexture:textures});
    const panels=car.children.filter(part=>part.name==='PanPops full-carriage advertisement');
    for(const panel of panels){
      const panelRatio=panel.geometry.parameters.width/panel.geometry.parameters.height;
      const image=panel.material.map.image;
      assert.ok(Math.abs(panelRatio-image.width/image.height)<.15,`Vinyl must not be stretched on ${cab?'cab':'coach'} panel`);
    }
    disposeModel(car);
  }
});
