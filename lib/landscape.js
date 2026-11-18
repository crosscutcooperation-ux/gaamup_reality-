import * as THREE from 'three';

/** Relief and roof volumes use the existing map's colors; the rail corridor stays flat. */
export function createLandscape(texture,route){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=170;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  context.drawImage(texture.image,0,0,canvas.width,canvas.height);
  const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
  const corridor=[];
  for(let i=0;i<=180;i++){const p=route.getPointAt(i/180);corridor.push([p.x,p.z]);}
  for(const end of [0,1]){const point=route.getPointAt(end),direction=route.getTangentAt(end);for(let d=1;d<=42;d+=2){const p=point.clone().addScaledVector(direction,(end===0?-1:1)*d);corridor.push([p.x,p.z]);}}
  function distance(x,z){let nearest=Infinity;for(const [cx,cz]of corridor){const dx=x-cx,dz=z-cz;nearest=Math.min(nearest,dx*dx+dz*dz);}return Math.sqrt(nearest);}
  function color(x,z){const u=THREE.MathUtils.clamp(Math.floor((x/280+.5)*canvas.width),0,canvas.width-1),v=THREE.MathUtils.clamp(Math.floor((z/220+.5)*canvas.height),0,canvas.height-1),offset=(v*canvas.width+u)*4;return [pixels[offset],pixels[offset+1],pixels[offset+2]];}
  function height(x,z){
    // Blend a broad forest mask instead of turning individual map pixels into spikes.
    let forest=0;for(const dx of [-4,0,4])for(const dz of [-4,0,4]){const [r,g,b]=color(x+dx,z+dz);forest+=THREE.MathUtils.smoothstep(g-Math.max(r,b),3,25)/9;}
    const western=THREE.MathUtils.smoothstep(-x,10,55),clearing=THREE.MathUtils.smoothstep(distance(x,z),8,15);
    const boundary=1-THREE.MathUtils.smoothstep(Math.max(Math.abs(x)/140,Math.abs(z)/110),.76,1);
    const ridges=9+4*Math.sin(x*.12+z*.06)+3*Math.cos(z*.15-x*.04);
    return forest*western*clearing*boundary*ridges;
  }
  // One continuous ground surface, including the horizon. There is no second
  // nearly coplanar plane underneath the map to produce depth-buffer stripes.
  const geometry=new THREE.PlaneGeometry(280,220,224,196),vertices=geometry.attributes.position,uv=geometry.attributes.uv;
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),z=-vertices.getY(i);vertices.setZ(i,height(x,z));uv.setXY(i,x/280+.5,.5-z/220);
  }
  geometry.computeVertexNormals();
  return {geometry};
}
