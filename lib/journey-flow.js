function checkAbort(signal){signal?.throwIfAborted();}
/** Navigation is the final step. A missing or failed renderer never skips the journey. */
export async function completeStationJourney({ready,play,cover,navigate,signal}){
  checkAbort(signal);
  const scene=await ready;
  checkAbort(signal);
  if(!scene||typeof scene.travelTo!=='function')throw new Error('The railway is not ready. Please try again.');
  await play(scene);
  checkAbort(signal);
  await cover();
  checkAbort(signal);
  navigate();
}
export function waitFor(ms,signal){
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(signal.reason);return;}
    const abort=()=>{clearTimeout(timer);reject(signal.reason);};
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);
    signal?.addEventListener('abort',abort,{once:true});
  });
}
