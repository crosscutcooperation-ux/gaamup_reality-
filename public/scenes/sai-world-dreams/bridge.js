import {BUILDINGS} from './floor-plan-data.js';
const send=data=>parent.postMessage({source:'aero-scene',...data},'*');
const byId=id=>document.getElementById(id);
let ready=false,lastView='',lastLighting='',lastOrbit=null;
function setDrawer(open){byId('explore-drawer').hidden=!open;byId('explore-toggle').setAttribute('aria-expanded',String(open));}
byId('explore-toggle').onclick=()=>setDrawer(byId('explore-drawer').hidden);
byId('close-explore').onclick=()=>setDrawer(false);
for(const element of document.querySelectorAll('.sidebar button[data-place],#tower,#open-floor-plan'))element.addEventListener(element.tagName==='SELECT'?'change':'click',()=>setDrawer(false));
function synchronize(){
  const canvas=byId('scene');
  if(!ready&&canvas.dataset.modelReady==='true'){
    ready=true;
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&byId('rotate').getAttribute('aria-pressed')!=='true')byId('rotate').click();
    send({type:'ready',playing:byId('rotate').getAttribute('aria-pressed')==='true'});
  }
  const floor=byId('floor-plan-dialog'),elevation=byId('elevation');
  const view=floor.open?(floor.classList.contains('apartment')?'unit':'floor'):elevation.open?'building':byId('viewer').dataset.mode==='walk'?'walk':'colony';
  const signature=[view,floor.dataset.building,floor.dataset.floor,byId('elevation-name').textContent,byId('apartment-number').textContent].join(':');
  if(signature!==lastView){lastView=signature;const building=BUILDINGS.find(b=>floor.open?b.id===floor.dataset.building:b.name===byId('elevation-name').textContent);if(building&&view!=='colony')send({type:'selection',id:building.sceneId?'tower-'+building.sceneId:building.id,name:building.name});send({type:'view',view,building:floor.open?floor.dataset.building:byId('elevation-name').textContent,floor:floor.open?Number(floor.dataset.floor):null,unit:view==='unit'?byId('apartment-number').textContent:null});}
  const lighting=canvas.dataset.lighting||'day';if(lighting!==lastLighting){lastLighting=lighting;send({type:'lighting',name:lighting});}
  const playing=byId('rotate').getAttribute('aria-pressed')==='true';if(playing!==lastOrbit){lastOrbit=playing;send({type:'orbit',playing});}
  if(!byId('error').hidden)send({type:'error',message:'The project scene could not load. Check its local assets and try again.'});
}
const observer=new MutationObserver(synchronize);observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class','data-model-ready','data-mode','data-lighting','data-floor','data-building','aria-pressed','hidden']});
addEventListener('message',event=>{
  if(event.source!==parent||event.data?.source!=='aero-controls')return;
  const data=event.data;
  if(data.action==='floor-picker'){setDrawer(true);byId('plan-building').focus();}
  const actions={rotate:'rotate',reset:'reset',in:'zoom-in',out:'zoom-out'};
  if(actions[data.action])byId(actions[data.action]).click();
  if(data.action==='lighting'&&['day','evening','night'].includes(data.value))document.querySelector(`.lighting-modes [data-lighting="${data.value}"]`)?.click();
  if(data.action==='building'&&[...byId('tower').options].some(o=>o.value===data.id)){byId('tower').value=data.id;byId('tower').dispatchEvent(new Event('change'));}
});
addEventListener('pagehide',()=>observer.disconnect());
