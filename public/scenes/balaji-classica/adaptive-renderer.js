import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {OutputPass} from './shared/vendor/addons/postprocessing/OutputPass.js';

// Sharp multisampled stills, single-sample motion, and one colour-output pass.
export function createSmoothRenderer(renderer,scene,camera){
  const still=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType});
  still.samples=Math.min(4,renderer.capabilities.maxSamples||0);
  const motion=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType});
  const makeOutput=antialias=>{
    const output=new OutputPass();output.renderToScreen=true;
    output.uniforms.viewportScale={value:new T.Vector2(1,1)};output.uniforms.resolution={value:new T.Vector2(1,1)};
    let fragment=output.material.fragmentShader.replace('uniform sampler2D tDiffuse;',`uniform sampler2D tDiffuse;uniform vec2 viewportScale;uniform vec2 resolution;
      vec3 sampleColor(vec2 uv){return texture2D(tDiffuse,clamp(uv,resolution*.5,vec2(1.)-resolution*.5)*viewportScale).rgb;}
      vec3 filterEdges(vec2 uv){
        vec3 nw=sampleColor(uv+vec2(-1.,-1.)*resolution),ne=sampleColor(uv+vec2(1.,-1.)*resolution);
        vec3 sw=sampleColor(uv+vec2(-1.,1.)*resolution),se=sampleColor(uv+vec2(1.,1.)*resolution),center=sampleColor(uv);
        vec3 luma=vec3(.299,.587,.114);float a=dot(nw,luma),b=dot(ne,luma),c=dot(sw,luma),d=dot(se,luma),m=dot(center,luma);
        float low=min(m,min(min(a,b),min(c,d))),high=max(m,max(max(a,b),max(c,d)));
        if(high-low<max(.04,high*.12))return center;
        vec2 direction=vec2(-((a+b)-(c+d)),(a+c)-(b+d));float reduce=max((a+b+c+d)*.03125,.0078125);
        direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduce),vec2(-4.),vec2(4.))*resolution;
        return .5*(sampleColor(uv-direction*.1666667)+sampleColor(uv+direction*.1666667));
      }`);
    fragment=fragment.replace('gl_FragColor = texture2D( tDiffuse, vUv );',antialias?'gl_FragColor = vec4( filterEdges(vUv), 1.0 );':'gl_FragColor = vec4( sampleColor(vUv), 1.0 );');
    output.material.fragmentShader=fragment;return output;
  };
  const stillOutput=makeOutput(!still.samples),motionOutput=makeOutput(true);
  let width=0,height=0,native=0;
  function resize(){
    const size=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio();
    if(size.x===width&&size.y===height&&ratio===native)return;
    width=size.x;height=size.y;native=ratio;
    for(const target of [still,motion])target.setSize(Math.max(1,Math.floor(width*native)),Math.max(1,Math.floor(height*native)));
  }
  renderer.info.autoReset=false;
  return {
    render(ratio=native,moving=false){
      resize();const target=moving?motion:still,output=moving?motionOutput:stillOutput;
      const w=Math.max(1,Math.min(target.width,Math.floor(width*ratio))),h=Math.max(1,Math.min(target.height,Math.floor(height*ratio)));
      target.viewport.set(0,0,w,h);target.scissor.set(0,0,w,h);target.scissorTest=true;
      renderer.info.reset();renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);
      output.uniforms.viewportScale.value.set(w/target.width,h/target.height);output.uniforms.resolution.value.set(1/w,1/h);
      renderer.setRenderTarget(null);renderer.setViewport(0,0,width,height);output.render(renderer,null,target);
    },
    async compile(){resize();const previous=renderer.getRenderTarget();renderer.setRenderTarget(still);await renderer.compileAsync(scene,camera);renderer.setRenderTarget(previous);}
  };
}
