import {LIGHTING_PRESETS} from '../sai-world-dreams/architectural-lighting.js?v=interior-lighting-2';
import * as T from './vendor/three.module.js';
import {BUILDINGS,resolvePlan} from './floor-plan-data.js';

export function createTowerElevation({renderer,canvas,environment,open,close}){
  const byId=id=>document.getElementById(id);
  const dialog=byId('elevation'),stage=byId('elevation-stage'),rail=byId('elevation-levels'),bands=byId('elevation-bands');
  const railNav=rail.parentElement;
  const highlight=document.createElement('i');
  const overviewLabel=canvas.getAttribute('aria-label');
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,600);
  scene.environment=environment;
  const ambient=new T.HemisphereLight(0xe2f1ff,0x6b7256,.48);scene.add(ambient);
  const keyLight=new T.DirectionalLight(0xfff0dc,2.3);
  const fillLight=new T.DirectionalLight(0xd6eaff,.28);
  scene.add(keyLight,keyLight.target,fillLight);
  let building=null,mesh=null,parent=null,level=9,home=null;
  let yaw=0,pitch=0,hasSelection=false,drag=null,dragged=false,interactive=false,lastHover=null;
  const pickRay=new T.Raycaster(),pickPointer=new T.Vector2();
  let buttons=[],slices=[],transition=null,closing=false,pending=null,origin=null;
  const switcher=document.createElement('select');
  switcher.setAttribute('aria-label','Choose a building');
  switcher.className='elevation-switcher';
  for(const item of BUILDINGS){
    const option=document.createElement('option');
    option.value=item.sceneId??item.id;option.textContent=item.name;
    switcher.append(option);
  }
  byId('leave-elevation').insertAdjacentElement('afterend',switcher);
  function siteTransform(){
    const rect=stage.getBoundingClientRect();
    const scale=Math.max(.04,Math.min(2,origin.height/(rect.height*.93)));
    return 'translate('+ (origin.x-rect.left-rect.width/2)+'px,'+(origin.y-rect.top-rect.height/2)+'px) scale('+scale+')';
  }
  function leave(next){
    pending=next;
    if(closing)return;
    closing=true;
    const motion=matchMedia('(prefers-reduced-motion: reduce)').matches?180:650;
    const animation=canvas.animate([
      {transform:'translate(0, 0) scale(1)',opacity:1},
      {transform:siteTransform(),opacity:0}
    ],{duration:motion,easing:'cubic-bezier(.55,0,.8,.25)',fill:'forwards'});
    animation.finished.then(()=>{
      dialog.close();animation.cancel();

    });
  }
  switcher.onchange=()=>leave(switcher.value);
  dialog.addEventListener('cancel',event=>{event.preventDefault();leave();});
  function updateLighting(detail){
    const name=detail?.name??byId('scene').dataset.lighting??'day';
    const p=LIGHTING_PRESETS[name];
    if(detail?.environment)scene.environment=detail.environment;
    scene.environmentIntensity=p.environment;
    ambient.intensity=p.ambient;
    ambient.color.set(name==='night'?0xcbdcf2:name==='evening'?0xd9c1b5:0xe2f1ff);
    keyLight.intensity=p.sunPower;keyLight.color.set(p.color);
    fillLight.intensity=p.fill;fillLight.color.set(name==='night'?0xc3d7ff:name==='evening'?0xffd09a:0xd6eaff);
    dialog.dataset.lighting=name;
    resize();
  }
  document.addEventListener('architectural-lighting-change',event=>updateLighting(event.detail));
  const format=n=>n===0?'G':String(n).padStart(2,'0');

  function preview(n){
    if(!building)return;
    buttons[level]?.removeAttribute('aria-current');
    level=n;hasSelection=true;
    byId('elevation-indicator').hidden=false;byId('elevation-dim').hidden=true;highlight.hidden=false;
    buttons[n].setAttribute('aria-current','true');
    if(slices[n]){
      highlight.style.top=slices[n].style.top;
      highlight.style.height=slices[n].style.height;
      const top=parseFloat(slices[n].style.top),bottom=top+parseFloat(slices[n].style.height);
      byId('elevation-dim').style.setProperty('--band-top',top+'%');
      byId('elevation-dim').style.setProperty('--band-bottom',bottom+'%');
      byId('elevation-indicator').style.top=bottom+'%';
      byId('elevation-open').style.marginTop=bottom>92?'-38px':'0';
    }
    const plan=resolvePlan(building.id,n);
    byId('elevation-open').textContent=n===0?'OPEN GROUND FLOOR':'OPEN LEVEL '+format(n);
    byId('elevation-readout').textContent=n===0?'GROUND FLOOR':'LEVEL '+format(n);
    byId('elevation-tag').textContent=format(n);
    if(!slices[n])byId('elevation-indicator').style.top=((1-n/building.floors)*76+15)+'%';
    byId('elevation-note').textContent=plan.available?(plan.sharedReference?'Orchard · shared Spring layout':plan.verified?'Floor plan available':'Typical and refuge layouts · floor assignment unconfirmed'):'Drawing unavailable';
    renderer.render(scene,camera);
  }
  function openPlan(n){
    if(dragged){dragged=false;return;}
    preview(n);resize();
    document.dispatchEvent(new CustomEvent('open-block-floor',{detail:{id:building.id,floor:n}}));
  }
  document.addEventListener('floor-plan-close',()=>{
    if(!building)return;
    const floor=Number(byId('floor-dialog').dataset.floor);
    if(buttons[floor])preview(floor);
  });
  byId('elevation-open').onclick=()=>openPlan(level);
  byId('leave-elevation').onclick=()=>leave();
  dialog.addEventListener('close',()=>{
    if(!building)return;
    parent.add(mesh);home.replaceWith(canvas);canvas.setAttribute('aria-label',overviewLabel);canvas.tabIndex=0;building=null;mesh=null;
    interactive=false;lastHover=null;
    renderer.setClearAlpha(1);
    close();closing=false;
    if(pending){const next=pending;pending=null;document.dispatchEvent(new CustomEvent('switch-elevation-tower',{detail:next}));}
  });
  function resize(){
    if(!building||!dialog.open)return;
    const w=stage.clientWidth,h=stage.clientHeight;
    if(!w||!h)return;
    const commercial=building.id==='business',angle=mesh.rotation.y+yaw;
    const modelBounds=new T.Box3().setFromObject(mesh),modelCenter=modelBounds.getCenter(new T.Vector3());const mid=modelCenter.y;
    const modelSize=modelBounds.getSize(new T.Vector3());const span=Math.max(modelSize.y*1.12,modelSize.x*h/w*1.18,modelSize.z*h/w*1.18);
    const direction=new T.Vector3(Math.sin(angle)*Math.cos(pitch),Math.sin(pitch),Math.cos(angle)*Math.cos(pitch));
    const distance=180;
    camera.top=span/2;camera.bottom=-span/2;camera.right=span*w/h/2;camera.left=-camera.right;
    camera.position.copy(modelCenter).addScaledVector(direction,distance);
    camera.lookAt(modelCenter);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    keyLight.target.position.copy(modelCenter);keyLight.position.copy(modelCenter).add(new T.Vector3(-85,125,100));
    fillLight.position.copy(modelCenter).add(new T.Vector3(85,70,-95));
    renderer.setSize(w,h,false);renderer.setClearAlpha(0);renderer.render(scene,camera);
    railNav.classList.remove('aligned');
    if(commercial)return;
    
    // Project the elevation onto the same camera plane as its picking stripes.
    const bounds=new T.Box3().setFromObject(mesh),xs=[],v=new T.Vector3();
    for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z]){v.set(x,bounds.getCenter(new T.Vector3()).y,z).project(camera);xs.push((v.x+1)*w/2);}
    const min=Math.min(...xs),max=Math.max(...xs);
    byId('elevation-indicator').style.left=Math.max(24,min-12)+'px';
    byId('elevation-indicator').style.right=Math.max(12,w-max-40)+'px';
    bands.style.left=min+'px';bands.style.width=(max-min)+'px';
    const base=mesh.position.y;
    for(let n=0;n<=building.floors;n++){
      const bottom=n===0?base:base+6.8+(n-1)*3.05;
      const top=base+6.8+n*3.05;
      const projectedTop=new T.Vector3(mesh.position.x,top,mesh.position.z).project(camera).y;
      const projectedBottom=new T.Vector3(mesh.position.x,bottom,mesh.position.z).project(camera).y;
      slices[n].style.top=((1-projectedTop)*50)+'%';
      slices[n].style.height=((projectedTop-projectedBottom)*50)+'%';
    }
    const rowPitch=h*3.05/span;
    if(matchMedia('(min-width:651px) and (pointer:fine)').matches&&rowPitch>=12){
      const rowTop=parseFloat(slices[building.floors].style.top)*h/100;
      railNav.style.setProperty('--rail-shift',(max-w+20)+'px');
      railNav.style.setProperty('--rail-top',rowTop+'px');
      railNav.style.setProperty('--pitch',rowPitch+'px');
      railNav.style.setProperty('--ground-pitch',(h*6.8/span)+'px');
      railNav.classList.add('aligned');
    }
    if(hasSelection)preview(level);
  }
  function clearSelection(){
    hasSelection=false;buttons[level]?.removeAttribute('aria-current');
    byId('elevation-indicator').hidden=true;byId('elevation-dim').hidden=true;highlight.hidden=true;
    byId('elevation-readout').textContent='SELECT A LEVEL';
    byId('elevation-note').textContent='Hover to highlight · Click a floor or level number to open its plan.';
    if(interactive&&building&&dialog.open)renderer.render(scene,camera);
  }
  function floorAt(event){
    if(!building||!mesh)return null;
    const rect=stage.getBoundingClientRect();
    pickPointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
    pickRay.setFromCamera(pickPointer,camera);
    const hit=pickRay.intersectObject(mesh,true)[0];
    if(!hit)return null;
    const y=hit.point.y-mesh.position.y;
    if(y<0||y>6.8+building.floors*3.05)return null;
    return T.MathUtils.clamp(Math.ceil((y-6.8)/3.05),0,building.floors);
  }
  stage.addEventListener('pointerdown',event=>{
    if(!interactive||event.button!==0||event.target.closest('button'))return;
    drag={x:event.clientX,y:event.clientY};dragged=false;lastHover=null;
  });
  stage.addEventListener('pointermove',event=>{
    if(!interactive||!building||event.target.closest('button'))return;
    if(drag){
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!dragged&&Math.hypot(dx,dy)<5)return;
      dragged=true;clearSelection();
      yaw+=dx*.006;pitch=T.MathUtils.clamp(pitch+dy*.004,-.25,.38);
      drag={x:event.clientX,y:event.clientY};resize();return;
    }
    if(event.buttons)return;
    // Ignore the pointer inherited from opening the dialog and its arrival animation.
    const previous=lastHover;lastHover={x:event.clientX,y:event.clientY};
    if(!previous||Math.hypot(event.clientX-previous.x,event.clientY-previous.y)<2)return;
    dragged=false;
    const n=floorAt(event);
    if(n===null)clearSelection();else preview(n);
  });
  stage.addEventListener('pointerleave',()=>{lastHover=null;if(!drag)clearSelection();});
  stage.addEventListener('pointerup',event=>{
    if(!building||closing||!drag||dragged||event.button!==0||event.target.closest('button'))return;
    const floor=floorAt(event);
    if(floor!==null)openPlan(floor);
  });
  window.addEventListener('pointerup',()=>{drag=null;lastHover=null;});
  window.addEventListener('pointercancel',()=>{drag=null;dragged=false;lastHover=null;});
  new ResizeObserver(resize).observe(stage);
  function show(id,selected){
    const entry=BUILDINGS.find(b=>b.sceneId===id||b.id===id);
    if(!entry||dialog.open)return;
    yaw=.48;pitch=.08;hasSelection=false;dragged=false;interactive=false;lastHover=null;dialog.dataset.arriving="true";
    origin=open(byId('elevation-background'),selected);building=entry;mesh=selected;parent=mesh.parent;scene.add(mesh);
    home=document.createComment('overview canvas');canvas.replaceWith(home);stage.prepend(canvas);
    switcher.value=entry.sceneId??entry.id;
    byId('elevation-name').textContent=entry.name;
    byId('elevation-index').textContent=entry.number?'RESIDENTIAL TOWER  /  '+format(entry.number):'COMMERCIAL TOWER';
    canvas.setAttribute('aria-label',entry.name+' original 3D tower, straight-on front elevation. Hover over the model to choose a floor.');canvas.tabIndex=-1;rail.replaceChildren();bands.replaceChildren(highlight);highlight.hidden=!entry.number;buttons=[];slices=[];
    for(let n=entry.floors;n>=0;n--){
      const button=document.createElement('button');button.type='button';button.textContent=format(n);
      button.style.setProperty('--reveal-delay',(0.2+(entry.floors-n)*.026)+'s');
      button.setAttribute('aria-label',n===0?'Ground floor':'Level '+n);
      button.onfocus=()=>{if(interactive)preview(n);};button.onpointermove=e=>{if(interactive&&e.pointerType==='mouse'&&!e.buttons)preview(n);};
      button.onclick=()=>{if(building&&!closing){dragged=false;openPlan(n);}};rail.append(button);buttons[n]=button;
      if(entry.number){
        const slice=document.createElement('div');
        // Projected bands only draw the hover highlight. Picking uses the 3D mesh.
        slices[n]=slice;bands.append(slice);
      }
    }
    if(!entry.number){
      byId('elevation-indicator').style.left='20%';
      byId('elevation-indicator').style.right='14%';
      byId('elevation-open').style.marginTop='0';
      byId('elevation-dim').style.setProperty('--band-top','0%');
      byId('elevation-dim').style.setProperty('--band-bottom','100%');
    }
    dialog.showModal();level=Math.min(9,entry.floors);
    byId('elevation-indicator').hidden=true;byId('elevation-dim').hidden=true;highlight.hidden=true;
    byId('elevation-readout').textContent='SELECT A LEVEL';
    byId('elevation-note').textContent=entry.id==='orchard'?'Tower 5 · Orchard uses the neighbouring Spring layout for this preview.':'Hover to highlight · Click a floor or level number to open its plan.';
    updateLighting();
    transition?.cancel();
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?180:900;
    transition=canvas.animate([
      {transform:siteTransform(),opacity:0},
      {transform:'translate(0, 0) scale(1)',opacity:1}
    ],{duration,easing:'cubic-bezier(.22,1,.36,1)'});
    transition.finished.then(()=>{if(!closing&&building===entry){interactive=true;lastHover=null;dialog.dataset.arriving='false';clearSelection();}}).catch(()=>{});
  }
  return {show,resize,get active(){return building!==null;}};
}
