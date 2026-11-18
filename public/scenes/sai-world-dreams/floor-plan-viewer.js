import {APARTMENT_LIGHTING,frameApartmentLights} from './apartment-lighting.js';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {SSAOPass} from './vendor/addons/postprocessing/SSAOPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';
import {RGBELoader} from './vendor/addons/loaders/RGBELoader.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';

export class FloorPlanViewer {
  constructor(host,onTap=null){
    this.host=host;
    this.scene=new T.Scene();this.scene.background=new T.Color(0xf8f7f3);
    this.camera=new T.PerspectiveCamera(38,1,.01,500);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    let pointerStart=null;
    this.renderer.domElement.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
    this.renderer.domElement.addEventListener('pointerup',e=>{
      if(pointerStart&&Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])<4)onTap?.();
      pointerStart=null;
    });
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=APARTMENT_LIGHTING.exposure;
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.ao=new SSAOPass(this.scene,this.camera,400,400,12);this.ao.kernelRadius=APARTMENT_LIGHTING.aoRadius;this.ao.minDistance=.001;this.ao.maxDistance=.18;this.composer.addPass(this.ao);this.composer.addPass(new OutputPass());
    this.host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','Rotatable 3D cutaway of the selected floor plan');
    this.renderer.domElement.setAttribute('role','img');
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.maxPolarAngle=Math.PI/2-.08;this.controls.minDistance=12;this.controls.maxDistance=150;
    this.controls.addEventListener('change',()=>this.draw());
    this.controls.addEventListener('start',()=>this.finishPopUp());
    this.scene.add(new T.HemisphereLight(0xfff9ee,0x706c60,APARTMENT_LIGHTING.hemisphere));
    this.key=new T.DirectionalLight(0xffefd6,APARTMENT_LIGHTING.key);this.key.castShadow=true;this.key.shadow.mapSize.set(2048,2048);
    this.fill=new T.DirectionalLight(0xd9e6f2,APARTMENT_LIGHTING.fill);
    this.rim=new T.DirectionalLight(0xffffff,APARTMENT_LIGHTING.rim);
    this.scene.add(this.key,this.fill,this.rim,this.key.target,this.fill.target,this.rim.target);
    frameApartmentLights({key:this.key,fill:this.fill,rim:this.rim,span:35,center:new T.Vector3()});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
    this.revision=0;this.active=true;
    this.environmentLoading=new RGBELoader().loadAsync('assets/environment.hdr').then(texture=>{
      if(this.disposed){texture.dispose();return;}
      const pmrem=new T.PMREMGenerator(this.renderer);this.environment=pmrem.fromEquirectangular(texture);
      this.scene.environment=this.environment.texture;this.scene.environmentIntensity=APARTMENT_LIGHTING.environment;
      texture.dispose();pmrem.dispose();this.draw();
    }).catch(()=>{});
  }
  resize(){
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.composer.setSize(w,h);this.ao.setSize(Math.ceil(w*.65),Math.ceil(h*.65));this.draw();
  }
  clear(){
    this.finishPopUp(false);
    if(!this.floor)return;
    this.scene.remove(this.floor);
    this.disposeModel(this.floor);this.floor=null;
  }
  disposeModel(model){
    const textures=new Set(),materials=new Set();
    model.traverse(mesh=>{if(!mesh.isMesh)return;mesh.geometry.dispose();for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material]))materials.add(material);});
    for(const material of materials){for(const value of Object.values(material))if(value?.isTexture&&!value.userData.sharedFinish)textures.add(value);material.dispose();}
    for(const texture of textures)texture.dispose();
  }
  async loadModel(url){
    const revision=++this.revision;
    const {scene:model}=await new GLTFLoader().loadAsync(url);
    if(revision!==this.revision){this.disposeModel(model);return;}
    this.clear();this.furnishedModel=true;
    model.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3());
    model.traverse(object=>{
      if(!object.isMesh)return;
      object.castShadow=true;object.receiveShadow=true;
      for(const material of (Array.isArray(object.material)?object.material:[object.material])){
        material.toneMapped=true;
        for(const value of Object.values(material))if(value?.isTexture){
          value.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
        }
      }
    });
    // Keep the imported apartment hierarchy and its authored furniture intact.
    model.position.set(-center.x,0,-center.z);
    this.floor=model;this.scene.add(model);
    const size=bounds.getSize(new T.Vector3());
    frameApartmentLights({key:this.key,fill:this.fill,rim:this.rim,span:Math.max(size.x,size.z),center:new T.Vector3(0,center.y,0)});
    const ground=new T.Mesh(new T.PlaneGeometry(size.x*8,size.z*8),new T.MeshStandardMaterial({color:0xf8f7f3,roughness:1}));
    ground.rotation.x=-Math.PI/2;ground.position.set(center.x,bounds.min.y-.01,center.z);
    ground.receiveShadow=true;model.add(ground);
    this.corners=[];
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      this.corners.push(new T.Vector3(x-center.x,y,z-center.z));
    }
    this.controls.minDistance=2;
    this.renderer.domElement.setAttribute('aria-label','Furnished 3D apartment with raised walls, beds, sofas, cabinets and fittings. Drag to orbit, scroll to zoom.');
    this.resize();this.reset();
    this.draw();
  }
  startPopUp(layers){
    if(!this.active||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    this.popupLayers=layers;
    const start=performance.now();
    const frame=now=>{
      let complete=true;
      for(const layer of layers){
        const t=T.MathUtils.clamp((now-start-layer.delay)/1000,0,1);
        layer.object.scale.y=Math.max(.001,t*t*(3-2*t));
        if(t<1)complete=false;
      }
      this.draw();
      if(complete){this.popupFrame=null;this.popupLayers=null;}
      else this.popupFrame=requestAnimationFrame(frame);
    };
    frame(start);
  }
  finishPopUp(render=true){
    if(this.popupFrame)cancelAnimationFrame(this.popupFrame);
    this.popupFrame=null;
    for(const layer of this.popupLayers??[])layer.object.scale.y=1;
    this.popupLayers=null;
    if(render)this.draw();
  }
  async load(key){
    this.furnishedModel=false;this.controls.minDistance=12;
    this.renderer.domElement.setAttribute('aria-label','Rotatable 3D floor plan');
    const revision=++this.revision;
    const [response,texture]=await Promise.all([fetch('assets/plans/'+key+'.json?v=floors-4'),new T.TextureLoader().loadAsync('assets/plans/'+key+'-floor.png?v=floors-4')]);
    if(!response.ok){texture.dispose();throw new Error('The 3D floor data could not be loaded.');}
    const data=await response.json();
    if(revision!==this.revision){texture.dispose();return;}
    this.clear();texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
    const floor=new T.Group(),scale=48/Math.max(data.width,data.height);
    const point=([x,y])=>[(x-data.width/2)*scale,(data.height/2-y)*scale];
    function outline(points){const shape=new T.Shape();points.forEach((p,i)=>shape[i===0?'moveTo':'lineTo'](...point(p)));shape.closePath();return shape;}
    const bases=data.footprint.map(points=>outline(points));
    const slabGeometry=new T.ExtrudeGeometry(bases,{depth:.2,bevelEnabled:false});slabGeometry.rotateX(-Math.PI/2);
    const slab=new T.Mesh(slabGeometry,new T.MeshStandardMaterial({color:0xc6c3b6,roughness:.9}));slab.position.y=-.2;floor.add(slab);
    const drawing=new T.Mesh(new T.PlaneGeometry(data.width*scale,data.height*scale),new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.5,roughness:.92,metalness:0}));
    drawing.rotation.x=-Math.PI/2;drawing.position.y=.012;floor.add(drawing);
    const pieces=data.walls.map(ring=>{
      const shape=outline(ring.outer);
      for(const points of ring.holes){const hole=new T.Path();points.forEach((p,i)=>hole[i===0?'moveTo':'lineTo'](...point(p)));hole.closePath();shape.holes.push(hole);}
      const geometry=new T.ExtrudeGeometry(shape,{depth:1.05,bevelEnabled:false});geometry.rotateX(-Math.PI/2);return geometry;
    });
    const geometry=mergeGeometries(pieces,false);pieces.forEach(piece=>piece.dispose());
    if(geometry)floor.add(new T.Mesh(geometry,new T.MeshStandardMaterial({color:0x788997,roughness:.82})));

    // Bed positions and sizes follow the bedroom finishes in the supplied drawing.
    const oak=new T.MeshStandardMaterial({color:0x80664c,roughness:.7});
    const linen=new T.MeshStandardMaterial({color:0xf3eee3,roughness:.98});
    const blue=new T.MeshStandardMaterial({color:0x596e84,roughness:.95});
    const bedGeometry=new T.BoxGeometry(1,1,1);
    function block(w,h,d,x,y,z,material){
      const object=new T.Mesh(bedGeometry.clone(),material);object.scale.set(w,h,d);
      object.position.set(x,y,z);object.castShadow=true;object.receiveShadow=true;floor.add(object);
    }
    for(const bed of data.furniture??[]){
      const [x,py]=point([bed.x,bed.y]),z=-py,w=bed.width*scale,d=bed.depth*scale;
      block(w,.21,d,x,.12,z,oak);
      block(w*.98,.18,d*.98,x,.31,z,linen);
      block(w*1.03,.66,.1,x,.34,z-d/2,oak);
      block(w*.98,.05,d*.32,x,.425,z+d*.23,blue);
      for(const side of [-1,1])block(w*.37,.10,d*.18,x+side*w*.24,.45,z-d*.31,linen);
    }
    floor.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
    this.floor=floor;this.scene.add(floor);
    this.corners=data.footprint.flat().map(pixel=>{
      const [x,y]=point(pixel);return new T.Vector3(x,0,-y);
    });
    this.resize();this.reset();
  }
  reset(){
    if(!this.corners?.length)return;
    const target=new T.Box3().setFromPoints(this.corners).getCenter(new T.Vector3());
    const direction=(this.furnishedModel?new T.Vector3(.22,2.1,1.5):new T.Vector3(.45,1.7,.65)).normalize();
    const right=new T.Vector3().crossVectors(this.camera.up,direction).normalize();
    const up=new T.Vector3().crossVectors(direction,right);
    const tanY=Math.tan(T.MathUtils.degToRad(this.camera.fov/2)),tanX=tanY*this.camera.aspect;
    let distance=this.controls.minDistance;
    for(const corner of this.corners){
      const offset=corner.clone().sub(target);
      const margin=1.12*Math.max(Math.abs(offset.dot(right))/tanX,Math.abs(offset.dot(up))/tanY);
      distance=Math.max(distance,offset.dot(direction)+margin);
    }
    this.controls.target.copy(target);this.camera.position.copy(target).addScaledVector(direction,distance);
    this.controls.update();this.draw();
  }
  zoom(factor){this.camera.position.sub(this.controls.target).multiplyScalar(factor).add(this.controls.target);this.controls.update();this.draw();}
  draw(){if(this.active)this.composer.render();}
  setActive(active){this.active=active;if(active)this.resize();else this.finishPopUp(false);}
  dispose(){
    this.disposed=true;this.revision++;this.active=false;this.clear();
    this.resizeObserver.disconnect();this.controls.dispose();this.environment?.dispose();
    this.scene.traverse(object=>object.shadow?.map?.dispose());
    this.ao.dispose();this.composer.dispose();this.renderer.dispose();this.renderer.domElement.remove();
  }
}
