import * as T from 'three';

/** Fit every model corner without exposing orbit, pan or wheel controls. */
export function fitLockedMap(camera,bounds,{padding=1.12,direction=new T.Vector3(12,140,128)}={}){
  if(bounds.isEmpty())throw new Error('Cannot frame an empty landscape.');
  const target=bounds.getCenter(new T.Vector3()),view=direction.clone().normalize();
  const right=new T.Vector3().crossVectors(camera.up,view).normalize(),up=new T.Vector3().crossVectors(view,right);
  const tanY=Math.tan(T.MathUtils.degToRad(camera.fov)/2),tanX=tanY*camera.aspect;
  let distance=0;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const offset=new T.Vector3(x,y,z).sub(target);
    distance=Math.max(distance,offset.dot(view)+padding*Math.max(Math.abs(offset.dot(right))/tanX,Math.abs(offset.dot(up))/tanY));
  }
  const diagonal=bounds.getSize(new T.Vector3()).length();
  camera.position.copy(target).addScaledVector(view,distance);camera.lookAt(target);
  camera.near=.2;camera.far=Math.max(650,distance+diagonal*3);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  return {target,distance,diagonal};
}
