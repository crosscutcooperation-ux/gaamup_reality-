/** Preserve all geometry and creator metadata, reducing embedded scan photos only. */
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const input=await readFile(new URL('../public/models/nature-landscape.glb',import.meta.url));
const jsonSize=input.readUInt32LE(12),document=JSON.parse(input.subarray(20,20+jsonSize));
const binary=input.subarray(28+jsonSize),parts=[];
let offset=0;
const images=new Map((document.images||[]).map(image=>[image.bufferView,image]));
for(const [index,view] of document.bufferViews.entries()){
  let bytes=binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
  if(images.has(index)){
    bytes=await sharp(bytes).resize({width:1536,height:1536,fit:'inside',withoutEnlargement:true}).jpeg({quality:88,chromaSubsampling:'4:4:4'}).toBuffer();
    images.get(index).mimeType='image/jpeg';
  }
  view.byteOffset=offset;view.byteLength=bytes.length;parts.push(bytes);offset+=bytes.length;
  const padding=(4-offset%4)%4;if(padding){parts.push(Buffer.alloc(padding));offset+=padding;}
}
document.buffers[0].byteLength=offset;
let json=Buffer.from(JSON.stringify(document));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const header=Buffer.alloc(20),chunk=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+offset,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);chunk.writeUInt32LE(offset);chunk.writeUInt32LE(0x004e4942,4);
await writeFile(new URL('../public/models/nature-landscape-fast.glb',import.meta.url),Buffer.concat([header,json,chunk,...parts]));
console.log(`Browser scan: ${(offset/1048576).toFixed(1)} MB, geometry and provenance retained.`);
