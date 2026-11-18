import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Dimensions in metres, reconstructed from brochure plans. Site coordinates
// follow the supplied north-up masterplan. Unmeasured dimensions are estimates.
export const towerSpecs = [
 {id:'C',name:'Tower C',x:-66,z:50,rotation:Math.PI/2,shape:'T',floors:33,width:43,depth:11,branch:22,plan:'tower-c-plan',note:'T-shaped plan · 2nd–33rd floors supplied'},
 {id:'D',name:'Tower D',x:-59,z:-8,rotation:Math.PI/2,shape:'T',floors:33,width:36,depth:11,branch:18,note:'Masterplan footprint · height and facade inferred'},
 {id:'E',name:'Tower E',x:-53,z:-58,rotation:Math.PI/2,shape:'L',floors:33,width:32,depth:11,branch:15,note:'Masterplan footprint · height and facade inferred'},
 {id:'F',name:'Tower F',x:0,z:-76,rotation:0,shape:'T',floors:33,width:48,depth:12,branch:23,plan:'tower-f-plan',note:'33-storey Vivanta tower · brochure plan supplied'},
 {id:'G',name:'Tower G',x:55,z:-77,rotation:0,shape:'L',floors:33,width:36,depth:11,branch:17,note:'33-storey Vivanta tower · elevation supplied'},
 {id:'A',name:'Tower A',x:47,z:-19,rotation:-Math.PI/2,shape:'T',floors:33,width:49,depth:11,branch:21,plan:'tower-a-plan',note:'T-shaped Vivanta plan · brochure supplied'},
 {id:'B',name:'Tower B',x:12,z:40,rotation:Math.PI,shape:'T',floors:33,width:68,depth:11,branch:24,note:'Masterplan footprint · height and facade inferred'},
 {id:'lavista',name:'La’Vista',x:-35,z:-143,rotation:Math.PI,shape:'L',floors:26,width:50,depth:12,branch:50,plan:'lavista-plan',note:'L-shaped plan · 2nd–26th floors supplied'},
 {id:'aristo',name:'Aristo',x:90,z:-131,rotation:0,shape:'I',floors:26,width:66,depth:13,branch:0,plan:'aristo-plan',note:'Linear plan supplied · facade from Aristo render; height estimated'}
];
export const materials = {
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

function block(b,cx,cz,w,d,floors,base=6.8){
 const fh=3.05,h=floors*fh;
 b.box('sand',cx,base+h/2,cz,w,h,d);
 b.box('ivory',cx,base+h+.22,cz,w+.8,.45,d+.8);
 // Slab edges, projecting balconies, glazing and vertical facade frames.
 for(let f=0;f<floors;f++){
  const y=base+f*fh;
  b.box('ivory',cx,y+.12,cz,w+.65,.24,d+.65);
  for(const side of [-1,1]){
   const z=cz+side*(d/2+.03),cols=Math.max(2,Math.floor(w/3.6)),bay=w/cols;
   for(let j=0;j<cols;j++){
    const x=cx-w/2+bay*(j+.5),balcony=j%3===1;
    b.box('dark',x,y+1.5,z,bay-.3,2.5,.13);
    b.box('glass',x,y+1.55,z+side*.1,bay-.75,1.75,.15);
    b.box('ivory',x,y+1.55,z+side*.21,.055,1.8,.07);
    b.box('ivory',x,y+1.5,z+side*.22,bay-.72,.055,.07);
    if(balcony){
     const bz=z+side*.85;
     b.box('ivory',x,y+.14,bz,bay-.12,.25,1.65);
     b.box('rail',x,y+.95,z+side*1.55,bay-.2,.07,.07);
     for(let k=0;k<5;k++)b.box('rail',x-bay*.4+k*bay*.2,y+.59,z+side*1.55,.035,.7,.04);
    }
   }
  }
  for(const side of [-1,1])for(let j=0;j<Math.max(2,Math.floor(d/3.4));j++){
   const n=Math.max(2,Math.floor(d/3.4)),z=cz-d/2+d/n*(j+.5);
   b.box('dark',cx+side*(w/2+.04),y+1.5,z,.15,2.4,d/n-.45);
   b.box('glass',cx+side*(w/2+.14),y+1.55,z,.12,1.7,d/n-.95);
  }
 }
 for(const side of [-1,1]){
  const cols=Math.max(2,Math.floor(w/3.6)),bay=w/cols;
  for(let j=0;j<=cols;j++)b.box('ivory',cx-w/2+bay*j,base+h/2,cz+side*(d/2+.28),.23,h,.42);
  // Signature tall open frames on the crown.
  for(let j=0;j<cols;j+=3){const x=cx-w/2+bay*(j+.5),yy=base+h;
   b.box('ivory',x-bay*.43,yy+1.9,cz+side*(d/2),.4,3.8,.55);
   b.box('ivory',x+bay*.43,yy+1.9,cz+side*(d/2),.4,3.8,.55);
   b.box('ivory',x,yy+3.65,cz+side*(d/2),bay*.95,.4,.55);
  }
 }
 // Rooftop service enclosure and ground lobby columns.
 b.box('ivory',cx,base+h+1,cz,Math.min(w*.36,9),2,d*.6);
 for(let x=cx-w/2+1;x<cx+w/2;x+=4)b.box('ivory',x,base-1.7,cz, .5,3.4,d*.8);
}

function makeTower(s){const b=new Builder(s.name);
 block(b,0,0,s.width,s.depth,s.floors);
 if(s.shape==='T')block(b,0,(s.depth+s.branch)/2,11,s.branch,s.floors);
 if(s.shape==='L')block(b,-s.width/2+6,(s.depth+s.branch)/2,12,s.branch,s.floors);
 // Refuge terraces are indicative; precise refuge schedule is not supplied.
 for(let f=6;f<s.floors;f+=6){const y=6.8+f*3.05;b.box('ivory',s.width/2+1.8,y,0,4,.35,8);b.box('leaf',s.width/2+3.6,y+.45,0,.4,.7,8);}
 let g=b.finish();g.position.set(s.x,0,s.z);g.rotation.y=s.rotation;g.userData={...s,kind:'tower',height:s.floors*3.05+11};return g;
}

function tree(b,x,z,y=0,r=2.1){b.cyl('trunk',x,y+2,z,.22,4);b.sphere('leaf',x,y+4.1,z,r,r*1.1,r);b.sphere('lightleaf',x-.5,y+4.8,z-.4,r*.75);}
function palm(b,x,z,y=0){b.cyl('trunk',x,y+3.8,z,.2,7.6);for(let j=0;j<7;j++){let a=j*Math.PI*2/7;const tip=[x+Math.sin(a)*3,y+7.3,z+Math.cos(a)*3];b.line('leaf',[x,y+8,z],tip,.18);b.sphere('leaf',(x+tip[0])/2,y+7.7,(z+tip[2])/2,1.1,.17,1.1);}}
function path(b,pts,width=2,level=6.9){for(let i=1;i<pts.length;i++){let [x1,z1]=pts[i-1],[x2,z2]=pts[i],dx=x2-x1,dz=z2-z1;b.box('path',(x1+x2)/2,level,(z1+z2)/2,width,.12,Math.hypot(dx,dz),Math.atan2(dx,dz));}}
function gazebo(b,x,z,y=7){for(const dx of [-2,2])for(const dz of [-2,2])b.box('wood',x+dx,y+1.6,z+dz,.18,3.2,.18);const roof=new T.ConeGeometry(3.6,1.6,4);b.add(roof,'terracotta',x,y+3.8,z,1,1,1,0,Math.PI/4);roof.dispose();b.box('wood',x,y+.1,z,5,.25,5);}
function pool(b,x,z,rx,rz){b.cyl('path',x,6.96,z,rx+1,.3,rz/rx);b.cyl('water',x,7.13,z,rx,.08,rz/rx);}
function road(b,x,z,w,d){b.box('road',x,-.05,z,w,.16,d);if(w>d){b.box('leaf',x,.15,z,w,.32,1.5);for(let xx=x-w/2+4;xx<x+w/2;xx+=7){b.box('stripe',xx,.05,z+4,3,.035,.15);b.box('stripe',xx,.05,z-4,3,.035,.15);}}else{b.box('leaf',x,.15,z,1.5,.32,d);for(let zz=z-d/2+4;zz<z+d/2;zz+=7){b.box('stripe',x+5,.05,zz,.15,.035,3);b.box('stripe',x-5,.05,zz,.15,.035,3);}}}
function car(b,x,z,ry=0,color='sand'){let g=new Builder('car');g.box(color,0,.7,0,1.8,.7,4);g.box('glass',0,1.25,-.2,1.55,.65,2.1);for(let dx of [-.91,.91])for(let dz of [-1.2,1.2])g.sphere('dark',dx,.4,dz,.25,.4,.4);let obj=g.finish();obj.position.set(x,0,z);obj.rotation.y=ry;return obj;}

export function buildSite(){
 const root=new T.Group();root.name='Venus Skky City | Reference Reconstruction';
 root.userData={source:'Google Drive digital kit: 1-JZJ0tgcBSCGfygBEWN_B1rXHWEE5pUT',units:'metres',accuracy:'Reference-based reconstruction; estimated dimensions, inferred hidden elevations and future towers.'};
 const site=new Builder('Landscape, podium and streets');
 site.box('lawn',0,-1.5,-25,330,2.7,390);
 site.box('path',4,3.2,-9,145,6.4,176);
 site.box('lawn',4,6.55,-9,141,.3,172);
 // Two visible podium decks and retail frontage.
 for(let y of [0.3,3.25,6.3])site.box('ivory',4,y,-9,146,.34,177);
 for(let z=-91;z<78;z+=4){site.box('ivory',-69,3.2,z,.55,6, .5);site.box('glass',-68.65,1.8,z,.14,2.5,3.5);site.box('dark',-68.6,4.8,z,.16,1.3,3.5);}
 for(let x=-66;x<73;x+=4){site.box('ivory',x,3.2,-97,.5,6,.55);site.box('glass',x,1.8,-96.7,3.5,2.5,.14);site.box('dark',x,4.8,-96.7,3.5,1.3,.16);}
 road(site,-91,-25,24,390);road(site,35,-110,275,24);road(site,-137,114,135,24);
 // Pedestrian perimeter and outer garden from the north-up masterplan.
 path(site,[[-64,-87],[-64,71],[67,71],[67,-87],[-64,-87]],2.5);
 path(site,[[-36,-57],[-34,-28],[-28,-14],[-32,12],[-22,20],[-10,20],[0,0],[17,-3],[27,-35],[17,-58]],2.5);
 path(site,[[82,-80],[88,-40],[81,-10],[82,35],[65,84],[30,99]],3, .25);
 pool(site,-20,-29,12,16);pool(site,-10,-40,10,7);pool(site,-27,-12,8,7);
 site.box('path',-37,7,-42,14,.25,20);
 for(let z=-48;z<-30;z+=4){site.box('ivory',-37,7.5,z,1.8,.4,3);site.box('wood',-37,7.7,z,1.7,.12,2.7);palm(site,-43,z,7);}
 // Curved clubhouse: terraced elliptical plates, glass perimeter, planted lips.
 const club=new Builder('Vivanta Clubhouse');
 for(let k=0;k<4;k++){let y=7+k*3.5,r=10-k*.7;club.cyl('glass',-3,y+1.6,-13,r-1,3.2,1.3);club.cyl('ivory',-3,y+3.3,-13,r+.7,.4,1.3);for(let a=0;a<32;a++){let t=a*Math.PI*2/32;club.sphere('leaf',-3+Math.cos(t)*(r+.2),y+3.6,-13+Math.sin(t)*(r+.2)*1.3,.5,.35,.5);}}
 root.add(club.finish());
 // Landscape zones: gazebos, play areas, pergola, cafe, gardens and court.
 for(const [x,z] of [[-30,18],[27,7],[89,-10],[89,12],[78,58]])gazebo(site,x,z,x>75?0:7);
 for(let x=-36;x<-19;x+=2.5){site.box('wood',x,10,34,.18,.18,11);}for(let x of [-36,-19])for(let z of [29,39])site.box('wood',x,8.5,z,.25,3,.25);
 site.box('terracotta',28,7.05,-51,14,.1,14);site.cyl('path',28,7.1,-51,5,.2);
 for(let i=0;i<3;i++){site.box('warm',24+i*3,8,-51,2,2,2);site.box('terracotta',24+i*3,9.2,-51,2.3,.3,2.3);site.line('terracotta',[24+i*3,8,-50],[24+i*3,7.2,-46],.6);}
 site.box('court',91,.25,46,17,.1,29);
 for(let x of [83,99])site.box('stripe',x,.32,46,.12,.025,27);
 for(let z of [32.5,46,59.5])site.box('stripe',91,.32,z,16,.025,.12);
 for(let z of [34,58]){site.box('rail',91,2,z,.12,4,.12);site.box('stripe',91,4,z,2.2,1.3,.15);}
 for(let x of [81,101])for(let z=30;z<=61;z+=4)site.box('rail',x,2.5,z,.08,5,.08);
 // Tree-lined streets and perimeter belts.
 for(let z=-199;z<154;z+=9){tree(site,-107,z);palm(site,-75,z);}
 for(let x=-64;x<173;x+=9){tree(site,x,-125);palm(site,x,-94);}
 for(let z=-86;z<96;z+=6){tree(site,111,z,0,2.3);if(z>-78)tree(site,78,z,0,1.8);}
 for(let x=-60;x<73;x+=6){tree(site,x,81,0,2.1);}
 for(let z=-61;z<48;z+=9)for(let x of [-43,34]){if(Math.abs(z+23)>17)tree(site,x,z,7,1.35);}
 for(let i=0;i<24;i++){let a=i*2.399,x=Math.cos(a)*(11+i*.22)+3,z=Math.sin(a)*(10+i*.18)+23;if(x<30&&x>-22)site.sphere('lightleaf',x,7.6,z,1.2,.8,1.2);}
 // Small ornamental water body and central gathering circle.
 site.cyl('path',14,7.02,13,7,.12);site.cyl('water',14,7.12,13,3,.08);
 for(let a=0;a<12;a++){let t=a*Math.PI/6;site.box('wood',14+5.5*Math.cos(t),7.5,13+5.5*Math.sin(t),1.5,.4,.5,-t);}
 // School, temple and sales office are separate readable components.
 const school=new Builder('Eva World School');block(school,0,0,42,17,5,3.2);school.box('ivory',0,1.5,0,44,3,19);let sg=school.finish();sg.position.set(-145,0,76);sg.rotation.y=-.65;root.add(sg);
 const temple=new Builder('Vasantdeep Vatika Jain Temple');temple.box('path',0,.7,0,25,1.4,24);temple.box('ivory',0,2.2,-3,16,3,14);
 for(let x of [-8,-4,4,8])for(let z of [2,8]){temple.cyl('ivory',x,4,z,.45,6);temple.cyl('sand',x,1.6,z,.7,.3);temple.cyl('sand',x,6.8,z,.7,.4);}
 temple.box('ivory',0,7.3,5,19,1,12);
 for(const [x,z,r,h] of [[0,-5,4,10],[-5,-4,2.5,7],[5,-4,2.5,7]]){let cone=new T.ConeGeometry(r,h,16);temple.add(cone,'ivory',x,7+h/2,z);temple.cyl('warm',x,7+h+.5,z,.15,1.5);cone.dispose();}
 for(let i=0;i<5;i++)temple.box('ivory',0,.18+i*.22,13-i*.8,16,.3,4);
 let tg=temple.finish();tg.position.set(-46,0,105);root.add(tg);
 site.box('ivory',-133,2.2,19,28,4.4,14);site.box('glass',-133,2.1,26.1,25,3,.2);
 // Entry gates, boulevard lamps, roadside vehicles.
 for(const z of [-91,76]){site.box('ivory',-72,3,z,1,6,1);site.box('ivory',-61,3,z,1,6,1);site.box('ivory',-66.5,6,z,12,.8,1);}
 for(let z=-180;z<143;z+=18)for(const x of [-101,-81]){site.box('dark',x,3.6,z,.13,7.2,.13);site.box('warm',x,7.2,z,.8,.16,.6);}
 root.add(site.finish());
 for(let i=0;i<16;i++)root.add(car(site,i%2?-98:-84,-170+i*19,i%2?0:Math.PI,i%3?'sand':'ivory'));
 const towers=towerSpecs.map(makeTower);root.add(...towers);
 root.updateMatrixWorld(true);
 return {root,towers};
}
