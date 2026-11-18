import * as T from './vendor/three.module.js?v=shared-runtime-12';

// Keep all vertex/normal/UV buffers intact. Only the active triangle index range
// changes: one draw per material, without submitting entirely back-facing faces.
const batches=new WeakMap();
export function partitionFacadeFaces(root){
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material)||mesh.material.side!==T.FrontSide)return;
    const geometry=mesh.geometry,position=geometry.attributes.position,index=geometry.index;
    if(!index||index.count<600||batches.has(geometry))return;
    const buckets=Array.from({length:7},()=>[]),planes=Array(6).fill(Infinity);
    const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3();
    for(let i=0;i<index.count;i+=3){
      const ia=index.getX(i),ib=index.getX(i+1),ic=index.getX(i+2);
      a.fromBufferAttribute(position,ia);b.fromBufferAttribute(position,ib).sub(a);c.fromBufferAttribute(position,ic).sub(a);normal.crossVectors(b,c).normalize();
      let group=6;
      for(let axis=0;axis<3;axis++)if(Math.abs(normal.getComponent(axis))>1-1e-10){group=axis*2+(normal.getComponent(axis)>0?0:1);planes[group]=Math.min(planes[group],a.getComponent(axis)*(group%2?-1:1));break;}
      buckets[group].push(ia,ib,ic);
    }
    batches.set(geometry,{full:index,buckets:buckets.map(v=>new index.array.constructor(v)),planes,active:new T.BufferAttribute(new index.array.constructor(index.count),1).setUsage(T.DynamicDrawUsage),mask:-1,count:0});
  });
}

export function createFacadeCuller(root){
  root.updateMatrixWorld(true);
  const entries=[];root.traverse(mesh=>{const batch=mesh.isMesh&&batches.get(mesh.geometry);if(batch){let tier=mesh;while(tier&&!tier.userData.renderTier)tier=tier.parent;entries.push({mesh,batch,tier,inverse:new T.Matrix4().copy(mesh.matrixWorld).invert()});}});
  const local=new T.Vector3(),direction=new T.Vector3();
  return (camera,shadowsPending=false)=>{
    camera.updateMatrixWorld();camera.getWorldDirection(direction);
    for(const {mesh,batch,tier,inverse} of entries){
      if(tier&&!tier.visible)continue;
      const geometry=mesh.geometry;
      if(shadowsPending){mesh.visible=true;geometry.setIndex(batch.full);geometry.setDrawRange(0,batch.full.count);continue;}
      if(camera.isOrthographicCamera)local.copy(direction).transformDirection(inverse);
      else local.copy(camera.position).applyMatrix4(inverse);
      let mask=64;
      for(let group=0;group<6;group++){
        const axis=Math.floor(group/2),sign=group%2?-1:1;
        const visible=camera.isOrthographicCamera?local.getComponent(axis)*sign<1e-7:local.getComponent(axis)*sign>=batch.planes[group]-.001;
        if(visible)mask|=1<<group;
      }
      if(mask!==batch.mask){
        let count=0;for(let group=0;group<7;group++)if(mask&(1<<group)){batch.active.array.set(batch.buckets[group],count);count+=batch.buckets[group].length;}
        batch.count=count;batch.mask=mask;batch.active.clearUpdateRanges();if(count)batch.active.addUpdateRange(0,count);batch.active.needsUpdate=true;
      }
      geometry.setIndex(batch.active);geometry.setDrawRange(0,batch.count);mesh.visible=batch.count>0;
    }
  };
}
