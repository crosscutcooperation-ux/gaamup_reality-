import {readFile,writeFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createRegionalArchitecture} from '../lib/regional-landscape.js';
import {makeRoute,makeTrackLine,railPose} from '../lib/railway.js';
// The exporter needs FileReader for its in-memory geometry buffer in Node.
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}};
const terrain=JSON.parse(await readFile(new URL('../public/assets/region/terrain.json',import.meta.url)));
const architecture=JSON.parse(await readFile(new URL('../public/assets/region/architecture.json',import.meta.url)));
const route=makeRoute(),{group}=createRegionalArchitecture({terrain,architecture,route});
const steel=new T.MeshStandardMaterial({color:'#8e9488',roughness:.35,metalness:.8});
for(const side of [0,-1.7]){
  const line=makeTrackLine(route,side);
  for(const offset of [-.3,.3]){
    const points=Array.from({length:1600},(_,i)=>{const p=railPose(line,i/1599,offset).point;p.y=.13;return p;});
    group.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),1600,.032,5,false),steel));
  }
}
await writeFile(new URL('../output/blender/regional-landscape-preview.glb',import.meta.url),Buffer.from(await new GLTFExporter().parseAsync(group,{binary:true})));
console.log(group.userData);
