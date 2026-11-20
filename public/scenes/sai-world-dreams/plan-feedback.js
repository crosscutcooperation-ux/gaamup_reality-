/** Pending feedback follows actual image decoding and ignores superseded views. */
export function createPlanFeedback(status){
 let version=0;
 function begin(message){const request=++version;status.hidden=false;status.dataset.loading='true';status.textContent=message;return request;}
 function finish(request){if(request!==version)return;status.hidden=true;delete status.dataset.loading;}
 function cancel(){version++;status.hidden=true;delete status.dataset.loading;}
 async function run(task,message,{valid=()=>true,ready=()=>{},error='This drawing could not load. Choose another view or reopen the floor to retry.'}={}){
  const request=begin(message);
  try{await task();if(request!==version||!valid())return false;ready();finish(request);return true;}
  catch(cause){if(request===version&&valid()){status.hidden=false;status.dataset.loading='false';status.textContent=error;}return false;}
 }
 function image(image,src,message,options={}){
  image.src=src;
  return run(()=>image.decode(),message,options);
 }
 return {begin,cancel,run,image};
}
