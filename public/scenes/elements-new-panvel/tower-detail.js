import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {towerSpecs} from './model.js?v=daylight-1';

export function createTowerDetail({towers,snapshot,openPlan,lighting,getEnvironment}){
  const dialog=document.createElement('dialog');dialog.id='tower-detail';
  dialog.setAttribute('aria-label','Selected building and floor levels');
  dialog.innerHTML=`<img class="detail-backdrop" alt=""><div class="detail-glass"></div><header><button id="detail-back"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 12H5m6-6-6 6 6 6"/></svg><span>All buildings</span></button><select aria-label="Choose a building"></select><span>ARCHITECTURAL EXPLORER</span></header><section class="detail-copy"><p class="eyebrow">ELEMENTS</p><h2></h2><span class="detail-rule"></span><p>Select a level to explore<br>the floor plan.</p><strong id="detail-level"></strong><small id="detail-note"></small></section><div class="detail-stage"><div id="detail-canvas"></div><div id="detail-open" hidden><span></span><button></button></div></div><nav class="detail-rail" aria-label="Building levels"><span>LEVELS</span><div></div></nav><p class="detail-hint">Drag to rotate the 3D building · Click a floor or level number to open the plan</p>`;
  document.body.append(dialog);
  const $=s=>dialog.querySelector(s),select=$('select'),host=$('#detail-canvas'),rail=$('.detail-rail div'),indicator=$('#detail-open');
  for(const s of towerSpecs)select.add(new Option(s.name,s.id));
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,600);
  const hemi=new T.HemisphereLight(0xecf2f6,0x70766a,1.45),sun=new T.DirectionalLight(0xffebcd,2.1);sun.position.set(-50,120,160);scene.add(hemi,sun);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.target.position.set(0,52,0);scene.add(sun.target);Object.assign(sun.shadow.camera,{left:-85,right:85,top:85,bottom:-85,near:.1,far:400});sun.shadow.bias=-.00002;sun.shadow.normalBias=.015;
  let renderer=null,model=null,spec=null,frame=0,hovered=null,start=null,cull=null,yaw=.48,pitch=.08,dragged=false,pickBox=null;
  const active={value:0},bounds={value:new T.Vector2()},ray=new T.Raycaster();
  const observer=new ResizeObserver(()=>{if(dialog.open)resize();});observer.observe(host);
  function draw(){if(!dialog.open||!renderer||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(!dialog.open||!renderer)return;const shadowsPending=renderer.shadowMap.needsUpdate;renderer.render(scene,camera);if(shadowsPending)draw();});}
  function resize(){if(!renderer||!model)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
    const height=Math.max(size.y*1.08,Math.max(size.x,size.z)/(w/h)*1.18),width=height*w/h;camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.position.copy(center).add(new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(250));camera.lookAt(center);camera.updateProjectionMatrix();draw();if(hovered!==null){const current=hovered;hovered=undefined;preview(current);}
  }
  function floorAt(event){if(!model)return null;const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1),camera);const point=pickBox&&ray.ray.intersectBox(pickBox,new T.Vector3());if(!point)return null;return Math.max(0,Math.min(spec.floors,Math.floor((point.y-6.8)/3.05)+1));}
  function preview(n){if(hovered===n)return;hovered=n;active.value=n===null?0:1;indicator.hidden=n===null;
    for(const b of rail.children)b.setAttribute('aria-current',String(Number(b.dataset.floor)===n));
    if(n===null){$('#detail-level').textContent='';draw();return;}
    const low=n===0?0:6.8+(n-1)*3.05;bounds.value.set(low,n===0?6.8:low+3.05);
    const point=new T.Vector3(0,(bounds.value.x+bounds.value.y)/2,0).project(camera);
    indicator.style.top=((1-point.y)/2*host.clientHeight)+'px';indicator.querySelector('span').textContent=n===0?'G':String(n).padStart(2,'0');indicator.querySelector('button').textContent=n===0?'OPEN GROUND FLOOR':'OPEN LEVEL '+String(n).padStart(2,'0');
    $('#detail-level').textContent=n===0?'GROUND FLOOR':'LEVEL '+String(n).padStart(2,'0');draw();
  }
  function clear(release=false){cancelAnimationFrame(frame);frame=0;cull=null;if(model){model.traverse(o=>{if(o.isMesh)o.material.dispose();});scene.remove(model);model=null;}if(release&&renderer){renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();renderer=null;}}
  function open(id){const original=towers.find(t=>t.userData.id===id);if(!original)return;
    if(!dialog.open){$('.detail-backdrop').src=snapshot();dialog.showModal();document.dispatchEvent(new CustomEvent('tower-detail-state',{detail:{open:true}}));}
    clear();hovered=undefined;yaw=.48;pitch=.08;dragged=false;spec=towerSpecs.find(s=>s.id===id);select.value=id;$('.detail-copy h2').textContent=spec.name;$('#detail-note').textContent=spec.note;
    const mode=lighting.name;dialog.dataset.lighting=mode;hemi.intensity=mode==='night'?.25:.65;hemi.color.set(mode==='evening'?0xcbd8ed:0xecf2f6);sun.intensity=mode==='night'?.35:mode==='evening'?1.95:2.4;sun.color.set(mode==='night'?0x92b7ef:mode==='evening'?0xffd1b2:0xffebcd);
    const environment=getEnvironment?.();if(environment){scene.environment=environment.texture;scene.environmentIntensity=environment.intensity;}
    if(!renderer){renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.NeutralToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;host.append(renderer.domElement);}renderer.toneMappingExposure=mode==='night'?.96:1;renderer.shadowMap.needsUpdate=true;
    renderer.domElement.setAttribute('aria-label',spec.name+' — 3D tower; drag to rotate and click a floor');
    model=original.clone(true);for(const child of [...model.children]){if(child.userData.renderTier==='motion')model.remove(child);else child.visible=true;}model.position.set(0,0,0);model.rotation.set(0,0,0);
    model.traverse(o=>{if(!o.isMesh)return;const source=o.material;o.material=source.clone();const m=o.material;
      m.onBeforeCompile=(shader,r)=>{source.onBeforeCompile.call(m,shader,r);shader.uniforms.floorActive=active;shader.uniforms.floorBounds=bounds;
        shader.vertexShader='varying float buildingY;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
          vec4 floorPosition=vec4(transformed,1.);
          #ifdef USE_INSTANCING
            floorPosition=instanceMatrix*floorPosition;
          #endif
          buildingY=(modelMatrix*floorPosition).y;`);
        shader.fragmentShader='varying float buildingY;uniform float floorActive;uniform vec2 floorBounds;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float band=step(floorBounds.x,buildingY)*step(buildingY,floorBounds.y);
          outgoingLight*=mix(1.,.4,floorActive*(1.-band));outgoingLight+=vec3(.24)*band*floorActive;
          #include <opaque_fragment>`);
      };m.customProgramCacheKey=()=>source.customProgramCacheKey()+'|venus-floor-highlight-v1';
    });scene.add(model);model.updateMatrixWorld(true);pickBox=new T.Box3().setFromObject(model);rail.replaceChildren();
    for(let n=spec.floors;n>=0;n--){const b=document.createElement('button');b.dataset.floor=n;b.textContent=n===0?'G':String(n).padStart(2,'0');b.setAttribute('aria-label','Open floor '+n);b.onpointerenter=()=>preview(n);b.onfocus=()=>preview(n);b.onclick=()=>openPlan(spec.id,n);rail.append(b);}
    renderer.domElement.onpointermove=e=>{if(start&&e.buttons){const dx=e.clientX-start[0],dy=e.clientY-start[1];if(Math.abs(dx)+Math.abs(dy)>3)dragged=true;if(dragged){yaw+=dx*.006;pitch=T.MathUtils.clamp(pitch+dy*.004,-.24,.35);start=[e.clientX,e.clientY];resize();return;}}const n=floorAt(e);if(n!==null)preview(n);};
    // Keep the selected floor while the pointer crosses from canvas to its CTA.
    $('.detail-stage').onpointerleave=()=>preview(null);
    renderer.domElement.onpointerdown=e=>{start=[e.clientX,e.clientY];dragged=false;renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointerup=e=>{if(!dragged){const floor=floorAt(e);if(floor!==null)openPlan(spec.id,floor);}start=null;};
    preview(null);resize();$('.detail-stage').animate([{opacity:0,transform:'translateY(25px) scale(.95)'},{opacity:1,transform:'none'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:650,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
  indicator.querySelector('button').onclick=()=>{if(hovered!==null)openPlan(spec.id,hovered);};select.onchange=()=>open(select.value);$('#detail-back').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{clear(true);document.dispatchEvent(new CustomEvent('tower-detail-state',{detail:{open:false}}));});
  return {open};
}
