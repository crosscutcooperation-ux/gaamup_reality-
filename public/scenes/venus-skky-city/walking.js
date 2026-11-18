import * as T from './vendor/three.module.js';
import {towerSpecs} from './model.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const routes={pool:[[-34,8.7,-2],[-39,8.7,-18],[-36,8.7,-49],[-14,8.7,-61],[18,8.7,-55],[29,8.7,-25],[18,8.7,9]],garden:[[-34,8.7,26],[-12,8.7,26],[15,8.7,27],[31,8.7,8],[31,8.7,-15]]};
export function canWalk(x,z){
 if(x< -61||x>64||z< -88||z>70)return false;
 if(((x+20)/13)**2+((z+29)/17)**2<1||((x+10)/11)**2+((z+40)/8)**2<1||((x+27)/9)**2+((z+12)/8)**2<1||((x+3)/12)**2+((z+13)/15)**2<1)return false;
 for(const s of towerSpecs.slice(0,7)){const dx=x-s.x,dz=z-s.z,c=Math.cos(s.rotation),q=Math.sin(s.rotation),lx=dx*c-dz*q,lz=dx*q+dz*c;if(Math.abs(lx)<s.width/2+1&&Math.abs(lz)<s.depth/2+1)return false;}
 return true;
}
export function createWalking({camera,canvas,controls,onExit,invalidate,announce}){
 let active=false,zone='pool',yaw=0,pitch=0,drag=null,tour=false,tourTime=0,recorder=null,clipUrl=null;const keys=new Set();
 function stopRecording(){if(recorder?.state==='recording')recorder.stop();$('#record-tour').setAttribute('aria-pressed','false');}
 function enter(name){zone=name;active=true;tour=false;controls.enabled=false;camera.position.set(...routes[zone][0]);yaw=-.5;pitch=.03;$('#walk-panel').hidden=false;$('#walk-launcher').hidden=true;$('#walk-zone-title').textContent=zone==='pool'?'Pool terrace':'Courtyard';$$('[data-walk-zone]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.walkZone===zone)));canvas.focus();announce('Drag to look. Use WASD or the movement buttons to walk.');invalidate();}
 function exit(){active=false;tour=false;keys.clear();stopRecording();$('#walk-panel').hidden=true;$('#walk-launcher').hidden=false;$('#guided-tour').setAttribute('aria-pressed','false');$('#tour-progress').hidden=true;controls.enabled=true;onExit();}
 $('#exit-walk').onclick=exit;$$('[data-walk-zone]').forEach(b=>b.onclick=()=>enter(b.dataset.walkZone));
 $$('[data-move]').forEach(b=>{const stop=()=>{keys.delete(b.dataset.move);b.setAttribute('aria-pressed','false');};b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);b.setAttribute('aria-pressed','true');tour=false;};b.onpointerup=b.onpointercancel=stop;});
 const keydown=e=>{if(!active)return;if(e.key==='Escape'){exit();return;}const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.add(k);tour=false;}};
 const keyup=e=>keys.delete(e.key.toLowerCase()),blur=()=>keys.clear();addEventListener('keydown',keydown);addEventListener('keyup',keyup);addEventListener('blur',blur);
 canvas.addEventListener('pointerdown',e=>{if(active){drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);tour=false;}});
 canvas.addEventListener('pointermove',e=>{if(!active||!drag)return;yaw-=(e.clientX-drag[0])*.004;pitch=T.MathUtils.clamp(pitch-(e.clientY-drag[1])*.004,-1.1,1.1);drag=[e.clientX,e.clientY];});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 $('#guided-tour').onclick=()=>{tour=!tour;tourTime=0;$('#guided-tour').setAttribute('aria-pressed',String(tour));$('#tour-progress').hidden=!tour;};
 $('#record-tour').onclick=()=>{
  if(recorder?.state==='recording'){stopRecording();return;}
  if(!canvas.captureStream||typeof MediaRecorder==='undefined'){announce('Tour recording is unavailable in this browser.');return;}
  const stream=canvas.captureStream(24),chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(clipUrl)URL.revokeObjectURL(clipUrl);clipUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));$('#download-tour').href=clipUrl;$('#download-tour').download='venus-skky-city-tour.webm';$('#download-tour').hidden=false;$('#clip-status').textContent='Your recorded tour is ready.';};recorder.start();$('#record-tour').setAttribute('aria-pressed','true');announce('Recording your walkthrough. Press Record tour again to save.');
 };
 return {enter,exit,get active(){return active;},update(dt){if(!active)return false;
  if(tour){tourTime+=dt;const route=routes[zone],u=Math.min(1,tourTime/35)*(route.length-1),i=Math.min(route.length-2,Math.floor(u)),t=u-i,a=new T.Vector3(...route[i]),b=new T.Vector3(...route[i+1]);camera.position.lerpVectors(a,b,t);camera.lookAt(b.clone().add(new T.Vector3(0,.4,-3)));$('#tour-progress').value=Math.min(100,tourTime/35*100);if(tourTime>=35){tour=false;$('#guided-tour').setAttribute('aria-pressed','false');}return true;}
  const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),speed=6*dt,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;
  if(canWalk(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(canWalk(camera.position.x,camera.position.z+dz))camera.position.z+=dz;camera.lookAt(camera.position.clone().add(new T.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))));return true;},dispose(){stopRecording();if(clipUrl)URL.revokeObjectURL(clipUrl);removeEventListener('keydown',keydown);removeEventListener('keyup',keyup);removeEventListener('blur',blur);}};
}
