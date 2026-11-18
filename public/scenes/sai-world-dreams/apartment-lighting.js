/** Interior lighting stays independent of the imported material colours. */
export const APARTMENT_LIGHTING=Object.freeze({exposure:.92,environment:.28,hemisphere:.32,key:2.1,fill:.35,rim:.55,aoRadius:.45});
export function frameApartmentLights({key,fill,rim,span,center}){
  key.position.copy(center).addScaledVector({x:-.7,y:1.25,z:.65},span);
  fill.position.copy(center).addScaledVector({x:1,y:.6,z:.2},span);
  rim.position.copy(center).addScaledVector({x:.1,y:.8,z:-1},span);
  for(const light of [key,fill,rim]){light.target.position.copy(center);light.target.updateMatrixWorld();}
  const extent=span*.72;
  Object.assign(key.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:.1,far:span*4});
  key.shadow.camera.updateProjectionMatrix();key.shadow.normalBias=.012;key.shadow.bias=-.00008;key.shadow.radius=2;
}
