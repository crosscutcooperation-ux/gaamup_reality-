/** A demonstration pointer tracks actual architecture; it never activates a view by itself. */
import * as T from './vendor/three.module.js';
export const GUIDE_HAND='<svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M12 17V5a3 3 0 0 1 6 0v9l2-1 4 3 3 3v7c0 5-4 8-8 8h-2c-3 0-5-2-7-5L4 20c-2-3 2-5 4-3l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="#f6f4f1"/></svg>';
export function createSceneGuidance({camera,towers,host,focusTower}){
  const point=new T.Vector3(),guide=document.createElement('button');guide.type='button';guide.className='architecture-guide';
  guide.innerHTML='<span class="guide-touch">'+GUIDE_HAND+'</span><span class="guide-label"><small>START HERE</small><strong>Choose a building</strong><span>Tap to explore floors & homes</span></span>';
  host.append(guide);
  const names=['Castle','Spring','Breeze'],targets=names.map(name=>towers.find(t=>t.userData.name===name)).filter(Boolean);
  let completed=false,current=null,started=null;
  guide.onclick=()=>{if(current){completed=true;guide.hidden=true;focusTower(current.userData.towerId);}};
  const stop=()=>{completed=true;guide.hidden=true;};
  document.addEventListener('tower-focus',stop);document.addEventListener('open-block-floor',stop);
  const repeat=document.getElementById('show-scene-help');
  if(repeat)repeat.onclick=()=>{completed=false;started=null;guide.hidden=false;};
  // The same pointer language makes the next two decisions discoverable.
  const floorHint=document.createElement('span');floorHint.className='level-guide';floorHint.innerHTML=GUIDE_HAND+'<span>Choose a floor</span>';
  document.getElementById('elevation-stage')?.append(floorHint);
  const unitHint=document.createElement('span');unitHint.className='unit-guide';unitHint.innerHTML=GUIDE_HAND+'<span>Tap a coloured home</span>';
  document.getElementById('plan-2d')?.append(unitHint);
  return {
    update(now,visible){
      if(!visible||completed||!targets.length){guide.hidden=true;return;}
      started??=now;
      current=targets[Math.floor((now-started)/6200)%targets.length];
      current.getWorldPosition(point);point.y+=55;point.project(camera);
      const width=host.clientWidth,height=host.clientHeight,x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;
      guide.hidden=point.z< -1||point.z>1||x<70||x>width-70||y<100||y>height-180;
      if(!guide.hidden){guide.style.left=x+'px';guide.style.top=y+'px';guide.querySelector('strong').textContent='Explore '+current.userData.name;guide.setAttribute('aria-label','Explore '+current.userData.name+' building, then choose a floor and apartment');}
    },
    dispose(){document.removeEventListener('tower-focus',stop);document.removeEventListener('open-block-floor',stop);guide.remove();floorHint.remove();unitHint.remove();if(repeat)repeat.onclick=null;},
  };
}
