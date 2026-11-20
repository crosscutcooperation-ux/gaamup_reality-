/** Pending feedback follows actual image decoding and ignores superseded views. */
export function createPlanFeedback(status){
 let version=0;
 const stage=status.closest('.plan-stage');
 function clear(){status.hidden=true;delete status.dataset.loading;if(stage)delete stage.dataset.planLoading;}
 function begin(message){const request=++version;status.hidden=false;status.dataset.loading='true';status.textContent=message;if(stage)stage.dataset.planLoading='true';return request;}
 function finish(request){if(request!==version)return;clear();}
 function cancel(){version++;clear();}
 async function run(task,message,{valid=()=>true,ready=()=>{},error='This drawing could not load. Choose another view or reopen the floor to retry.'}={}){
  const request=begin(message);
  try{await task();if(request!==version||!valid())return false;ready();
   // Let the covered layout paint before exposing the decoded replacement.
   if(typeof requestAnimationFrame==='function')await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(request!==version||!valid())return false;finish(request);return true;}
  catch(cause){if(request===version&&valid()){status.hidden=false;status.dataset.loading='false';status.textContent=error;}return false;}
 }
 function image(image,src,message,options={}){
  return run(()=>{image.src=src;return image.decode();},message,options);
 }
 return {begin,cancel,run,image};
}
