import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {footprintRectangles} from './facade-shell.js?v=elements-22';

// Picking needs the building footprint, not every frame, mullion and bevel.
export function createTowerPicker(towers){
  const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial(),proxies=[];
  for(const tower of towers){
    const spec=tower.userData,group=new T.Group();group.userData.id=spec.id;
    group.position.copy(tower.position);group.quaternion.copy(tower.quaternion);
    const height=6.8+spec.floors*3.05;
    for(const r of footprintRectangles(spec)){
      const box=new T.Mesh(geometry,material);box.position.set((r.x0+r.x1)/2,height/2,(r.z0+r.z1)/2);
      box.scale.set(r.x1-r.x0,height,r.z1-r.z0);group.add(box);
    }
    group.updateMatrixWorld(true);proxies.push(group);
  }
  return ray=>{const hit=ray.intersectObjects(proxies,true)[0];return hit?.object.parent.userData.id??null;};
}

export function createMotionResolution(renderer,canvas,invalidate){
  const native=Math.min(devicePixelRatio,1.5);
  let active=false,timer=0,last=0,intervals=[],ceiling=native,fastFrames=0;
  function apply(ratio){if(renderer.getPixelRatio()===ratio)return;renderer.setPixelRatio(ratio);canvas.dataset.renderScale=String(ratio);invalidate();}
  canvas.dataset.renderScale=String(native);
  return {
    start(){clearTimeout(timer);if(active)return;active=true;last=0;intervals=[];fastFrames=0;ceiling=Math.min(native,1.15,Math.sqrt(650000/Math.max(1,(canvas.clientWidth||1)*(canvas.clientHeight||1))));apply(Math.max(.55,ceiling));},
    sample(now){
      if(!active)return;
      if(last&&now-last<200)intervals.push(now-last);last=now;
      if(intervals.length<12)return;
      const median=[...intervals].sort((a,b)=>a-b)[6];intervals=[];
      if(median>19.5){fastFrames=0;apply(Math.max(.55,renderer.getPixelRatio()*.85));}
      else if(median<15.5&&++fastFrames>=3){fastFrames=0;apply(Math.min(ceiling,renderer.getPixelRatio()*1.08));}
      else if(median>=15.5)fastFrames=0;
    },
    stop(){active=false;last=0;intervals=[];clearTimeout(timer);timer=setTimeout(()=>{if(!active)apply(native);},180);},
    get active(){return active;}
  };
}

// The detail camera is front-on and orthographic. Intersect its elevation plane
// and footprint spans instead of raycasting hundreds of thousands of triangles.
export function elevationFloorAt(ray,spec){
  const point=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,0,1),0),new T.Vector3());
  if(!point||point.y<0||point.y>6.8+spec.floors*3.05)return null;
  if(!footprintRectangles(spec).some(r=>point.x>=r.x0&&point.x<=r.x1))return null;
  return Math.max(0,Math.min(spec.floors,Math.floor((point.y-6.8)/3.05)+1));
}
