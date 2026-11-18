import * as T from './vendor/three.module.js';
export const VIEWS={
 courtyard:{pos:[-187.27,60.21,-28.55],target:[4,55,-28],fov:55,title:'The residential courtyard'},
 aerial:{pos:[-255,215,295],target:[0,30,-25],fov:39,title:'Aerial perspective'},
 street:{pos:[-153,20,138],target:[-35,35,-28],fov:55,title:'The boulevard entrance'},
 plan:{pos:[0,530,-24],target:[0,0,-25],fov:39,title:'Site plan'},
 poolOverview:{pos:[-65,38,8],target:[-18,7,-29],fov:48,title:'Private beach & swimming pool'},
 clubhouse:{pos:[-49,34,29],target:[-3,13,-13],fov:48,title:'Vivanta Clubhouse'},
 court:{pos:[137,35,88],target:[91,1,46],fov:48,title:'Multipurpose court'},
 gardens:{pos:[-49,42,68],target:[3,7,23],fov:50,title:'The landscaped gardens'},
 play:{pos:[67,34,-18],target:[28,7,-51],fov:48,title:'The play garden'},
 rooftop:{pos:[-89,143,-82],target:[-49,112,-71],fov:52,title:'Rooftop amenity perspective'},
 parking:{pos:[-169,28,114],target:[-103,4,42],fov:54,title:'Parking & arrival'},
 school:{pos:[-211,25,112],target:[-145,7,76],fov:50,title:'Eva World School'},
 temple:{pos:[-92,21,154],target:[-46,6,105],fov:48,title:'Vasantdeep Vatika Jain Temple'},
};
export function prepareTownship(root){
 root.updateMatrixWorld(true);const towers=[],point=new T.Vector3();let removed=0;
 root.traverse(object=>{
  if(object.userData.kind==='tower'){object.userData.towerId=object.userData.id;towers.push(object);}
  if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
  // The imported lawn batch includes a 330 × 390 m box beneath the entire site.
  // Remove only that below-grade box, retaining raised gardens and the podium.
  if(object.name==='lawn'&&object.parent.name.startsWith('Landscape')){
   const g=object.geometry,p=g.attributes.position,index=g.index,kept=[];
   const count=index?index.count:p.count;
   for(let i=0;i<count;i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
    if(ids.every(id=>point.fromBufferAttribute(p,id).applyMatrix4(object.matrixWorld).y<-.1)){removed++;continue;}
    kept.push(...ids);
   }
   const geometry=g.clone();geometry.setIndex(kept);geometry.computeBoundingBox();geometry.computeBoundingSphere();object.geometry=geometry;g.dispose();
  }
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(material.transparent){material.depthWrite=false;}
  }
 });return {towers,removedGroundTriangles:removed};
}
export function frameView(preset,aspect){
 const position=new T.Vector3(...preset.pos),target=new T.Vector3(...preset.target);
 // Same mobile framing rule as Sai; the target stays fixed while orbiting.
 const scale=Math.max(1,Math.min(1.7,1.2/aspect));
 return {position:position.sub(target).multiplyScalar(scale).add(target),target,fov:preset.fov};
}
