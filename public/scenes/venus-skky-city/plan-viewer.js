import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {RGBELoader} from '../sai-world-dreams/vendor/addons/loaders/RGBELoader.js';
import {APARTMENT_LIGHTING,frameApartmentLights} from '../sai-world-dreams/apartment-lighting.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {buildApartment} from './apartments.js';
import {materials as siteMaterials} from './model.js';
const sharedMaterials=new Set(Object.values(siteMaterials));

const fetchJson=async url=>{const r=await fetch(url);if(!r.ok)throw Error('Unable to load '+url);return r.json();};

function polygonGeometry(points,width,height,scale){
 const shape=new T.Shape();points.forEach(([x,y],i)=>{const px=(x-width/2)*scale,pz=(height/2-y)*scale;i?shape.lineTo(px,pz):shape.moveTo(px,pz);});shape.closePath();
 const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=[];
 for(let i=0;i<p.count;i++)uv.push(p.getX(i)/(width*scale)+.5,.5-p.getZ(i)/(height*scale));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;
}
export async function makePlanModel(data,{texture=true,height=1.15}={}){
 const group=new T.Group();group.name='Selected plan wall cutaway';group.userData={accuracy:'Raised wall trace of the selected source drawing. Heights, scale and core slabs are approximate.'};
 const floorMaterial=new T.MeshStandardMaterial({color:0xe9e1ce,roughness:.92,side:T.DoubleSide});
 if(texture){const tex=await new T.TextureLoader().loadAsync(data.image);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;floorMaterial.map=tex;floorMaterial.color.set(0xffffff);}
 const floor=new T.Mesh(polygonGeometry(data.footprint,data.width,data.height,data.scale),floorMaterial);floor.name='Original plan floor';floor.receiveShadow=true;group.add(floor);
 const wallMaterial=new T.MeshStandardMaterial({color:0xf1efe5,roughness:.83});const pieces=[];
 for(const [x1,y1,x2,y2] of data.walls){
  const w=Math.max(.10,Math.abs(x2-x1)*data.scale),d=Math.max(.10,Math.abs(y2-y1)*data.scale);
  const g=new T.BoxGeometry(w,height,d);g.translate(((x1+x2)/2-data.width/2)*data.scale,height/2,((y1+y2)/2-data.height/2)*data.scale);pieces.push(g);
 }
 if(pieces.length){const mesh=new T.Mesh(mergeGeometries(pieces),wallMaterial);mesh.name='Raised architectural walls';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);pieces.forEach(g=>g.dispose());}
 return group;
}

