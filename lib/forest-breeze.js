import * as T from 'three';

/** Bend green canopy vertices above their local ground; never rewrite the scan. */
export function createForestBreeze(root){
 root.updateMatrixWorld(true);
 const meshes=[],ground=new Map(),point=new T.Vector3(),cell=5;
 const key=(x,z)=>`${x},${z}`;
 root.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
  meshes.push(mesh);const positions=mesh.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
   const k=key(Math.floor(point.x/cell),Math.floor(point.z/cell));ground.set(k,Math.min(ground.get(k)??Infinity,point.y));
  }
 });
 const time={value:0},strength={value:1},prepared=new Set();
 for(const mesh of meshes){
  const positions=mesh.geometry.attributes.position,weights=new Float32Array(positions.count*2),scale=mesh.getWorldScale(new T.Vector3());
  for(let i=0;i<positions.count;i++){
   point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
   const x=Math.floor(point.x/cell),z=Math.floor(point.z/cell);let floor=point.y;
   for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)floor=Math.min(floor,ground.get(key(x+dx,z+dz))??floor);
   const weight=T.MathUtils.smoothstep(point.y-floor,2,7);
   weights[i*2]=weight/Math.max(.001,Math.abs(scale.x));weights[i*2+1]=weight/Math.max(.001,Math.abs(scale.z));
  }
  mesh.geometry.setAttribute('canopyWind',new T.BufferAttribute(weights,2));
  for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
   if(!material.map||prepared.has(material))continue;prepared.add(material);
   const compile=material.onBeforeCompile,cache=material.customProgramCacheKey.bind(material);
   material.onBeforeCompile=function(shader,...args){
    compile.call(this,shader,...args);
    Object.assign(shader.uniforms,{forestTime:time,forestStrength:strength,forestCanopyMap:{value:material.map}});
    shader.vertexShader='uniform float forestTime;\nuniform float forestStrength;\nuniform sampler2D forestCanopyMap;\nattribute vec2 canopyWind;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
     vec3 canopyColor=texture2D(forestCanopyMap,uv).rgb;
     float canopyGreen=smoothstep(.015,.09,canopyColor.g-max(canopyColor.r,canopyColor.b));
     vec3 forestWorld=(modelMatrix*vec4(position,1.)).xyz;
     float forestPhase=forestWorld.x*.31+forestWorld.z*.23;
     transformed.x+=sin(forestTime*.8+forestPhase)*canopyWind.x*.16*canopyGreen*forestStrength;
     transformed.z+=cos(forestTime*.65+forestPhase)*canopyWind.y*.08*canopyGreen*forestStrength;`);
   };
   material.customProgramCacheKey=()=>cache()+'-forest-breeze-1';material.needsUpdate=true;
  }
 }
 return {update(seconds,{reduced=false}={}){time.value=seconds;strength.value=reduced?0:1;}};
}
