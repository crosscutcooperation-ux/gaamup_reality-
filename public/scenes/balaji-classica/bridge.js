const send=data=>parent.postMessage({source:'aero-scene',...data},location.origin);
const view=name=>send({type:'view',view:name});let plan=false,tower=false;
document.addEventListener('plan-explorer-state',e=>{plan=e.detail.open;view(plan?'floor':tower?'building':'colony');});
document.addEventListener('tower-detail-state',e=>{tower=e.detail.open;if(!plan)view(tower?'building':'colony');});
const walkPanel=document.getElementById('walk-panel');
new MutationObserver(()=>view(walkPanel.hidden?'colony':'walk')).observe(walkPanel,{attributes:true,attributeFilter:['hidden']});
const loading=document.getElementById('loading'),error=document.getElementById('error');
function report(){if(!error.hidden)send({type:'error',message:'The Balaji model could not load. Please retry.'});else if(loading.hidden)send({type:'ready',playing:false});}
new MutationObserver(report).observe(loading,{attributes:true,attributeFilter:['hidden']});new MutationObserver(report).observe(error,{attributes:true,attributeFilter:['hidden']});
addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin||event.data?.source!=='aero-controls')return;if(event.data.action==='floor-picker')document.getElementById('browse-plans')?.click();});
