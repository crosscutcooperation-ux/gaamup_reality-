import * as T from './vendor/three.module.js?v=shared-runtime-12';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
export const towerSpecs=[{id:'T1',name:'Tower 1',x:20,z:25,rotation:-Math.PI/2,shape:'T',floors:25,width:36,depth:14,branch:10,plan:'tower-1',note:'Brochure: 25 storeys. Typical plan on page 18; floor allocation unconfirmed.'},{id:'T2',name:'Tower 2',x:-9,z:-30,rotation:0,shape:'T',floors:25,width:36,depth:14,branch:10,plan:'tower-2',note:'Brochure: 25 storeys. Typical plan on page 19; floor allocation unconfirmed.'}];
export const materials = {
 terrain:new T.MeshStandardMaterial({color:0xadb59c,roughness:1}),
 ivory:new T.MeshStandardMaterial({color:0xece7d9,roughness:.74}),
 sand:new T.MeshStandardMaterial({color:0xb5a18c,roughness:.83}),
 dark:new T.MeshStandardMaterial({color:0x414e58,roughness:.62}),
 glass:new T.MeshStandardMaterial({color:0x527c8c,metalness:.35,roughness:.25}),
 rail:new T.MeshStandardMaterial({color:0xbcc9ca,metalness:.55,roughness:.34}),
 leaf:new T.MeshStandardMaterial({color:0x3f6241,roughness:.98}),
 lightleaf:new T.MeshStandardMaterial({color:0x688457,roughness:1}),
 trunk:new T.MeshStandardMaterial({color:0x796047,roughness:1}),
 lawn:new T.MeshStandardMaterial({color:0x7f965e,roughness:1}),
 path:new T.MeshStandardMaterial({color:0xc8bba4,roughness:.94}),
 road:new T.MeshStandardMaterial({color:0x505b61,roughness:.95}),
 stripe:new T.MeshStandardMaterial({color:0xe6e2cd,roughness:.9}),
 water:new T.MeshStandardMaterial({color:0x37aeb6,metalness:.25,roughness:.18}),
 wood:new T.MeshStandardMaterial({color:0x997654,roughness:.78}),
 court:new T.MeshStandardMaterial({color:0x547677,roughness:1}),
 terracotta:new T.MeshStandardMaterial({color:0xb56c53,roughness:.8}),
 warm:new T.MeshStandardMaterial({color:0xe2b969,emissive:0xffc879,emissiveIntensity:.08,roughness:.6})
};
const unitBox=new T.BoxGeometry(1,1,1), unitCylinder=new T.CylinderGeometry(1,1,1,12), unitSphere=new T.SphereGeometry(1,10,7);
export class Builder {
 constructor(name){this.group=new T.Group();this.group.name=name;this.batches=new Map();}
 add(geom,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
  const g=geom.clone();const m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));g.applyMatrix4(m);
  if(!this.batches.has(mat))this.batches.set(mat,[]);this.batches.get(mat).push(g);
 }
 box(mat,x,y,z,w,h,d,ry=0){this.add(unitBox,mat,x,y,z,w,h,d,0,ry);}
 cyl(mat,x,y,z,r,h,rz=1){this.add(unitCylinder,mat,x,y,z,r,h,r*rz);}
 sphere(mat,x,y,z,rx,ry=rx,rz=rx){this.add(unitSphere,mat,x,y,z,rx,ry,rz);}
 line(mat,a,b,width=.1){let d=new T.Vector3(...b).sub(new T.Vector3(...a));let q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());let e=new T.Euler().setFromQuaternion(q);this.add(unitCylinder,mat,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,width,d.length(),width,e.x,e.y,e.z);}
 finish(){for(const [mat,geoms] of this.batches){const g=mergeGeometries(geoms,false);const mesh=new T.Mesh(g,materials[mat]||mat);mesh.name=typeof mat==='string'?mat:'detail';mesh.castShadow=true;mesh.receiveShadow=true;this.group.add(mesh);for(const g of geoms)g.dispose();}this.batches.clear();return this.group;}
}



function rounded(w,d,r){const sh=new T.Shape(),x=-w/2,z=-d/2;sh.moveTo(x+r,-z);sh.lineTo(x+w-r,-z);sh.quadraticCurveTo(x+w,-z,x+w,-z-r);sh.lineTo(x+w,-z-d+r);sh.quadraticCurveTo(x+w,-z-d,x+w-r,-z-d);sh.lineTo(x+r,-z-d);sh.quadraticCurveTo(x,-z-d,x,-z-d+r);sh.lineTo(x,-z-r);sh.quadraticCurveTo(x,-z,x+r,-z);return sh;}

