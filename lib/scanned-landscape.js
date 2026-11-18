import * as T from 'three';
import profile from './scan-route-data.json' with {type:'json'};

export const SCAN_MODEL_URL='/models/nature-landscape-fast.glb';
export const SCAN_STATIONS=profile.stations;
export function makeScanRoute(){
  const route=new T.CatmullRomCurve3(profile.points.map(p=>new T.Vector3(...p)),false,'centripetal');
  route.arcLengthDivisions=3200;return route;
}
export function prepareScannedLandscape(model,{edgeMask}={}){
  model.name='Laslo.S — locally loaded nature landscape';
  model.traverse(object=>{
    if(!object.isMesh)return;
    object.receiveShadow=true;object.castShadow=false;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      // The scan retains its photographed detail and baked ambient occlusion.
      material.metalness=0;material.envMapIntensity=.35;
      if(edgeMask){
        material.transparent=true;material.alphaTest=.01;
        material.onBeforeCompile=shader=>{
          shader.uniforms.scanEdgeMask={value:edgeMask};
          shader.vertexShader='varying vec2 vScanEdgeUv;\n'+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvScanEdgeUv=((modelMatrix*vec4(transformed,1.0)).xz+vec2(132.0,110.0))/vec2(264.0,220.0);');
          shader.fragmentShader='uniform sampler2D scanEdgeMask;\nvarying vec2 vScanEdgeUv;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=texture2D(scanEdgeMask,vScanEdgeUv).g;');
        };
        material.customProgramCacheKey=()=> 'scan-silhouette-feather-v1';
        // onBeforeCompile uniforms are not discoverable in the usual map list.
        material.userData.edgeMask=edgeMask;
      }
    }
  });
  model.updateMatrixWorld(true);
  return {group:model,bounds:new T.Box3().setFromObject(model)};
}
