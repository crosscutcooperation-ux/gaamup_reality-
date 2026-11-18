import * as T from './vendor/three.module.js';
export const SITE_SURROUNDINGS={center:[73.0909,19.1859],bounds:[73.0699,19.1659,73.1119,19.2059],imageryYear:2016,texture:'assets/dombivli-satellite-2016.jpg',extent:4400};
/** Real regional imagery, with an illustrative site alignment and animated atmospheric layers. */
export async function createSiteEnvironment({scene,renderer,model,invalidate}){
  const group=new T.Group();group.name='Dombivli satellite surroundings and atmosphere';scene.add(group);
  const texture=await new T.TextureLoader().loadAsync(SITE_SURROUNDINGS.texture);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const terrain=new T.Mesh(new T.PlaneGeometry(SITE_SURROUNDINGS.extent,SITE_SURROUNDINGS.extent),new T.MeshStandardMaterial({map:texture,roughness:1,color:0xdfe6d7,metalness:0}));terrain.name='EOX Sentinel-2 Dombivli 2016 satellite ground';terrain.rotation.x=-Math.PI/2;terrain.position.y=.545;terrain.receiveShadow=true;group.add(terrain);
  const oldGround=model.context.getObjectByName('Context ground');if(oldGround)oldGround.visible=false;
  // Retain the modeled foreground access streets; satellite neighborhoods continue beyond them.
  const uniforms={time:{value:0},night:{value:0},tint:{value:new T.Color(0xf3f6f6)}};
  const cloudMaterial=new T.ShaderMaterial({transparent:true,side:T.BackSide,depthWrite:false,uniforms,
    vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 direction;uniform float time;uniform float night;uniform vec3 tint;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=a*noise(p);p=mat2(1.6,-1.2,1.2,1.6)*p;a*=.5;}return n;}
      void main(){vec3 d=normalize(direction);vec2 p=d.xz/max(.12,d.y)*2.7+vec2(time*.003,time*.001);float field=fbm(p);float cloud=smoothstep(.43,.69,field)*smoothstep(.045,.24,d.y);float depth=fbm(p+vec2(.12));vec3 shade=mix(tint*.72,tint,smoothstep(.42,.7,depth));shade=mix(shade,vec3(.12,.16,.23),night);gl_FragColor=vec4(shade,cloud*mix(.82,.25,night));
      #include <colorspace_fragment>
      }`});
  const clouds=new T.Mesh(new T.SphereGeometry(1000,48,24),cloudMaterial);clouds.name='Soft drifting cloud layer';clouds.renderOrder=-8;group.add(clouds);
  let seed=349;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  const positions=[],sizes=[],phases=[];
  for(let i=0;i<1400;i++){const y=.10+random()*.9,angle=random()*Math.PI*2,r=Math.sqrt(1-y*y);positions.push(Math.cos(angle)*r*990,y*990,Math.sin(angle)*r*990);sizes.push(.8+random()*1.8);phases.push(random()*Math.PI*2);}
  const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));starGeometry.setAttribute('starSize',new T.Float32BufferAttribute(sizes,1));starGeometry.setAttribute('phase',new T.Float32BufferAttribute(phases,1));
  const starUniforms={time:uniforms.time,intensity:{value:0}};
  const stars=new T.Points(starGeometry,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:starUniforms,
    vertexShader:'attribute float starSize;attribute float phase;varying float brightness;uniform float time;void main(){brightness=.70+.3*sin(time*.45+phase);gl_PointSize=starSize;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying float brightness;uniform float intensity;void main(){float radius=length(gl_PointCoord-.5)*2.;float alpha=(1.-smoothstep(.12,1.,radius))*brightness*intensity;gl_FragColor=vec4(.78,.87,1.,alpha);}'
  }));stars.name='Night stars';stars.renderOrder=-7;group.add(stars);
  const moonCanvas=document.createElement('canvas');moonCanvas.width=moonCanvas.height=128;const ctx=moonCanvas.getContext('2d');const halo=ctx.createRadialGradient(64,64,12,64,64,62);halo.addColorStop(0,'rgba(232,239,245,.95)');halo.addColorStop(.25,'rgba(228,236,244,.9)');halo.addColorStop(.31,'rgba(184,204,233,.12)');halo.addColorStop(1,'rgba(184,204,233,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,128,128);
  const moonTexture=new T.CanvasTexture(moonCanvas);moonTexture.colorSpace=T.SRGBColorSpace;const moon=new T.Sprite(new T.SpriteMaterial({map:moonTexture,transparent:true,depthWrite:false,opacity:0,toneMapped:false}));moon.name='Moon and soft halo';moon.position.set(-480,630,-500);moon.scale.set(115,115,1);group.add(moon);
  let lighting='day',last=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setLighting(name){lighting=name;uniforms.night.value=name==='night'?1:0;uniforms.tint.value.set(name==='evening'?0xffd5b0:0xf3f6f6);starUniforms.intensity.value=name==='night'?1:name==='evening'?.12:0;moon.material.opacity=name==='night'?.92:0;invalidate?.();}
  const listener=event=>setLighting(event.detail.name);document.addEventListener('architectural-lighting-change',listener);setLighting('day');
  return {group,update(now){if(reduced||now-last<100)return false;last=now;uniforms.time.value=now/1000;return true;},get lighting(){return lighting;},dispose(){document.removeEventListener('architectural-lighting-change',listener);group.removeFromParent();terrain.geometry.dispose();terrain.material.dispose();texture.dispose();clouds.geometry.dispose();cloudMaterial.dispose();starGeometry.dispose();stars.material.dispose();moon.material.dispose();moonTexture.dispose();}};
}
