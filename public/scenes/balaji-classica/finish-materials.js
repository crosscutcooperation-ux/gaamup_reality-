// These GLBs are exported together from the same Blender material library.
// Share equivalent finish maps across detail, motion and site models, retaining
// each texture's UV transform, colour space and sampling settings.
export function shareFinishTextures(roots){
 const maps=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','clearcoatMap','clearcoatRoughnessMap'];
 const cache=new Map(),replaced=new Set(),used=new Set();let references=0;
 for(const root of roots)root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
   for(const slot of maps){
    const texture=material[slot];if(!texture)continue;
    const image=texture.image,key=JSON.stringify([material.name,slot,texture.name,image?.width,image?.height,
     texture.channel,texture.colorSpace,texture.flipY,texture.wrapS,texture.wrapT,texture.minFilter,texture.magFilter,
     texture.repeat.toArray(),texture.offset.toArray(),texture.center.toArray(),texture.rotation]);
    if(cache.has(key)&&cache.get(key)!==texture){material[slot]=cache.get(key);replaced.add(texture);references++;}
    else cache.set(key,texture);
    used.add(material[slot]);
   }
  }
 });
 for(const texture of replaced)if(!used.has(texture))texture.dispose();
 return {sharedReferences:references,uniqueTextures:used.size};
}
