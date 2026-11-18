import {writeFile} from 'node:fs/promises';
import * as T from 'three';
import {makeRoute,makeTrackLine,railPose,stationDistance} from '../lib/railway.js';
import {fitLockedMap} from '../lib/map-framing.js';
import {createCameraFlight} from '../lib/camera-flight.js';
const route=makeRoute(),dummy=new T.Object3D(),tracks=[];
const matrix=(pose,offset=0)=>{dummy.position.copy(pose.point);dummy.position.y+=offset;dummy.quaternion.copy(pose.quaternion);dummy.updateMatrix();return dummy.matrix.toArray();};
for(const side of [0,-1.7]){
 const line=makeTrackLine(route,side),points=Array.from({length:1601},(_,i)=>{const p=railPose(line,i/1600);return {point:p.point.toArray(),normal:p.normal.toArray()};});
 const count=Math.ceil(line.getLength()/.42),sleepers=Array.from({length:count},(_,i)=>matrix(railPose(line,i/(count-1)),.062));tracks.push({side,points,sleepers});
}
const cars=Array.from({length:12},(_,i)=>({cab:i===0||i===11,rear:i===11,matrix:matrix(railPose(route,.58-i*5.92/route.getLength()))}));
const stations=Array.from({length:3},(_,i)=>({index:i,matrix:matrix(railPose(route,stationDistance(i,3),i%2===0?4.5:-4.5))}));
const camera=new T.PerspectiveCamera(44,1208/855,.2,1000),bounds=new T.Box3(new T.Vector3(-130,0,-107.05),new T.Vector3(130,19.1,107.05));
const {target}=fitLockedMap(camera,bounds);
await writeFile('output/blender/scan-railway-scene.json',JSON.stringify({tracks,cars,stations,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray()}}));
const flight=createCameraFlight({start:camera.position.clone(),startTarget:target,station:railPose(route,stationDistance(1,3))});
const shots=[{name:'aerial',position:camera.position.toArray(),target:target.toArray(),width:1208,height:855}];
for(const [name,progress] of [['descent',.45],['trackside',.94]]){const sample=flight.sample(progress);shots.push({name,progress,position:sample.position.toArray(),target:sample.target.toArray(),width:1208,height:855});}
await writeFile('output/blender/atmosphere-shots.json',JSON.stringify(shots));
await writeFile('output/blender/flight-clouds.json',JSON.stringify([.39,.45,.52,.59].map((p,i)=>({position:flight.sample(p).position.toArray(),width:70-i*10,opacity:.58-i*.05}))));
