import * as T from './vendor/three.module.js?v=shared-runtime-12';

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
