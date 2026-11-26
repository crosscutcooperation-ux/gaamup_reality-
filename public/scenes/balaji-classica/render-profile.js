// Opt-in local diagnostics; no samples are collected during ordinary use.
export function createRenderProfile(canvas,renderer){
  if(!new URLSearchParams(location.search).has('profile'))return {begin(){},end(){}};
  const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');canvas.dataset.graphics=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'WebGL';
  const frames=[],cpu=[];let last=0,start=0,count=0;
  const percentile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.floor((values.length-1)*p)]||0;
  return {
    begin(now){start=performance.now();if(last&&now-last<250)frames.push(now-last);last=now;},
    end(){cpu.push(performance.now()-start);if(frames.length>120)frames.shift();if(cpu.length>120)cpu.shift();
      canvas.dataset.renderFrames=String(++count);
      if(count%30===0)canvas.dataset.renderProfile=JSON.stringify({frames:count,frameMedianMs:+percentile(frames,.5).toFixed(2),frameP95Ms:+percentile(frames,.95).toFixed(2),cpuMedianMs:+percentile(cpu,.5).toFixed(2),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,pixelRatio:renderer.getPixelRatio(),drawPixelRatio:Number(canvas.dataset.renderScale),motionBlocks:Number(canvas.dataset.motionBlocks)});
    }
  };
}
