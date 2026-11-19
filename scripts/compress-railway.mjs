/** Encode the supplied scan without dropping triangles or re-encoding photographs.
 * Usage: node scripts/compress-railway.mjs /path/to/source.glb [output.bin]
 */
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRDracoMeshCompression} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const input=process.argv[2];
if(!input)throw new Error('Supply the original scan GLB as the first argument.');
const output=process.argv[3]||new URL('../public/models/nature-landscape-draco-v1.bin',import.meta.url);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder':await draco.createEncoderModule(),'draco3d.decoder':await draco.createDecoderModule()});
const doc=await io.read(input),photos=doc.getRoot().listTextures().map(t=>Buffer.from(t.getImage()));
const triangles=document=>document.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((n,p)=>n+p.getIndices().getCount()/3,0);
const count=triangles(doc);
doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({method:KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,encodeSpeed:0,decodeSpeed:5,quantizationBits:{POSITION:18,NORMAL:16,TEX_COORD:18,COLOR:16,GENERIC:18}});
await writeFile(output,await io.writeBinary(doc));
const decoded=await io.read(output);
if(triangles(decoded)!==count||!photos.every((p,i)=>p.equals(Buffer.from(decoded.getRoot().listTextures()[i].getImage()))))throw new Error('The exported scan changed its photographs or triangle count.');
const bytes=await readFile(output);await writeFile(String(output instanceof URL?output.pathname:output)+'.gz',gzipSync(bytes,{level:9}));
console.log(JSON.stringify({bytes:bytes.length,triangles:count,photographs:photos.length}));
