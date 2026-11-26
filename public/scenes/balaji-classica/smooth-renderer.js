import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {OutputPass} from './shared/vendor/addons/postprocessing/OutputPass.js';
import {FullScreenQuad} from './shared/vendor/addons/postprocessing/Pass.js';
import {FXAAShader} from './shared/vendor/addons/shaders/FXAAShader.js';

// Allocate at native resolution only on a window resize. Movement changes a
// viewport inside those buffers, avoiding canvas/depth-buffer reallocation.
export function createSmoothRenderer(renderer,scene,camera){
  const hdr=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType});
  hdr.samples=Math.min(4,renderer.capabilities.maxSamples||0);
  const display=new T.WebGLRenderTarget(1,1,{depthBuffer:false});
  const output=new OutputPass(),uniforms=T.UniformsUtils.clone(FXAAShader.uniforms);
  uniforms.viewportScale={value:new T.Vector2(1,1)};
  output.uniforms.viewportScale=uniforms.viewportScale;
  output.material.fragmentShader=output.material.fragmentShader.replace('uniform sampler2D tDiffuse;','uniform sampler2D tDiffuse;uniform vec2 viewportScale;').replace('texture2D( tDiffuse, vUv )','texture2D( tDiffuse, vUv * viewportScale )');
  const fragment=FXAAShader.fragmentShader.replace('uniform vec2 resolution;','uniform vec2 resolution;uniform vec2 viewportScale;').replace('texture( tex2D, uv )','texture( tex2D, clamp(uv,resolution*.5,vec2(1.)-resolution*.5)*viewportScale )');
  const material=new T.ShaderMaterial({uniforms,vertexShader:FXAAShader.vertexShader,fragmentShader:fragment,depthTest:false,depthWrite:false,toneMapped:false});
  const fastMaterial=new T.ShaderMaterial({uniforms,vertexShader:FXAAShader.vertexShader,depthTest:false,depthWrite:false,toneMapped:false,fragmentShader:`
    uniform sampler2D tDiffuse;uniform vec2 resolution;uniform vec2 viewportScale;varying vec2 vUv;
    vec3 sampleColor(vec2 p){return texture2D(tDiffuse,clamp(p,resolution*.5,vec2(1.)-resolution*.5)*viewportScale).rgb;}
    void main(){
      vec3 nw=sampleColor(vUv+vec2(-1.,-1.)*resolution),ne=sampleColor(vUv+vec2(1.,-1.)*resolution);
      vec3 sw=sampleColor(vUv+vec2(-1.,1.)*resolution),se=sampleColor(vUv+vec2(1.,1.)*resolution),center=sampleColor(vUv);
      vec3 luma=vec3(.299,.587,.114);float a=dot(nw,luma),b=dot(ne,luma),c=dot(sw,luma),d=dot(se,luma),m=dot(center,luma);
      float lo=min(m,min(min(a,b),min(c,d))),hi=max(m,max(max(a,b),max(c,d)));
      if(hi-lo<max(.0312,hi*.063)){gl_FragColor=vec4(center,1.);return;}
      vec2 direction=vec2(-((a+b)-(c+d)),(a+c)-(b+d));
      float reduce=max((a+b+c+d)*.03125,.0078125);
      direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-8.),vec2(8.))*resolution;
      vec3 rgbA=.5*(sampleColor(vUv+direction*(-.1666667))+sampleColor(vUv+direction*.1666667));
      vec3 rgbB=rgbA*.5+.25*(sampleColor(vUv-direction*.5)+sampleColor(vUv+direction*.5));
      float lumaB=dot(rgbB,luma);gl_FragColor=vec4(lumaB<lo||lumaB>hi?rgbA:rgbB,1.);
    }`});
  // Multisampling preserves fine window frames without the full-screen FXAA
  // softening. Keep FXAA only for devices without multisample render targets.
  const sharpMaterial=new T.ShaderMaterial({uniforms,vertexShader:FXAAShader.vertexShader,depthTest:false,depthWrite:false,toneMapped:false,fragmentShader:`
    uniform sampler2D tDiffuse;uniform vec2 resolution;uniform vec2 viewportScale;varying vec2 vUv;
    void main(){gl_FragColor=texture2D(tDiffuse,clamp(vUv,resolution*.5,vec2(1.)-resolution*.5)*viewportScale);}`});
  const quad=new FullScreenQuad(material);let width=0,height=0,native=0;
  function resize(){const size=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio();
    if(size.x===width&&size.y===height&&ratio===native)return;
    width=size.x;height=size.y;native=ratio;
    hdr.setSize(Math.max(1,Math.floor(width*native)),Math.max(1,Math.floor(height*native)));display.setSize(hdr.width,hdr.height);
  }
  renderer.info.autoReset=false;
  return {
    render(ratio=native,moving=false){resize();const w=Math.max(1,Math.min(hdr.width,Math.floor(width*ratio))),h=Math.max(1,Math.min(hdr.height,Math.floor(height*ratio)));
      for(const target of [hdr,display]){target.viewport.set(0,0,w,h);target.scissor.set(0,0,w,h);target.scissorTest=true;}
      uniforms.viewportScale.value.set(w/display.width,h/display.height);
      renderer.info.reset();renderer.setRenderTarget(hdr);renderer.clear();renderer.render(scene,camera);
      output.render(renderer,display,hdr);
      uniforms.tDiffuse.value=display.texture;uniforms.resolution.value.set(1/w,1/h);uniforms.viewportScale.value.set(w/display.width,h/display.height);
      renderer.setRenderTarget(null);renderer.setViewport(0,0,width,height);quad.material=hdr.samples?sharpMaterial:moving?fastMaterial:material;quad.render(renderer);
    },
    async compile(){resize();const previous=renderer.getRenderTarget();renderer.setRenderTarget(hdr);await renderer.compileAsync(scene,camera);renderer.setRenderTarget(previous);}
  };
}
