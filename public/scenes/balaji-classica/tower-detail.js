import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {elevationFloorAt} from './interaction-performance.js?v=balaji-2';
import {createFacadeCuller} from './facade-performance.js?v=balaji-2';
import {towerSpecs} from './model.js?v=local-refinement-3';
import {LIGHTING} from './lighting.js?v=local-refinement-3';

export function createTowerDetail({towers,snapshot,openPlan,lighting,getEnvironment}){
  const dialog=document.createElement('dialog');dialog.id='tower-detail';
  dialog.setAttribute('aria-label','Selected building and floor levels');
  dialog.innerHTML=`<img class="detail-backdrop" alt=""><div class="detail-glass"></div><header><button id="detail-back">← All buildings</button><select aria-label="Choose a building"></select><span>ARCHITECTURAL EXPLORER</span></header><section class="detail-copy"><p class="eyebrow">BALAJI CLASSICA</p><h2></h2><span class="detail-rule"></span><p>Select a level to explore<br>the floor plan.</p><strong id="detail-level"></strong><small id="detail-note"></small></section><div class="detail-stage"><div id="detail-canvas"></div><div id="detail-open" hidden><span></span><button></button></div></div><nav class="detail-rail" aria-label="Building levels"><span>LEVELS</span><div></div></nav><p class="detail-hint">Hover over the building to select a level · Click Open level to view the plan</p>`;
  document.body.append(dialog);
  const $=s=>dialog.querySelector(s),select=$('select'),host=$('#detail-canvas'),rail=$('.detail-rail div'),indicator=$('#detail-open');
  for(const s of towerSpecs)select.add(new Option(s.name,s.id));
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,600);
  const hemi=new T.HemisphereLight(0xecf2f6,0x70766a,1.45),sun=new T.DirectionalLight(0xffebcd,2.1);sun.position.set(-50,120,160);scene.add(hemi,sun);
  sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);sun.target.position.set(0,38,0);scene.add(sun.target);Object.assign(sun.shadow.camera,{left:-55,right:55,top:45,bottom:-45,near:.1,far:400});sun.shadow.bias=-.00002;sun.shadow.normalBias=.015;sun.shadow.radius=3;sun.shadow.blurSamples=8;
  let renderer=null,model=null,spec=null,frame=0,hovered=null,start=null,cull=null;
  const active={value:0},bounds={value:new T.Vector2()},ray=new T.Raycaster();
  const observer=new ResizeObserver(()=>{if(dialog.open)resize();});observer.observe(host);
  function draw(){if(!dialog.open||!renderer||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(!dialog.open||!renderer)return;const shadowsPending=renderer.shadowMap.needsUpdate;cull?.(camera,shadowsPending);renderer.render(scene,camera);if(shadowsPending)draw();});}
  function resize(){if(!renderer||!model)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
    const height=Math.max(size.y*1.06,size.x/(w/h)*1.13),width=height*w/h;camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.position.set(center.x,center.y,250);camera.lookAt(center);camera.updateProjectionMatrix();draw();if(hovered!==null)preview(hovered);
  }
  function floorAt(event){if(!model)return null;const r=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1),camera);return elevationFloorAt(ray,spec);}
  function preview(n){if(hovered===n)return;hovered=n;active.value=n===null?0:1;indicator.hidden=n===null;
    for(const b of rail.children)b.setAttribute('aria-current',String(Number(b.dataset.floor)===n));
    if(n===null){$('#detail-level').textContent='';draw();return;}
    const low=n===0?0:5+(n-1)*3.1;bounds.value.set(low,n===0?5:low+3.1);
    const point=new T.Vector3(0,(bounds.value.x+bounds.value.y)/2,0).project(camera);
    indicator.style.top=((1-point.y)/2*host.clientHeight)+'px';indicator.querySelector('span').textContent=n===0?'G':String(n).padStart(2,'0');indicator.querySelector('button').textContent=n===0?'OPEN GROUND FLOOR':'OPEN LEVEL '+String(n).padStart(2,'0');
    $('#detail-level').textContent=n===0?'GROUND FLOOR':'LEVEL '+String(n).padStart(2,'0');draw();
  }
  function clear(release=false){cancelAnimationFrame(frame);frame=0;cull=null;if(model){model.traverse(o=>{if(o.isMesh)o.material.dispose();});scene.remove(model);model=null;}if(release&&renderer){renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();renderer=null;}}
  function open(id){const original=towers.find(t=>t.userData.id===id);if(!original)return;
    if(!dialog.open){$('.detail-backdrop').src=snapshot();dialog.showModal();document.dispatchEvent(new CustomEvent('tower-detail-state',{detail:{open:true}}));}
    clear();hovered=undefined;spec=towerSpecs.find(s=>s.id===id);select.value=id;$('.detail-copy h2').textContent=spec.name;$('#detail-note').textContent=spec.note;
    const mode=lighting.name,preset=LIGHTING[mode];hemi.intensity=preset.ambient;hemi.color.set(mode==='evening'?0xcbd8ed:0xecf2f6);sun.intensity=preset.sunPower;sun.color.set(preset.color);
    const environment=getEnvironment?.();if(environment){scene.environment=environment.texture;scene.environmentIntensity=environment.intensity;}
    if(!renderer){renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=T.AgXToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;renderer.shadowMap.autoUpdate=false;host.append(renderer.domElement);}renderer.toneMappingExposure=preset.exposure;renderer.shadowMap.needsUpdate=true;
    renderer.domElement.setAttribute('aria-label',spec.name+' — front elevation; hover to select a floor');
    model=original.clone(true);for(const child of [...model.children]){if(child.userData.renderTier==='motion')model.remove(child);else child.visible=true;}model.position.set(0,0,0);model.rotation.set(0,spec.detailYaw||0,0);
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
    });scene.add(model);model.updateMatrixWorld(true);cull=createFacadeCuller(model);rail.replaceChildren();
    for(let n=spec.floors;n>=0;n--){const b=document.createElement('button');b.dataset.floor=n;b.textContent=n===0?'G':String(n).padStart(2,'0');b.setAttribute('aria-label','Open floor '+n);b.onpointerenter=()=>preview(n);b.onfocus=()=>preview(n);b.onclick=()=>openPlan(spec.id,n);rail.append(b);}
    renderer.domElement.onpointermove=e=>{const n=floorAt(e);if(n!==null)preview(n);};
    // Keep the selected floor while the pointer crosses from canvas to its CTA.
    $('.detail-stage').onpointerleave=()=>preview(null);
    renderer.domElement.onpointerdown=e=>start=[e.clientX,e.clientY];renderer.domElement.onpointerup=e=>{if(start&&Math.hypot(e.clientX-start[0],e.clientY-start[1])<5){const floor=floorAt(e);if(floor!==null)openPlan(spec.id,floor);}};
    preview(null);resize();$('.detail-stage').animate([{opacity:0,transform:'translateY(25px) scale(.95)'},{opacity:1,transform:'none'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:650,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
  indicator.querySelector('button').onclick=()=>{if(hovered!==null)openPlan(spec.id,hovered);};select.onchange=()=>open(select.value);$('#detail-back').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{clear(true);document.dispatchEvent(new CustomEvent('tower-detail-state',{detail:{open:false}}));});
  return {open};
}
