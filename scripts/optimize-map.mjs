import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup,weld,simplify,textureCompress,draco,prune} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import {Matrix4,Vector3,MathUtils} from 'three';
import {LANDSCAPE_ASSETS} from '../lib/landscape-assets.js';

const root=new URL('../',import.meta.url),report={};
await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
 'draco3d.decoder':await draco3d.createDecoderModule(),
 'draco3d.encoder':await draco3d.createEncoderModule(),
});
const count=doc=>doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((n,p)=>n+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0);

// Bake canopy height weights into the model rather than doing millions of
// neighborhood lookups on the browser's UI thread on every page visit.
function bakeWind(doc){
 const primitives=[],ground=new Map(),point=new Vector3(),cell=5;
 const key=(x,z)=>`${x},${z}`;
 for(const node of doc.getRoot().listNodes()){
  if(!node.getMesh())continue;
  const matrix=new Matrix4().fromArray(node.getWorldMatrix()),scale=new Vector3().setFromMatrixScale(matrix);
  for(const primitive of node.getMesh().listPrimitives()){
   const position=primitive.getAttribute('POSITION');primitives.push({primitive,position,matrix,scale});
   for(let i=0;i<position.getCount();i++){
    point.fromArray(position.getArray(),i*3).applyMatrix4(matrix);
    const k=key(Math.floor(point.x/cell),Math.floor(point.z/cell));ground.set(k,Math.min(ground.get(k)??Infinity,point.y));
   }
  }
 }
 for(const {primitive,position,matrix,scale} of primitives){
  const weights=new Float32Array(position.getCount()*2);
  for(let i=0;i<position.getCount();i++){
   point.fromArray(position.getArray(),i*3).applyMatrix4(matrix);
   const x=Math.floor(point.x/cell),z=Math.floor(point.z/cell);let floor=point.y;
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)floor=Math.min(floor,ground.get(key(x+dx,z+dz))??floor);
   const weight=MathUtils.smoothstep(point.y-floor,2,7);
   weights[i*2]=weight/Math.max(.001,Math.abs(scale.x));weights[i*2+1]=weight/Math.max(.001,Math.abs(scale.z));
  }
  primitive.setAttribute('_CANOPY_WIND',doc.createAccessor('Precomputed canopy breeze').setType('VEC2').setArray(weights).setBuffer(position.getBuffer()));
 }
}

for(const [name,source,target] of [
 ['landscape','nature-landscape-draco-v1.bin','nature-landscape-fast-v2.bin'],
 ['train','mumbai-ac-local-v1.bin','mumbai-ac-local-fast-v2.bin'],
]){
 const bytes=await readFile(new URL(`public/models/${source}`,root)),doc=await io.readBinary(bytes),before=count(doc);
 doc.getRoot().listExtensionsUsed().find(e=>e.extensionName==='KHR_draco_mesh_compression')?.dispose();
 if(name==='landscape'){
  await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.4,error:.001,lockBorder:false}));
  bakeWind(doc);
  const asset=doc.getRoot().getAsset();asset.extras={...asset.extras,modifications:`${asset.extras?.modifications||''} Runtime mesh simplified with 0.1% error bound; WebP textures; precomputed canopy wind weights.`};
 }
 await doc.transform(dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:82,effort:5}),prune(),draco({encodeSpeed:5,decodeSpeed:8,quantizePosition:16,quantizeTexcoord:14,quantizeGeneric:10}));
 const output=await io.writeBinary(doc);await writeFile(new URL(`public/models/${target}`,root),output);
 const hash=createHash('sha256').update(output).digest('hex').slice(0,12);
 report[name]={sourceBytes:bytes.length,bytes:output.length,sourceTriangles:before,triangles:count(doc),url:`/models/${target}?v=${hash}`};
 console.log(name,report[name]);
}
await writeFile(new URL('public/assets/landscape/performance.json',root),JSON.stringify(report,null,2)+'\n');
const landscapeAssets={...LANDSCAPE_ASSETS,model:report.landscape.url};
for(const [key,url] of Object.entries(landscapeAssets)){
 const content=await readFile(new URL('public'+url,root));
 landscapeAssets[key]=url.split('?')[0]+'?v='+createHash('sha256').update(content).digest('hex').slice(0,12);
}
await writeFile(new URL('lib/landscape-assets.js',root),`/** Content revisions invalidate previous model downloads. Rebuild with npm run assets:map. */\nexport const LANDSCAPE_ASSETS=${JSON.stringify(landscapeAssets)};\nexport const TRAIN_MODEL_URL=${JSON.stringify(report.train.url)};\n`);
