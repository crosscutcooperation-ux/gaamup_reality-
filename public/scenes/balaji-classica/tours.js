import * as T from './vendor/three.module.js?v=shared-runtime-12';

// Waypoints stay on the podium's pedestrian perimeter, away from the pools.
export const TOUR_POINTS=[[-24,3.6,22],[-26,3.6,8],[-26,3.6,-10],[-9,3.6,-16],[13,3.6,-12]];
export function createTours({canvas,camera,enterWalk,isWalking,invalidate,toast,onPose}){
  const host=document.querySelector('#walk-panel'),progress=document.querySelector('#tour-progress');progress.max=1;
  const guide=document.querySelector('#guided-tour'),record=document.querySelector('#record-tour'),download=document.querySelector('#download-tour');
  const curve=new T.CatmullRomCurve3(TOUR_POINTS.map(p=>new T.Vector3(...p)),false,'centripetal');
  let elapsed=0,running=false,recorder=null,stream=null,objectURL=null;
  function stop(){running=false;guide.setAttribute('aria-pressed','false');progress.hidden=true;if(recorder?.state==='recording')recorder.stop();invalidate();}
  function start(){if(!isWalking())enterWalk();elapsed=0;running=true;guide.setAttribute('aria-pressed','true');progress.hidden=false;progress.value=0;invalidate();}
  guide.onclick=()=>running?stop():start();
  record.onclick=()=>{
    if(recorder?.state==='recording'){stop();return;}
    if(!canvas.captureStream||typeof MediaRecorder==='undefined'){toast('Video recording is unavailable in this browser. You can still use the guided tour.');return;}
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
    if(!mime){toast('This browser does not support WebM recording.');return;}
    try{stream=canvas.captureStream(30);const chunks=[];recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:7000000});
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(new Blob(chunks,{type:mime}));download.href=objectURL;download.hidden=false;record.textContent='Record tour';record.setAttribute('aria-pressed','false');toast('Your walkthrough video is ready to download.');};
      recorder.start();record.textContent='Stop recording';record.setAttribute('aria-pressed','true');download.hidden=true;start();
    }catch(error){stream?.getTracks().forEach(t=>t.stop());toast('Video recording could not start. Please try again.');}
  };
  return {show(value){host.hidden=!value;if(!value)stop();},get running(){return running;},stop,
    update(dt){if(!running)return false;elapsed+=dt;const t=Math.min(elapsed/38,1);camera.position.copy(curve.getPointAt(t));
      const target=new T.Vector3(10,5,5);camera.lookAt(target);onPose?.(target.sub(camera.position).normalize());progress.value=t;invalidate();if(t===1){stop();toast('Guided tour complete. Drag to look around or use the walking controls.');}return true;
    }};
}