export class PlanViewer{
 constructor(host,{pick,rotate}={}){
  this.host=host;this.onPick=pick;this.onRotate=rotate;this.revision=0;this.active=false;this.rotating=false;this.dirty=true;
  this.scene=new T.Scene();this.scene.background=new T.Color('#f8f9f5');
  this.camera=new T.PerspectiveCamera(38,1,.03,1500);this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=APARTMENT_LIGHTING.exposure;host.appendChild(this.renderer.domElement);
  this.renderer.domElement.setAttribute('aria-label','3D cutaway of the selected floor drawing');this.renderer.domElement.setAttribute('role','img');
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.maxPolarAngle=Math.PI*.485;this.controls.autoRotateSpeed=1;this.controls.addEventListener('change',()=>this.dirty=true);
  this.scene.add(new T.HemisphereLight(0xfff4df,0x74869a,APARTMENT_LIGHTING.hemisphere));
  this.sun=new T.DirectionalLight(0xffedcd,APARTMENT_LIGHTING.key);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);
  this.fill=new T.DirectionalLight(0xd8e7ff,APARTMENT_LIGHTING.fill);this.rim=new T.DirectionalLight(0xffe6ca,APARTMENT_LIGHTING.rim);
  this.scene.add(this.sun,this.sun.target,this.fill,this.fill.target,this.rim,this.rim.target);
  this.environmentPromise=new RGBELoader().loadAsync('../sai-world-dreams/assets/environment.hdr').then(texture=>{const pmrem=new T.PMREMGenerator(this.renderer),env=pmrem.fromEquirectangular(texture);this.environment=env;this.scene.environment=env.texture;this.scene.environmentIntensity=APARTMENT_LIGHTING.environment;texture.dispose();pmrem.dispose();this.dirty=true;}).catch(()=>{});
  let start;this.renderer.domElement.addEventListener('pointerdown',e=>start=[e.clientX,e.clientY]);
  this.renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(start[0]-e.clientX,start[1]-e.clientY)>5)return;const r=this.renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);const hits=ray.intersectObject(this.model||new T.Group(),true);let picked=null;for(const hit of hits){let o=hit.object;while(o&&o!==this.model&&!o.userData.flat)o=o.parent;if(o?.userData.flat){picked=o.userData.flat;break;}}if(picked&&this.wholeFloor)this.onPick?.(picked);else if(!this.rotating)this.onRotate?.();});
  new ResizeObserver(()=>this.resize()).observe(host);
 }
 dispose(object){const mats=new Set(),textures=new Set();object?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});for(const m of mats){if(sharedMaterials.has(m))continue;for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();}for(const t of textures)t.dispose();}
 clear(){if(this.model){this.scene.remove(this.model);this.dispose(this.model);this.model=null;}}
 async loadModel(url){
  const revision=++this.revision;const asset=await new GLTFLoader().loadAsync(url);if(revision!==this.revision){this.dispose(asset.scene);return false;}
  asset.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])for(const texture of Object.values(m))if(texture?.isTexture)texture.anisotropy=4;}});
  this.clear();this.model=asset.scene;this.wholeFloor=false;this.scene.add(this.model);this.renderer.domElement.setAttribute('aria-label','Complete furnished apartment, rotate and zoom to explore');this.reset();this.dirty=true;return true;
 }
 async load(layout,unit=null){
  const rev=++this.revision;const root=new T.Group();root.name=unit?`Flat ${unit.flat} source cutaway`:`${layout.name} typical floor cutaway`;
  this.wholeFloor=!unit;
  try{
   const selected=unit?[unit]:layout.units;
   const built=await Promise.all(selected.map(async u=>{const d=await fetchJson(u.data),g=u.sample?buildApartment(d,{textured:false}).root:await makePlanModel(d);g.userData.flat=u.id;g.name=`Flat ${u.flat} · ${u.beds} bed`;
    if(!unit)g.position.set((u.origin[0]+d.width/2-layout.width/2)*layout.scale,0,(u.origin[1]+d.height/2-layout.height/2)*layout.scale);
    return g;}));root.add(...built);
   if(!unit){const mat=new T.MeshStandardMaterial({color:0xb6bbb1,roughness:.9,side:T.DoubleSide});for(const p of layout.corridors||[]){const m=new T.Mesh(polygonGeometry(p,layout.width,layout.height,layout.scale),mat);m.position.y=-.02;m.receiveShadow=true;root.add(m);}}
   if(rev!==this.revision){this.dispose(root);return false;}this.clear();this.model=root;this.scene.add(root);this.reset();this.dirty=true;return true;
  }catch(e){this.dispose(root);throw e;}
 }
 reset(){if(!this.model)return;const box=new T.Box3().setFromObject(this.model),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());this.controls.target.copy(center);frameApartmentLights({key:this.sun,fill:this.fill,rim:this.rim,span:Math.max(size.x,size.z,size.y,3),center});this.resize();const extent=Math.max(size.x,size.z,3),direction=new T.Vector3(.85,1.65,1).normalize(),right=new T.Vector3(direction.z,0,-direction.x).normalize(),up=direction.clone().cross(right).normalize(),tanY=Math.tan(T.MathUtils.degToRad(this.camera.fov/2)),tanX=tanY*this.camera.aspect;let distance=1;
  this.model.updateMatrixWorld(true);const offset=new T.Vector3();this.model.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){offset.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).sub(center);distance=Math.max(distance,offset.dot(direction)+Math.max(Math.abs(offset.dot(right))/(tanX*.86),Math.abs(offset.dot(up))/(tanY*.86)));}});
  this.camera.position.copy(center).addScaledVector(direction,distance);this.controls.minDistance=Math.max(.7,extent*.12);this.controls.maxDistance=extent*8;this.controls.update();this.renderer.shadowMap.needsUpdate=true;this.dirty=true;}
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.dirty=true;}
 setMode(mode){this.rotating=mode==='rotate';this.controls.enableRotate=this.rotating;this.controls.enablePan=this.rotating;this.controls.autoRotate=this.rotating&&!matchMedia('(prefers-reduced-motion: reduce)').matches;this.dirty=true;}
 setActive(value){this.active=value;if(value){this.resize();this.dirty=true;if(!this.frame)this.tick();}else{cancelAnimationFrame(this.frame);this.frame=null;}}
 tick(now=performance.now()){if(!this.active){this.frame=null;return;}this.frame=requestAnimationFrame(time=>this.tick(time));const dt=Math.min(.05,(now-(this.lastTick||now-16))/1000);this.lastTick=now;const changed=this.controls.update(dt);if(now-(this.lastRender||0)<1000/30)return;if(this.dirty||changed||this.controls.autoRotate){this.renderer.render(this.scene,this.camera);this.lastRender=now;this.dirty=false;}}
 zoom(factor){this.camera.position.sub(this.controls.target).multiplyScalar(factor).add(this.controls.target);this.controls.update();this.dirty=true;}
 toggleSpin(){this.controls.autoRotate=!this.controls.autoRotate;return this.controls.autoRotate;}
 async download(name){if(!this.model)return;const {GLTFExporter}=await import('./vendor/GLTFExporter.js');const result=await new GLTFExporter().parseAsync(this.model,{binary:true});const url=URL.createObjectURL(new Blob([result],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download=name+'.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
