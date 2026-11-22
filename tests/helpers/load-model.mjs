import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {TRAIN_MODEL_URL} from '../../lib/landscape-assets.js';
// Geometry QA runs in Node. Keep the embedded image bytes intact, but skip GPU
// image decoding; Blender renders verify the textured model separately.
export async function loadTrainGeometry(url=new URL('../../public'+TRAIN_MODEL_URL,import.meta.url)){
  let bytes=await readFile(url);
  const sourceJSON=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
  if(sourceJSON.extensionsRequired?.includes('KHR_draco_mesh_compression')){
    const [{NodeIO},{ALL_EXTENSIONS},draco]=await Promise.all([import('@gltf-transform/core'),import('@gltf-transform/extensions'),import('draco3dgltf')]);
    const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.default.createDecoderModule()});
    const doc=await io.readBinary(bytes);
    doc.getRoot().listExtensionsUsed().find(e=>e.extensionName==='KHR_draco_mesh_compression')?.dispose();
    bytes=Buffer.from(await io.writeBinary(doc));
  }
  const length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length).toString());
  function strip(value){if(!value||typeof value!=='object')return;for(const key of Object.keys(value)){if(key.endsWith('Texture'))delete value[key];else strip(value[key]);}}
  for(const material of json.materials||[])strip(material);
  const imageCount=json.images?.length||0;delete json.images;delete json.textures;delete json.samplers;
  const source=Buffer.from(JSON.stringify(json)),padded=Buffer.alloc(Math.ceil(source.length/4)*4,32);source.copy(padded);
  const binary=bytes.subarray(20+length),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+padded.length+binary.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);
  const file=Buffer.concat([header,padded,binary]);
  const gltf=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
  return {scene:gltf.scene,imageCount};
}
