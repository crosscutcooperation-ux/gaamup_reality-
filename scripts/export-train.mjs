import {mkdir,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createCoach} from '../lib/train-model.js';

// The exporter uses this small browser API even when no textures are present.
globalThis.FileReader=class{
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}).catch(error=>this.onerror?.(error));}
};
const scene=new THREE.Scene();scene.name='AERO Mumbai suburban train';
const offsets=[0,5.45,11.5,17.55,23.6,29.65];
for(let i=0;i<offsets.length;i++){
  const coach=createCoach({cab:i===0});coach.position.x=-offsets[i];
  // Runtime wheel references are not serializable glTF metadata.
  coach.userData={length:coach.userData.length,procedural:true,style:coach.userData.style};scene.add(coach);
}
const result=await new GLTFExporter().parseAsync(scene,{binary:true});
const folder=new URL('../public/models/',import.meta.url);await mkdir(folder,{recursive:true});
await writeFile(new URL('aero-suburban-train.glb',folder),new Uint8Array(result));
console.log(`Exported public/models/aero-suburban-train.glb (${Math.round(result.byteLength/1024)} KB)`);
