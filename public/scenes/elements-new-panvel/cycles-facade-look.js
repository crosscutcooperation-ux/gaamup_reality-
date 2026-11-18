import * as T from './vendor/three.module.js?v=shared-runtime-12';
// Surface lighting is baked by Cycles onto the actual facade vertices. The
// glass stays physically shaded and the night/evening materials remain live.
export function installCyclesFacadeLook(towers,canvas,invalidate){
 const entries=[];
 for(const tower of towers)tower.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.userData.cyclesDiffuseBaked||!mesh.geometry.getAttribute('color'))return;
  const physical=mesh.material;physical.vertexColors=false;physical.needsUpdate=true;
  const scale=mesh.userData.cyclesDiffuseScale||4;
  const baked=new T.MeshBasicMaterial({name:physical.name+' · Cycles lighting',color:new T.Color(scale,scale,scale),vertexColors:true,side:physical.side,fog:false});
  entries.push({mesh,physical,baked});
 });
 const apply=mode=>{for(const e of entries)e.mesh.material=mode==='day'?e.baked:e.physical;canvas.dataset.facadeLighting=mode==='day'?'Cycles diffuse surface bake':'Live physical lighting';invalidate();};
 document.addEventListener('architectural-lighting-change',e=>apply(e.detail.name));
 canvas.dataset.cyclesBakedMeshes=String(entries.length);
 return {apply};
}
