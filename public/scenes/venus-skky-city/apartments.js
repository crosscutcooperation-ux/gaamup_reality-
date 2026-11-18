import * as T from './vendor/three.module.js';
import {Builder,materials} from './model.js';

export function buildApartment(u,{textured=false,wallHeight=1.15}={}){
 const root=new T.Group();root.name=`${u.beds} BHK | ${u.area} sq ft | plan-derived cutaway`;
 root.userData={source:u.source,accuracy:'Wall trace from plan linework; approximate scale and illustrative furnishings',areaSqFt:u.area};
 const s=u.scale,w=u.width*s,h=u.height*s;
 const point=(x,z)=>[(x-.5)*w,(z-.5)*h];
 const shape=new T.Shape();let pts=u.footprint||[[0,0],[u.width,0],[u.width,u.height],[0,u.height]];
 pts.forEach(([x,y],i)=>{const px=(x-u.width/2)*s,pz=-(y-u.height/2)*s;i?shape.lineTo(px,pz):shape.moveTo(px,pz);});shape.closePath();
 const fg=new T.ShapeGeometry(shape);fg.rotateX(-Math.PI/2);
 const pos=fg.attributes.position;const uv=[];for(let i=0;i<pos.count;i++)uv.push(pos.getX(i)/w+.5,.5-pos.getZ(i)/h);fg.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 const fm=new T.MeshStandardMaterial({color:0xe8ddc8,roughness:.9,side:T.DoubleSide});
 const floor=new T.Mesh(fg,fm);floor.name='Floor - source plan';floor.receiveShadow=true;root.add(floor);
 if(textured){new T.TextureLoader().load(`assets/unit-${u.id}.webp`,tex=>{tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;fm.map=tex;fm.color.set(0xffffff);fm.needsUpdate=true;});}
 const walls=new Builder('Plan-traced walls');
 for(const [x1,z1,x2,z2] of u.walls){let x=((x1+x2)/2-u.width/2)*s,z=((z1+z2)/2-u.height/2)*s;
  walls.box('ivory',x,wallHeight/2,z,Math.max(Math.abs(x2-x1)*s,.12),wallHeight,Math.max(Math.abs(z2-z1)*s,.12));
 }
 root.add(walls.finish());
 const b=new Builder('Illustrative furniture');
 const box=(mat,x,y,z,sx,sy,sz,angle=0)=>{let [px,pz]=point(x,z);b.box(mat,px,y,pz,sx,sy,sz,angle);};
 const bed=(x,z,angle=0)=>{let [px,pz]=point(x,z),f=new Builder('bed');f.box('wood',0,.18,0,1.6,.3,2);f.box('ivory',0,.4,0,1.52,.22,1.95);f.box('sand',0,.54,.3,1.52,.08,1.2);f.box('ivory',-.4,.58,-.65,.58,.18,.4);f.box('ivory',.4,.58,-.65,.58,.18,.4);f.box('wood',0,.5,-1,1.7,1,.12);let g=f.finish();g.position.set(px,0,pz);g.rotation.y=angle;root.add(g);};
 const sofa=(x,z,angle=0)=>{let [px,pz]=point(x,z),f=new Builder('sofa');f.box('sand',0,.3,0,.8,.45,2.2);f.box('ivory',.3,.65,0,.22,.7,2.2);for(let zz of [-.65,0,.65])f.box('ivory',-.05,.57,zz,.55,.12,.58);for(let zz of [-1,1])f.box('ivory',-.05,.65,zz,.75,.38,.16);f.cyl('wood',-1,.3,0,.48,.5);let g=f.finish();g.position.set(px,0,pz);g.rotation.y=angle;root.add(g);};
 const dining=(x,z)=>{let [px,pz]=point(x,z);b.box('wood',px,.72,pz,1.25,.1,.85);for(let dx of [-.4,.4])for(let dz of [-.7,.7]){b.box('sand',px+dx,.43,pz+dz,.4,.12,.4);b.box('wood',px+dx,.7,pz+dz+Math.sign(dz)*.16,.4,.5,.08);}};
 const kitchen=(x,z,angle=0)=>{let [px,pz]=point(x,z),f=new Builder('kitchen');f.box('wood',0,.44,0,.62,.88,2.1);f.box('dark',0,.91,0,.68,.08,2.16);f.box('rail',0,.96,-.6,.4,.03,.45);for(let i of [-1,1])for(let j of [-1,1])f.cyl('dark',i*.13,.97,.53+j*.13,.09,.015);let g=f.finish();g.position.set(px,0,pz);g.rotation.y=angle;root.add(g);};
 const bath=(x,z)=>{let [px,pz]=point(x,z);b.sphere('ivory',px,.25,pz,.22,.25,.31);b.cyl('ivory',px,.45,pz,.23,.08,1.4);b.cyl('glass',px,.495,pz,.13,.015,1.3);b.box('ivory',px,.65,pz-.29,.42,.46,.18);b.box('wood',px+.55,.4,pz-.25,.48,.75,.45);b.sphere('ivory',px+.55,.82,pz-.25,.24,.08,.21);};
 if(u.id==='395'){bed(.72,.6);sofa(.44,.55);dining(.43,.2);kitchen(.08,.54,Math.PI/2);}
 if(u.id==='436'){bed(.31,.65);sofa(.86,.55);dining(.86,.17);kitchen(.58,.65);}
 if(u.id==='522'||u.id==='572'){bed(.25,.51);bed(.86,.60);sofa(.65,.47);dining(.66,.85);kitchen(.44,.44);}
 if(u.id==='872'){bed(.17,.55);bed(.30,.7);bed(.83,.55);sofa(.48,.52,Math.PI/2);dining(.64,.54);kitchen(.74,.6);}
 const baths={'395':[[.88,.75],[.66,.13]],'436':[[.06,.76],[.61,.1]],'522':[[.04,.4],[.45,.87]],'572':[[.04,.4],[.37,.85]],'872':[[.03,.65],[.25,.1],[.96,.65],[.70,.1]]};
 for(const [x,z] of baths[u.id]||[])bath(x,z);
 root.add(b.finish());root.updateMatrixWorld(true);return {root,width:w,depth:h,floor};
}
