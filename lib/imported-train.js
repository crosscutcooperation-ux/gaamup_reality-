import * as THREE from 'three';

/** Flatten Blender's axis-conversion transforms into the railway's Y-up frame.
 * Bogie and wheel pivots stay separate for the existing grounded animation. */
export function createImportedCoach(prototype,{cab=false,rear=false,adTexture=null}={}){
  prototype.updateWorldMatrix(true,true);
  const origin=prototype.getWorldPosition(new THREE.Vector3()),group=new THREE.Group(),length=5.8;
  group.name=cab?'Mumbai AC local driving car':'Mumbai AC local passenger car';
  const bogies=[],wheels=[],bogieMap=new Map();
  prototype.traverse(object=>{
    if(object.name.startsWith('Bogie_')){
      const bogie=new THREE.Group();bogie.name=object.name;bogie.position.copy(object.getWorldPosition(new THREE.Vector3()).sub(origin));bogie.userData.offset=bogie.position.x;group.add(bogie);bogies.push(bogie);bogieMap.set(object,bogie);
    }
  });
  prototype.traverse(object=>{
    if(!object.isMesh)return;
    let ancestor=object.parent;while(ancestor!==prototype&&!bogieMap.has(ancestor))ancestor=ancestor.parent;
    const parent=bogieMap.get(ancestor)||group,geometry=object.geometry.clone(),isWheel=/^Wheel_(Front|Rear)/.test(object.name);
    const mesh=new THREE.Mesh(geometry,object.material);mesh.name=object.name;mesh.castShadow=true;mesh.receiveShadow=true;
    if(isWheel){
      const rotation=object.matrixWorld.clone();rotation.setPosition(0,0,0);geometry.applyMatrix4(rotation);
      mesh.position.copy(object.getWorldPosition(new THREE.Vector3()).sub(origin).sub(parent.position));
      mesh.userData.rollAxis='z';wheels.push(mesh);
    }else{
      geometry.applyMatrix4(object.matrixWorld);geometry.translate(-origin.x-parent.position.x,-origin.y-parent.position.y,-origin.z-parent.position.z);
    }
    parent.add(mesh);
  });
  if(adTexture){
    // Panels are fitted above and below the glazing, leaving windows visible.
    for(const side of [-1,1]){
      for(const [height,y,width,position] of [[.36,.61,cab?2.55:4.8,'Lower'],[.14,1.29,cab?2.55:4.8,'Upper']]){
        const map=adTexture.isTexture?adTexture:adTexture[`${cab?'cab':'coach'}${position}`];
        const sticker=new THREE.MeshStandardMaterial({map,side:THREE.DoubleSide,depthWrite:false,roughness:.88,metalness:0});
        const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),sticker);
        panel.name='PanPops full-carriage advertisement';
        panel.position.set(cab?-.25:0,y,side*.497);
        panel.rotation.y=side<0?Math.PI:0;
        panel.renderOrder=2;
        group.add(panel);
      }
    }
  }
  if(rear){const axis=new THREE.Vector3(0,1,0);group.traverse(object=>{if(object===group)return;object.position.applyAxisAngle(axis,Math.PI);if(object.isMesh)object.geometry.rotateY(Math.PI);});for(const bogie of bogies)bogie.userData.offset=bogie.position.x;}
  group.userData={rear,length,bogies,wheels,source:'Blender',style:'Mumbai AC local EMU'};
  if(bogies.length!==2||wheels.length!==8)throw new Error('The Blender train is missing its wheel or bogie pivots.');
  return group;
}
export function createImportedTrain(asset,{adTexture=null}={}){
  const engine=asset.getObjectByName('AC_Driving_Cab'),coach=asset.getObjectByName('AC_Local_Coach');
  if(!engine||!coach)throw new Error('The Blender train model could not be read.');
  const cab=createImportedCoach(engine,{cab:true,adTexture}),passenger=createImportedCoach(coach,{adTexture});
  function sharedPassenger(){
    const car=new THREE.Group();car.name=passenger.name;
    // Share the immutable body geometry and textures; each carriage keeps its
    // own articulated wheel and bogie transforms for the train animation.
    for(const child of passenger.children)car.add(child.clone(true));
    car.userData={...passenger.userData,bogies:[],wheels:[]};
    car.traverse(part=>{if(part.name.startsWith('Bogie_'))car.userData.bogies.push(part);if(part.userData.rollAxis)car.userData.wheels.push(part);});
    return car;
  }
  return Array.from({length:12},(_,index)=>index===0?cab:index===1?passenger:index===11?createImportedCoach(engine,{cab:true,rear:true,adTexture}):sharedPassenger());
}
