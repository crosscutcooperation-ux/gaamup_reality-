import * as THREE from 'three';
const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*t*(t*(t*6-15)+10);};
export const JOURNEY_DURATION=3600;

/** Descend to a broadside close-up of the fourth branded carriage, including roof and wheels. */
export function createCameraFlight({start,startTarget,station,aspect=16/9}){
  const focus=station.point.clone().addScaledVector(station.tangent,-.35);focus.y=station.point.y+1.1;
  const relative=start.clone().sub(focus);
  const side=relative.dot(station.normal)>=0?-1:1;
  const along=relative.dot(station.tangent)>=0?1:-1;
  const end=focus.clone().addScaledVector(station.normal,side*Math.max(4.9,9.5/Math.max(.4,aspect)));
  end.y+=.5;
  const high=start.clone().lerp(focus,.36);high.y=Math.max(focus.y+72,start.y*.86);
  const cross=focus.clone().addScaledVector(station.normal,side*Math.max(9,18/Math.max(.4,aspect))).addScaledVector(station.tangent,along*10);cross.y=Math.max(end.y+8,focus.y+24);
  const path=new THREE.CubicBezierCurve3(start.clone(),high,cross,end);
  const up=new THREE.Vector3(0,1,0);
  return {
    side,
    sample(progress){
      const elapsed=clamp(progress)*JOURNEY_DURATION;
      const position=path.getPoint(ease(elapsed/3588));
      const target=startTarget.clone().lerp(focus,ease(elapsed/3082));
      const quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(position,target,up));
      return {position,target,quaternion};
    },
  };
}
