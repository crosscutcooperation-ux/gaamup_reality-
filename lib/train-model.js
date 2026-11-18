import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Local, editable suburban rolling stock. Every body panel owns its surface;
 * windows are inset into openings rather than stacked over a second body skin. */
export function createCoach({cab=false,finish=null}={}){
  const group=new THREE.Group(),length=cab?4.7:5.8,halfWidth=.438;
  group.name=cab?'Driving cab':'Passenger coach';
  const metal=new THREE.MeshStandardMaterial({color:0xf1e8d3,metalness:.22,roughness:.53,roughnessMap:finish?.grain||null,bumpMap:finish?.grain||null,bumpScale:.0012});
  const olive=new THREE.MeshStandardMaterial({color:0x71334c,metalness:.18,roughness:.5,roughnessMap:finish?.grain||null});
  const steel=new THREE.MeshStandardMaterial({color:0xa5aaa7,metalness:.78,roughness:.4,roughnessMap:finish?.grain||null});
  const cabPaint=new THREE.MeshStandardMaterial({color:0xe5b73f,metalness:.15,roughness:.5});
  const nameplate=metal.clone();nameplate.map=finish?.nameplate||null;nameplate.color.set(0xffffff);
  const dark=new THREE.MeshStandardMaterial({color:0x242a28,metalness:.45,roughness:.75});
  const glass=new THREE.MeshPhysicalMaterial({color:0x182c34,metalness:.15,roughness:.16,clearcoat:1,clearcoatRoughness:.12});
  const revealMaterial=dark.clone();revealMaterial.side=THREE.DoubleSide;
  function mesh(geometry,material,name,parent=group){const part=new THREE.Mesh(geometry,material);part.name=name;part.castShadow=true;parent.add(part);return part;}
  function box(w,h,d,x,y,z,material,name,parent=group){const part=mesh(new THREE.BoxGeometry(w,h,d),material,name,parent);part.position.set(x,y,z);return part;}
  function rod(a,b,radius,material,name,parent=group){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const part=mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),material,name,parent);part.position.copy(start.add(end).multiplyScalar(.5));part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());part.castShadow=false;return part;}
  function panel(a,b,bottom,top,side,material,name,depth=halfWidth){
    if(b-a<1e-6||top-bottom<1e-6)return;
    const part=mesh(new THREE.PlaneGeometry(b-a,top-bottom),material,name);
    part.position.set((a+b)/2,(bottom+top)/2,side*depth);if(side<0)part.rotation.y=Math.PI;
    // Thin side panels do not cast their own shadow back onto nearby window reveals.
    part.castShadow=false;return part;
  }
  function windowCell(a,b,side,bottom=.79,top=1.3){
    const left=a+.065,right=b-.065,low=.91,high=1.24;
    panel(a,left,bottom,top,side,metal,'Window pillar');panel(right,b,bottom,top,side,metal,'Window pillar');
    panel(left,right,bottom,low,side,metal,'Window sill');panel(left,right,high,top,side,metal,'Window header');
    // A shallow frame fills the opening; the glass sits inside the frame, without a metal face behind it.
    const border=.018;
    panel(left,right,low,low+border,side,dark,'Lower window gasket');panel(left,right,high-border,high,side,dark,'Upper window gasket');
    panel(left,left+border,low+border,high-border,side,dark,'Window gasket');panel(right-border,right,low+border,high-border,side,dark,'Window gasket');
    panel(left+border,right-border,low+border,high-border,side,glass,'Inset window',halfWidth-.008);
    for(const y of [1.015,1.115])rod([left,y,side*.448],[right,y,side*.448],.006,steel,'Suburban window safety bar');
    const corners=[[left+border,low+border],[right-border,low+border],[right-border,high-border],[left+border,high-border]];
    for(let i=0;i<4;i++){
      const a=corners[i],b=corners[(i+1)%4],positions=[];
      for(const [point,depth]of [[a,halfWidth],[b,halfWidth],[b,halfWidth-.008],[a,halfWidth-.008]])positions.push(point[0],point[1],side*depth);
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();mesh(geometry,revealMaterial,'Window reveal').castShadow=false;
    }
  }
  for(const side of [-1,1]){
    const doors=[-length*.32,length*.32],doorWidth=.64;
    const breaks=[-length/2,...doors.flatMap(x=>[x-doorWidth/2,x+doorWidth/2]),length/2];
    for(let segment=0;segment<breaks.length-1;segment++){
      const a=breaks[segment],b=breaks[segment+1],door=segment===1||segment===3;
      if(door){
        const middle=(a+b)/2;
        panel(a,b,.43,.79,side,olive,'Door lower panel');
        panel(middle-.008,middle+.008,.79,.91,side,dark,'Door joint');
        panel(a,middle-.008,.79,.91,side,metal,'Door leaf');panel(middle+.008,b,.79,.91,side,metal,'Door leaf');
        windowCell(a,middle,side,.91,1.3);windowCell(middle,b,side,.91,1.3);
        panel(a,b,1.3,1.49,side,metal,'Door header');
        box(b-a,.035,.1,middle,.41,side*.46,dark,'Door step');
        for(const x of [a+.035,b-.035])rod([x,.68,side*.465],[x,1.22,side*.465],.009,steel,'Door grab rail');
      }else{
        panel(a,b,.43,.63,side,metal,'Lower body');panel(a,b,.63,.79,side,olive,'Painted waist band');
        if(segment===2){const left=-.78,right=.78;panel(a,left,1.3,1.49,side,metal,'Upper body');panel(left,right,1.3,1.49,side,nameplate,'Indian Railways nameplate');panel(right,b,1.3,1.49,side,metal,'Upper body');}
        else panel(a,b,1.3,1.49,side,metal,'Upper body');
        for(const y of [.48,.53,.58])rod([a+.01,y,side*.442],[b-.01,y,side*.442],.005,steel,'Body beading');
        const count=Math.max(1,Math.round((b-a)/.65));
        for(let i=0;i<count;i++)windowCell(a+(b-a)*i/count,a+(b-a)*(i+1)/count,side);
      }
    }
  }
  // A curved roof, end caps and floor close the shell without intersecting side skins.
  const points=[],indices=[],uv=[],steps=20;
  for(let i=0;i<=steps;i++){const angle=i/steps*Math.PI,z=Math.cos(angle)*halfWidth,y=1.49+Math.sin(angle)*.17;points.push(-length/2,y,z,length/2,y,z);uv.push(0,i/steps,1,i/steps);}
  for(let i=0;i<steps;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute(points,3));roof.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));roof.setIndex(indices);roof.computeVertexNormals();mesh(roof,steel,'Curved roof');
  for(const sign of [-1,1]){
    const shape=new THREE.Shape();shape.moveTo(-halfWidth,.43);shape.lineTo(halfWidth,.43);shape.lineTo(halfWidth,1.49);
    for(let i=1;i<=steps;i++){const angle=i/steps*Math.PI;shape.lineTo(Math.cos(angle)*halfWidth,1.49+Math.sin(angle)*.17);}shape.closePath();
    const cap=mesh(new THREE.ShapeGeometry(shape),cab&&sign>0?cabPaint:metal,cab&&sign>0?'Yellow driving cab':'End cap');cap.rotation.y=sign*Math.PI/2;cap.position.x=sign*length/2;
    if(cab&&sign>0){
      const lightMaterial=new THREE.MeshStandardMaterial({color:0xffefd7,emissive:0xffde9c,emissiveIntensity:.8});
      for(const side of [-1,1]){
        box(.035,.27,.3,length/2+.025,1.29,side*.19,glass,'Cab windscreen');
        rod([length/2+.05,1.18,side*.13],[length/2+.05,1.39,side*.23],.008,dark,'Windscreen wiper');
        const lamp=mesh(new THREE.CylinderGeometry(.046,.046,.035,16),lightMaterial,'Headlight');lamp.rotation.z=Math.PI/2;lamp.position.set(length/2+.025,.78,side*.29);
      }
      box(.08,.11,.74,length/2+.04,.57,0,olive,'Cab buffer beam');
    }
  }
  const floor=mesh(new THREE.PlaneGeometry(length,halfWidth*2),dark,'Floor');floor.rotation.x=Math.PI/2;floor.position.y=.43;
  box(length-.3,.15,.64,0,.34,0,dark,'Underframe');
  for(const x of [-length*.27,0,length*.27]){
    box(.47,.09,.46,x,1.7,0,steel,'Roof ventilator');
    for(let i=0;i<7;i++)box(.018,.012,.38,x-.18+i*.06,1.751,0,dark,'Ventilator louvre');
  }
  if(cab){
    for(const z of [-.14,.14]){
      rod([-.8,1.75,z],[-.42,1.97,z],.014,dark,'Pantograph lower arm');rod([-.04,1.75,z],[-.42,1.97,z],.014,dark,'Pantograph lower arm');
      rod([-.42,1.97,z],[-.08,2.15,z],.012,steel,'Pantograph upper arm');rod([-.42,1.97,z],[-.76,2.15,z],.012,steel,'Pantograph upper arm');
    }
    box(.7,.025,.4,-.42,2.16,0,dark,'Pantograph contact head');
  }
  for(const x of [-.75,.75])box(.52,.13,.56,x,.27,0,dark,'Underfloor equipment');
  const wheels=[],bogies=[];
  for(const x of [-length*.32,length*.32]){
    const bogie=new THREE.Group();bogie.name='Articulated bogie';bogie.position.x=x;bogie.userData.offset=x;group.add(bogie);bogies.push(bogie);
    box(.85,.13,.47,0,.31,0,dark,'Bogie frame',bogie);
    for(const z of [-.25,.25])for(const offset of [-.17,.17]){
      const points=Array.from({length:49},(_,i)=>{const angle=i/48*Math.PI*8;return new THREE.Vector3(offset+Math.cos(angle)*.035,.32+i/48*.1,z+Math.sin(angle)*.035);});
      const spring=mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.006,5,false),steel,'Suspension spring',bogie);spring.castShadow=false;
    }
    for(const axle of [-.25,.25]){
      box(.05,.05,.65,axle,.302,0,dark,'Axle',bogie);
      for(const z of [-.3,.3]){
        const wheel=mesh(new THREE.CylinderGeometry(.14,.14,.075,24),dark,'Wheel',bogie);wheel.rotation.x=Math.PI/2;wheel.position.set(axle,.302,z);wheels.push(wheel);
      }
    }
  }
  for(const x of [-length/2-.13,length/2+.13])box(.26,.09,.12,x,.45,0,dark,'Coupler');
  // Batch stationary panels by material. The wheels and articulated bogies stay
  // separate so the model remains animated without hundreds of panel draw calls.
  function batch(parent,excluded=new Set()){
  const batches=new Map();
  for(const part of [...parent.children])if(part.isMesh&&!excluded.has(part)){
    const key=`${part.material.id}/${part.castShadow}`;
    if(!batches.has(key))batches.set(key,{parts:[],material:part.material,castShadow:part.castShadow});
    batches.get(key).parts.push(part);
  }
  for(const {parts,material,castShadow}of batches.values()){
    const geometries=parts.map(part=>{part.updateMatrix();const transformed=part.geometry.clone().applyMatrix4(part.matrix);if(!transformed.index)return transformed;const flat=transformed.toNonIndexed();transformed.dispose();return flat;});
    const merged=mesh(mergeGeometries(geometries),material,'Body panels',parent);merged.castShadow=castShadow;merged.userData.parts=parts.map(part=>part.name);
    for(const part of parts){parent.remove(part);part.geometry.dispose();}for(const geometry of geometries)geometry.dispose();
  }
  }
  batch(group);for(const bogie of bogies)batch(bogie,new Set(wheels));
  group.userData={length,wheels,bogies,procedural:true,style:'Mumbai suburban — cream and maroon'};return group;
}
