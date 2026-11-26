import * as T from './vendor/three.module.js?v=shared-runtime-12';

// Physical transmission otherwise renders the whole opaque colony twice, even
// for a small pool hidden behind a tower. Retain it at rest; use reflective
// glass while moving, preserving geometry and night emission.
export function createSceneMaterialLOD(site){
  const pairs=[],cache=new Map();
  site.traverse(mesh=>{
    if(!mesh.isMesh||Array.isArray(mesh.material))return;
    const source=mesh.material;if(!(source.transmission>0||source.clearcoat>0||source.normalMap))return;
    let fast=cache.get(source);
    if(!fast){
      fast=source.clone();fast.transmission=0;fast.clearcoat=0;fast.normalMap=null;
      fast.onBeforeCompile=source.onBeforeCompile;fast.customProgramCacheKey=()=>source.customProgramCacheKey()+'|motion-reflection';
      if(source.transmission>0&&/glass|glazing/i.test(source.name)){fast.transparent=true;fast.opacity=.72;fast.depthWrite=false;}
      cache.set(source,fast);
    }
    pairs.push({mesh,source,fast});
  });
  return moving=>{for(const {mesh,source,fast} of pairs){fast.emissive?.copy(source.emissive);fast.emissiveIntensity=source.emissiveIntensity;mesh.material=moving?fast:source;}};
}

export function createModelLOD(towers,canvas){
  const entries=towers.map(tower=>({
    detail:tower.children.find(c=>c.userData.renderTier==='detail'),
    motion:tower.children.find(c=>c.userData.renderTier==='motion'),
    bounds:new T.Box3().setFromObject(tower)
  })),nearest=new T.Vector3();
  return (camera,moving,shadowsPending=false)=>{
    let light=0;
    for(const entry of entries){const {detail,motion,bounds}=entry;if(!detail||!motion)continue;
      const distant=bounds.clampPoint(camera.position,nearest).distanceTo(camera.position)>100;
      const useMotion=moving&&distant&&!shadowsPending;
      detail.visible=!useMotion;motion.visible=useMotion;if(useMotion)light++;
    }
    canvas.dataset.motionBlocks=String(light);
  };
}