export function buildSite(){
 const root=new T.Group(),b=new Builder('Elements long louvred wing and short glazed wing');root.userData={forestPoints:[],podium:{shortWing:64,longWing:100,court:{x:17,z:-36,width:15,depth:22}}};
 materials.podium=new T.MeshStandardMaterial({color:0x444d5b,roughness:.72});
 materials.retailGlass=new T.MeshPhysicalMaterial({name:'stone-glass-retail',color:0x9ca9ab,metalness:.2,roughness:.12,clearcoat:1,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});materials.shopGlow=new T.MeshStandardMaterial({color:0xcabca0,emissive:0xffd69d,emissiveIntensity:0,roughness:.65});
 const slab=(name,w,d,r,y,h,mat)=>{const g=new T.ExtrudeGeometry(rounded(w,d,r),{depth:h,bevelEnabled:false,curveSegments:16});g.rotateX(-Math.PI/2);const m=new T.Mesh(g,mat);m.position.y=y;m.name=name;m.castShadow=m.receiveShadow=true;root.add(m);return m;};
 // One continuous surface keeps the satellite texture clear of intersecting ground meshes.
 const terrainElevation = (x, z) => {
  const rise = T.MathUtils.smoothstep(Math.hypot(x,z), 125, 600);
  return -.18 + rise * (Math.sin(x*.006)*Math.cos(z*.005)*10 + Math.sin((x+z)*.003)*5);
 };
 const terrainGeometry = new T.PlaneGeometry(2400, 2400, 128, 128);
 terrainGeometry.rotateX(-Math.PI / 2);
 const positions = terrainGeometry.attributes.position;
 const uv = terrainGeometry.attributes.uv;
 for(let i=0;i<positions.count;i++){
  const x = positions.getX(i), z = positions.getZ(i);
  positions.setY(i, terrainElevation(x,z));
  uv.setXY(i, .5+x/540, .5-z/540);
 }
 terrainGeometry.computeVertexNormals();
 const terrain = new T.Mesh(terrainGeometry, materials.terrain);
 terrain.name = 'Continuous New Panvel landscape';
 terrain.receiveShadow = true;
 root.add(terrain);
 slab('Entrance forecourt',84,120,9,-.15,.22,materials.paving);
 const core=slab('Recessed retail core',52,86,5,.2,6.1,materials.podium);core.position.z=3;
 for(const y of [.2,3.2,6.5])slab('Curved podium floor edges',64,100,6,y,.25,materials.ivory);
 slab('Raised amenity deck',63,99,6,6.78,.14,materials.paving);
 // The reference's long street leg is the louvred side; the shorter leg is glazed.
 const perimeter=rounded(64.6,100.6,6).getPoints(100),panes=[];
 for(let i=1;i<perimeter.length;i++){const a=perimeter[i-1],c=perimeter[i],x=(a.x+c.x)/2,z=-(a.y+c.y)/2;if(x>30&&z>-41)continue;
  for(const [y0,y1] of [[.5,3.0],[3.5,6.1]]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([a.x,y0,-a.y,c.x,y0,-c.y,c.x,y1,-c.y,a.x,y0,-a.y,c.x,y1,-c.y,a.x,y1,-a.y],3));g.computeVertexNormals();panes.push(g);}}
 const storefront=new T.Mesh(mergeGeometries(panes),materials.retailGlass);storefront.name='glass';root.add(storefront);panes.forEach(g=>g.dispose());
 for(let x=-27;x<29;x+=8){for(const y of [1.65,4.7])b.box('shopGlow',x,y,-46,7.5,2.6,.2);b.box('wood',x,1,-49,3,.65,.6);for(const y of [3,6.1])b.box('warm',x,y,-49,7,.04,.2);}
 for(let x=-28;x<30;x+=2.5)b.box('dark',x,3.3,-50.4,.045,5.8,.06);
 for(let x=-27;x<30;x+=9){b.box('ivory',x,3.6,-50.8,.65,7.2,.65);for(let k=-2;k<=2;k++)b.box('rail',x+k*.09,3.6,-51.15,.025,6.9,.035);}
 for(let z=-39;z<47;z+=.25){if(Math.abs(z+25)<5)continue;b.box('dark',32.15,3.1,z,.16,5.8,.075);}
 for(let z=-36;z<48;z+=9){if(Math.abs(z+25)<5)continue;b.box('podium',31.7,3.1,z,.2,5.7,8.4);b.box('ivory',32.6,3.7,z,.65,7.4,.7);for(let k=-2;k<=2;k++)b.box('rail',32.97,3.7,z+k*.09,.035,7,.035);}
 // The entrance is on the long side, adjacent to the court and corner glazing.
 for(const z of [-30,-20])b.box('ivory',32.7,3,z,.85,6,.7);b.box('ivory',32.7,6,-25,.85,.65,10.7);b.box('ivory',34,.2,-25,4,.3,11.5);b.box('retailGlass',31.5,2.6,-25,.1,4.8,8.6);for(const z of [-28,-25,-22])b.box('rail',31.65,2.7,z,.12,4.8,.045);
 // Exactly one court at the inner corner, immediately beside the short-wing tower.
 b.box('court',17,7.02,-36,15,.12,22);for(const x of [10,24])b.box('stripe',x,7.10,-36,.07,.015,21);for(const z of [-46.5,-36,-25.5])b.box('stripe',17,7.10,z,14,.015,.07);
 const ring=new T.TorusGeometry(2,.04,5,40);ring.rotateX(Math.PI/2);b.add(ring,'stripe',17,7.12,-36);ring.dispose();
 for(const z of [-45,-27]){b.box('rail',17,8.6,z,.1,3.2,.1);b.box('ivory',17,10,z,1.7,1,.12);const hoop=new T.TorusGeometry(.35,.035,5,16);hoop.rotateX(Math.PI/2);b.add(hoop,'terracotta',17,9.6,z+(z<-36?.5:-.5));hoop.dispose();}
 for(let x=9;x<=25;x+=3)for(const z of [-47.2,-24.8])b.box('rail',x,9,z,.05,4,.05);for(const y of [7.4,8.1,8.8,9.5,10.2])for(const z of [-47.2,-24.8])b.box('rail',17,y,z,16,.025,.025);
 // Retained amenities stay behind the towers rather than occupying the reference court.
 const deck=slab('Pool deck',20,28,4,7,.12,materials.wood);deck.position.set(-15,7,28);const pool=slab('Pool water',14,22,3,7.15,.06,materials.water);pool.position.set(-15,7.15,28);
 for(const [x,z,w,d] of [[-15,44,18,7],[26,-13,7,14],[19,-48,16,2]])b.box('lawn',x,7,z,w,.16,d);
 for(let i=0;i<7;i++)b.box('wood',-19+i,10,44,.12,.12,5);for(const x of [-19,-12])for(const z of [42,46])b.box('wood',x,8.5,z,.14,3,.14);b.box('warm',-15,8,44,2,2,2);b.line('terracotta',[-15,9,43],[-15,7.2,40],.4);
 function tree(x,z,y=0,size=.5){b.cyl('trunk',x,y+2.5*size,z,.15*size,5*size);if(materials.canopy){const plane=new T.PlaneGeometry(1,1);for(let j=0;j<3;j++)b.add(plane,materials.canopy,x,y+4.4*size,z,6.8*size,8.4*size,1,0,j*Math.PI/3);plane.dispose();}else b.sphere('leaf',x,y+4*size,z,2*size,2.5*size,2*size);}
 for(let z=-42;z<47;z+=6)tree(29,z,7,.38);for(let x=-27;x<29;x+=6)tree(x,-47.5,7,.35);
 // Plain studio surroundings; only the two adjacent streets are retained.
 b.box('road',49,-.04,0,18,.14,220);b.box('road',0,-.04,-67,180,.14,18);for(let z=-100;z<100;z+=8)b.box('stripe',49,.05,z,.13,.025,3);for(let x=-80;x<82;x+=8)b.box('stripe',x,.05,-67,3,.025,.13);
 for(let i=0;i<12;i++){b.box('stripe',49,.07,-56+i*.8,16,.02,.5);b.box('stripe',32+i*.8,.07,-67,.5,.02,16);}
 for(let i=0;i<9;i++){const z=-85+i*20;b.box('sand',44,.7,z,1.8,.9,3.8);b.box('glass',44,1.3,z,1.5,.7,2);}
 // Sprayed foliage cards lift the tree canopy out of the aerial photograph.
 for(let i=0;i<160;i++){
  const angle=i*2.3999632297,r=145+Math.sqrt((i+.5)/160)*310;
  const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
  if(Math.abs(x-49)<16&&Math.abs(z)<116)continue;
  const size=.6+((i*37)%23)/45;
  tree(x,z,terrainElevation(x,z),size);
 }
 root.add(b.finish());const towers=towerSpecs.map(s=>{const g=new T.Group();g.position.set(s.x,0,s.z);g.rotation.y=s.rotation;g.userData={...s,height:89};root.add(g);return g;});root.updateMatrixWorld(true);return {root,towers};}
