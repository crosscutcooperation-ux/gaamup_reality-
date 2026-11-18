import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {REGION,geoToWorld} from './region.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createElevationSampler(data){
  const {columns,rows,heights}=data;
  return (x,z)=>{
    const u=clamp((x/REGION.width+.5)*(columns-1),0,columns-1),v=clamp((z/REGION.depth+.5)*(rows-1),0,rows-1),i=Math.floor(u),j=Math.floor(v);
    const a=heights[j*columns+i],b=heights[j*columns+Math.min(columns-1,i+1)],c=heights[Math.min(rows-1,j+1)*columns+i],d=heights[Math.min(rows-1,j+1)*columns+Math.min(columns-1,i+1)];
    return Math.max(0,T.MathUtils.lerp(T.MathUtils.lerp(a,b,u-i),T.MathUtils.lerp(c,d,u-i),v-j))*REGION.verticalScale;
  };
}
export function createLandscape(data,route,water=[]){
  const elevation=createElevationSampler(data),corridor=[];
  for(let i=-140;i<=580;i++){
    const u=clamp(i/440,0,1),p=route.getPointAt(u),t=route.getTangentAt(u);
    if(i<0||i>440)p.addScaledVector(t,(i/440-u)*route.getLength());corridor.push(p);
  }
  function distance(x,z){let d=Infinity;for(const p of corridor)d=Math.min(d,(p.x-x)**2+(p.z-z)**2);return Math.sqrt(d);}
  const lakes=water.filter(area=>area.closed&&area.points.every(p=>{const [x,z]=geoToWorld(...p);return Math.abs(x)<=140&&Math.abs(z)<=121;})).map(area=>{const points=area.points.map(p=>geoToWorld(...p));return {points,minX:Math.min(...points.map(p=>p[0])),maxX:Math.max(...points.map(p=>p[0])),minZ:Math.min(...points.map(p=>p[1])),maxZ:Math.max(...points.map(p=>p[1]))};});
  function inWater(x,z){for(const lake of lakes){if(x<lake.minX||x>lake.maxX||z<lake.minZ||z>lake.maxZ)continue;let inside=false;const points=lake.points;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}if(inside)return true;}return false;}
  const height=(x,z)=>distance(x,z)<2.3?0:inWater(x,z)?-.06:elevation(x,z)*T.MathUtils.smoothstep(distance(x,z),2.3,5.5);
  const geometry=new T.PlaneGeometry(REGION.width,REGION.depth,280,240);geometry.rotateX(-Math.PI/2);
  const p=geometry.attributes.position,colors=[],color=new T.Color(),low=new T.Color('#88976c'),forest=new T.Color('#355d35'),ridgeColor=new T.Color('#697954');
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),h=height(x,z);p.setY(i,h);
    color.copy(low).lerp(forest,T.MathUtils.smoothstep(h,1.2,7)).lerp(ridgeColor,T.MathUtils.smoothstep(h,9,24)*.35);
    color.multiplyScalar(1+Math.sin(x*1.1+Math.sin(z*.8))*.022+Math.cos(z*1.8+x*.7)*.012);colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  return {geometry,height,elevation,distance};
}
function flatShape(points){const shape=new T.Shape();points.forEach(([x,z],i)=>shape[i?'lineTo':'moveTo'](x,-z));shape.closePath();return shape;}
function joined(list,material,name,parent){
  if(!list.length){material.dispose();return;}
  const geometry=mergeGeometries(list,false);list.forEach(g=>g.dispose());
  const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
/** Geographic architecture, with one measured relief surface and mapped features. */
export function createRegionalArchitecture({terrain,architecture,route,facadeTexture=null,groundTexture=null}){
  const group=new T.Group();group.name='Dombivli Kalyan Shilphata — 3D geographic landscape';
  const relief=createLandscape(terrain,route,architecture.water);
  if(groundTexture){groundTexture.wrapS=groundTexture.wrapT=T.RepeatWrapping;groundTexture.repeat.set(45,39);groundTexture.colorSpace=T.SRGBColorSpace;}
  const ground=new T.Mesh(relief.geometry,new T.MeshStandardMaterial({vertexColors:true,map:groundTexture,bumpMap:groundTexture,bumpScale:.035,roughness:.96}));ground.name='Measured terrain relief';ground.receiveShadow=true;ground.position.y=-.035;group.add(ground);
  const skirts=[],edge=relief.geometry.attributes.position;
  function skirt(a,b){const ax=edge.getX(a),az=edge.getZ(a),ay=edge.getY(a)-.035,bx=edge.getX(b),bz=edge.getZ(b),by=edge.getY(b)-.035;skirts.push(ax,ay,az,bx,by,bz,ax,-3,az,bx,by,bz,bx,-3,bz,ax,-3,az);}
  for(let x=0;x<280;x++){skirt(x,x+1);skirt(240*281+x+1,240*281+x);}
  for(let z=0;z<240;z++){skirt((z+1)*281,z*281);skirt(z*281+280,(z+1)*281+280);}
  const skirtGeo=new T.BufferGeometry();skirtGeo.setAttribute('position',new T.Float32BufferAttribute(skirts,3));skirtGeo.computeVertexNormals();
  const skirtMesh=new T.Mesh(skirtGeo,new T.MeshStandardMaterial({color:'#67745c',roughness:1,side:T.DoubleSide}));skirtMesh.name='Continuous terrain edge';group.add(skirtMesh);
  const walls=[],roofs=[],details=[];let buildingCount=0;
  for(const building of architecture.buildings){
    const points=building.points.map(p=>geoToWorld(...p)),cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;
    const radius=Math.max(...points.map(([x,z])=>Math.hypot(x-cx,z-cz)));
    if(Math.abs(cx)>137||Math.abs(cz)>118||relief.distance(cx,cz)<3+radius||points.some(([x,z])=>Math.abs(x)>140||Math.abs(z)>121))continue;
    const base=relief.height(cx,cz),height=clamp(building.height*.10,.75,10);
    const geometry=new T.ExtrudeGeometry(flatShape(points),{depth:height,bevelEnabled:false,curveSegments:1});geometry.rotateX(-Math.PI/2);geometry.translate(0,base,0);
    const pos=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
    for(let i=0;i<pos.count;i++)uv.setXY(i,(Math.abs(normal.getX(i))>.5?pos.getZ(i):pos.getX(i))*3,(pos.getY(i)-base)*3);
    walls.push(geometry);buildingCount++;
    const roof=new T.ShapeGeometry(flatShape(points));roof.rotateX(-Math.PI/2);roof.translate(0,base+height+.006,0);roofs.push(roof);
    if(height>1.3){const g=new T.BoxGeometry(.16,.12,.22);g.translate(cx,base+height+.07,cz);details.push(g);}
  }
  if(facadeTexture){facadeTexture.wrapS=facadeTexture.wrapT=T.RepeatWrapping;facadeTexture.colorSpace=T.SRGBColorSpace;}
  joined(walls,new T.MeshStandardMaterial({color:'#e0d6bd',map:facadeTexture,roughness:.78}),'Mapped buildings — textured walls',group);
  joined(roofs,new T.MeshStandardMaterial({color:'#a7a78e',roughness:.92}),'Mapped rooftops',group);
  joined(details,new T.MeshStandardMaterial({color:'#c1c6bd',metalness:.35,roughness:.65}),'Rooftop service details',group);
  const roads=[];
  for(const road of architecture.roads){
    const points=road.points.map(p=>geoToWorld(...p)),width=['motorway','trunk','primary'].includes(road.kind)?.32:.14;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length>10||length<.03)continue;
      const count=Math.ceil(length/.6);
      for(let j=0;j<count;j++){
        const ax=T.MathUtils.lerp(a[0],b[0],j/count),az=T.MathUtils.lerp(a[1],b[1],j/count),bx=T.MathUtils.lerp(a[0],b[0],(j+1)/count),bz=T.MathUtils.lerp(a[1],b[1],(j+1)/count);
        if(Math.abs(ax)>139||Math.abs(az)>120||relief.distance(ax,az)<2.3)continue;
        const g=new T.PlaneGeometry(width,Math.hypot(bx-ax,bz-az));g.rotateX(-Math.PI/2);g.rotateY(Math.atan2(bx-ax,bz-az));g.translate((ax+bx)/2,relief.height((ax+bx)/2,(az+bz)/2)+.035,(az+bz)/2);roads.push(g);
      }
    }
  }
  joined(roads,new T.MeshStandardMaterial({color:'#747b69',roughness:1,side:T.DoubleSide}),'Mapped road network',group);
  const waters=[];
  for(const area of architecture.water){
    const points=area.points.map(p=>geoToWorld(...p));
    if(points.some(([x,z])=>Math.abs(x)>140||Math.abs(z)>121))continue;
    if(area.closed&&points.length>3){const g=new T.ShapeGeometry(flatShape(points));g.rotateX(-Math.PI/2);g.translate(0,.01,0);waters.push(g);}
    else for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>40||d<.001)continue;
      const nx=-(b[1]-a[1])/d*.22,nz=(b[0]-a[0])/d*.22;
      const corners=[[a[0]+nx,a[1]+nz],[a[0]-nx,a[1]-nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz]];
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,1,2,2,1,3].flatMap(i=>{const [x,z]=corners[i];return [x,relief.height(x,z)+.025,z];}),3));g.setIndex([0,1,2,3,4,5]);g.computeVertexNormals();g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1,0,1,1,0,1,1],2));waters.push(g);
    }
  }
  joined(waters,new T.MeshPhysicalMaterial({color:'#4c8584',metalness:.35,roughness:.3,clearcoat:.65,side:T.DoubleSide}),'Ulhas river and mapped waterways',group);
  let seed=7123;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;},trees=[];
  for(let i=0;i<70000;i++){
    const x=(random()-.5)*270,z=(random()-.5)*232,h=relief.height(x,z);
    if(h<2.8||relief.distance(x,z)<5)continue;trees.push({x,z,h,scale:.35+random()*.45});
  }
  const crownParts=[[-.28,.1,0,.65],[.28,.15,.05,.7],[0,.55,0,.62]].map(([x,y,z,r])=>{const g=new T.SphereGeometry(r,9,7);g.translate(x,y,z);return g;});const crownGeometry=mergeGeometries(crownParts,false);crownParts.forEach(g=>g.dispose());
  const foliage=new T.InstancedMesh(crownGeometry,new T.MeshStandardMaterial({color:'#45633b',roughness:1}),trees.length),dummy=new T.Object3D(),treeColor=new T.Color();
  trees.forEach((tree,i)=>{dummy.position.set(tree.x,tree.h+tree.scale*.6,tree.z);dummy.scale.set(tree.scale*.65,tree.scale,tree.scale*.65);dummy.rotation.y=random()*Math.PI;dummy.updateMatrix();foliage.setMatrixAt(i,dummy.matrix);treeColor.setHSL(.25+random()*.06,.2+random()*.15,.19+random()*.09);foliage.setColorAt(i,treeColor);});
  foliage.name='Instanced hillside woodland';foliage.castShadow=true;foliage.receiveShadow=true;group.add(foliage);
  group.userData={source:'Mapzen elevation / OpenStreetMap architecture',buildingCount,treeCount:trees.length,verticalExaggeration:3};
  return {group,...relief};
}
