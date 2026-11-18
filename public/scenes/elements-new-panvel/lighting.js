import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {materials} from './model.js?v=daylight-1';
import {RGBELoader} from './shared/vendor/addons/loaders/RGBELoader.js';
import {Sky} from './shared/vendor/addons/objects/Sky.js';

import {LIGHTING_PRESETS,createArchitecturalLighting} from './shared/architectural-lighting.js?v=elements-light-21';
export const LIGHTING = {
  ...LIGHTING_PRESETS,
  day: {
    ...LIGHTING_PRESETS.day,
    sun: [-150, 115, 120], color: 0xfff5e5, sunPower: 2.65,
    ambient: .39, fill: .20, exposure: 1.02,
    fog: 0xc5d6dc, density: .00112,
  },
};

export async function prepareMaterials(renderer,invalidate){
  const loader=new T.TextureLoader();
  async function load(name,color=true,repeat=[1,1]){const t=await loader.loadAsync('./shared/assets/'+name);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
  const [grass,asphalt,stone,bump,water,wood,canopy,terrainMap]=await Promise.all([load('grass.jpg',true,[25,25]),load('asphalt.jpg',true,[12,2]),load('stone.jpg',true,[3,3]),load('stone-bump.jpg',false,[3,3]),load('water-bump.jpg',false,[4,4]),load('wood-deck.jpg',true,[4,2]),load('canopy-spray.webp'),loader.loadAsync('assets/illustrative-panvel-ground.png')]);
  materials.lawn.map=grass;materials.lawn.color.set(0xa3b18a);materials.road.map=asphalt;materials.road.color.set(0x8b8d8e);
  terrainMap.colorSpace=T.SRGBColorSpace;terrainMap.wrapS=terrainMap.wrapT=T.MirroredRepeatWrapping;terrainMap.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const [pavers, paverNormal] = await Promise.all([
    loader.loadAsync('assets/elements-podium-pavers.png'),
    loader.loadAsync('assets/elements-podium-normal.png'),
  ]);
  pavers.colorSpace = T.SRGBColorSpace;
  for (const texture of [pavers, paverNormal]) {
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.setScalar(.48);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  materials.paving = new T.MeshStandardMaterial({
    name: 'Textured podium pavers', map: pavers, normalMap: paverNormal,
    normalScale: new T.Vector2(.65, .65), roughness: .86,
  });
  materials.terrain=new T.MeshStandardMaterial({name:'Illustrative New Panvel landscape',map:terrainMap,color:0xffffff,roughness:1});
  materials.terrain.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      float groundLuma = dot(diffuseColor.rgb, vec3(.2126, .7152, .0722));
      vec3 subdued = mix(vec3(groundLuma), diffuseColor.rgb, .47);
      vec3 olive = vec3(.134, .157, .105);
      float distanceBlend = smoothstep(130., 750., length(vViewPosition));
      diffuseColor.rgb = mix(subdued, olive, mix(.26, .61, distanceBlend));
    `);
  };
  materials.path.map=stone;materials.path.bumpMap=bump;materials.path.bumpScale=.06;materials.wood.map=wood;
  materials.ivory.bumpMap=bump;materials.ivory.bumpScale=.015;materials.sand.bumpMap=bump;materials.sand.bumpScale=.025;
  materials.ivory.color.set(0xd8cfbf);materials.sand.color.set(0xc8b7a1);materials.glass.color.set(0x4b809f);materials.glass.metalness=.35;materials.glass.roughness=.16;
  materials.water.normalMap=water;materials.water.normalScale=new T.Vector2(.15,.15);materials.water.roughness=.14;
  materials.canopy=new T.MeshStandardMaterial({map:canopy,alphaTest:.4,side:T.DoubleSide,roughness:1,color:0x8d9c73});invalidate();
  for(const name of ['front','wing','front26','wing26','aristo']){
    materials['facade-'+name]=new T.MeshStandardMaterial({name:'Masonry '+name,color:0xe4ded3,roughness:.76});
    materials['window-'+name]=new T.MeshPhysicalMaterial({name:'Glazing '+name,color:0x3f7fae,metalness:.35,roughness:.14,clearcoat:1,clearcoatRoughness:.08});
  }
  materials.retail=null;
  materials.dark.color.set(0x424c60);materials.court.color.set(0x4f766d);materials.water.color.set(0x327d8e);
  const hdr=await new RGBELoader().loadAsync('./shared/assets/environment.hdr');
  hdr.mapping=T.EquirectangularReflectionMapping;
  const generator=new T.PMREMGenerator(renderer),environment=generator.fromEquirectangular(hdr);hdr.dispose();generator.dispose();return environment;
}

export function createLighting({scene,renderer,sun,hemi,fill,site,towers,invalidate,announce,dayEnvironment}){
  document.addEventListener('architectural-lighting-change',e=>{if(materials.shopGlow)materials.shopGlow.emissiveIntensity=e.detail.name==='night'?.85:e.detail.name==='evening'?.25:0;materials.terrain.color.set(e.detail.name==='night'?0x657378:e.detail.name==='evening'?0xe7d8c9:0xffffff);});
  const sky=new Sky();sky.scale.setScalar(1300);const u=sky.material.uniforms;u.turbidity.value=4;u.rayleigh.value=1.4;u.mieCoefficient.value=.004;u.mieDirectionalG.value=.78;u.sunPosition.value.set(-.5,.8,.6).normalize();scene.add(sky);
  const nightSky=new T.Mesh(new T.SphereGeometry(1050,48,24),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,toneMapped:false,
    uniforms:{horizon:{value:new T.Color(0xd7ecf1)},skyBlue:{value:new T.Color(0x369bef)}},
    vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec3 direction;uniform vec3 horizon;uniform vec3 skyBlue;void main(){float t=1.-exp(-5.5*max(normalize(direction).y+.018,0.));gl_FragColor=vec4(mix(horizon,skyBlue,t),1.);\n#include <colorspace_fragment>\n}'
  }));scene.add(nightSky);scene.environment=dayEnvironment.texture;scene.environmentIntensity=.38;
  const facadeSurfaces=[],glazingSurfaces=[];
  site.traverse(o=>{if(!o.isMesh)return;if(o.name.startsWith('facade-'))facadeSurfaces.push(o);else if((o.name==='glass'||o.name.startsWith('native-glass-')||o.material?.name?.startsWith('stone-glass'))&&o.parent.name!=='car')glazingSurfaces.push(o);});
  return createArchitecturalLighting({scene,renderer,sun,ambient:hemi,fill,sky,nightSky,model:{towers},facadeSurfaces,glazingSurfaces,invalidate,announce,presets:LIGHTING,
    fixtureLayout:{points:[[28,8,-46],[28,8,-20],[28,8,12],[28,8,40],[-24,8,28]],lights:[[17,11,-36,1000,25],[-15,10,28,900,22],[30,10,10,700,25],[0,4,-49,650,30]]}
  });
}
