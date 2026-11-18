import * as T from './vendor/three.module.js';
/** Restore semantic materials: the source GLB exports unnamed materials. */
export function restoreMaterialRoles(root){const cache=new Map(),windows=new Set(),lamps=new Set();root.traverse(object=>{if(!object.isMesh)return;const role=object.name.replace(/_\d+$/,'');const assign=original=>{let variants=cache.get(original);if(!variants){variants=new Map();cache.set(original,variants);}if(variants.has(role))return variants.get(role);const m=original.clone();m.name='Venus '+role;variants.set(role,m);if(role==='glass')windows.add(m);if(role==='warm')lamps.add(m);return m;};object.material=Array.isArray(object.material)?object.material.map(assign):assign(object.material);});return {windows,lamps};}
export async function finishSurfaces(root,{loadTexture=url=>new T.TextureLoader().loadAsync(url)}={}){
 const roles=restoreMaterialRoles(root),loader=new T.TextureLoader(),base='../sai-world-dreams/assets/';
 const [stone,grass,wood]=await Promise.all([loadTexture(base+'stone-bump.jpg'),loadTexture(base+'grass.jpg'),loadTexture(base+'wood-deck.jpg')]);
 for(const texture of [stone,grass,wood]){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;}grass.colorSpace=wood.colorSpace=T.SRGBColorSpace;
 const seen=new Set();root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(seen.has(m))continue;seen.add(m);const role=m.name.replace('Venus ','');
  if(role==='ivory'){m.color.set(0xe6dfcf);m.roughness=.72;m.bumpMap=stone;m.bumpScale=.045;}
  if(role==='sand'){m.color.set(0x9e8d7d);m.roughness=.82;m.bumpMap=stone;m.bumpScale=.07;}
  if(role==='dark'){m.color.set(0x303c46);m.roughness=.46;m.metalness=.18;}
  if(role==='glass'){m.color.set(0x64879b);m.metalness=.62;m.roughness=.2;m.envMapIntensity=1.25;}
  if(role==='rail'){m.color.set(0xc0c6bd);m.metalness=.8;m.roughness=.32;}
  if(role==='lawn'){m.color.set(0x657c47);m.roughness=1;}
  if(role==='path'){m.color.set(0xb9b1a1);m.bumpMap=stone;m.bumpScale=.06;}
  if(role==='road'){m.color.set(0x353d3e);m.bumpMap=stone;m.bumpScale=.035;}
  if(role==='wood'){m.map=wood;m.roughness=.78;}
  m.onBeforeCompile=shader=>{
   shader.vertexShader='varying vec3 vVenusWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvVenusWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 vVenusWorld;\n'+shader.fragmentShader;
   if(role==='lawn'){shader.uniforms.venusGrass={value:grass};shader.fragmentShader='uniform sampler2D venusGrass;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(vec3(.78),texture2D(venusGrass,vVenusWorld.xz*.11).rgb*1.35,.72);');}
   if(['ivory','sand','path','road'].includes(role))shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat grain=fract(sin(dot(floor(vVenusWorld*42.),vec3(12.9898,78.233,39.425)))*43758.5453);diffuseColor.rgb*=mix(.93,1.04,grain);');
   if(role==='glass')shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    float level=floor((vVenusWorld.y-6.8)/3.05);vec2 room=floor(vVenusWorld.xz/2.4);float occupancy=fract(sin(dot(room,vec2(127.1,311.7))+level*73.17)*43758.5453);totalEmissiveRadiance*=mix(.015,.65+occupancy*.5,step(.39,occupancy));`);
  };m.customProgramCacheKey=()=> 'venus-surface-v3-'+role;m.needsUpdate=true;
 }});
 return {...roles,dispose(){seen.forEach(m=>m.dispose());[stone,grass,wood].forEach(t=>t.dispose());}};
}
