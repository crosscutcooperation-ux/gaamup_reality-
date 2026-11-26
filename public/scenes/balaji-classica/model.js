import * as T from './vendor/three.module.js?v=shared-runtime-12';
export {towerSpecs} from './project-data.js';
import {towerSpecs} from './project-data.js';
export const materials={};
for(const [key,color] of Object.entries({terrain:0xe7e9e5,ivory:0xdcccb0,sand:0xc1b39f,dark:0x635d53,glass:0x86a5af,lawn:0x557649,road:0x505452,path:0xb7ab96,wood:0x856c50,water:0x49b6c1,court:0x527a70}))materials[key]=new T.MeshStandardMaterial({color,roughness:.75});
export function buildSite(){
 const root=new T.Group();root.name='Balaji Classica';
 const ground=new T.PlaneGeometry(2400,2400,64,64);ground.rotateX(-Math.PI/2);
 const positions=ground.attributes.position;for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),rise=T.MathUtils.smoothstep(Math.hypot(x,z),140,700);positions.setY(i,-.65+rise*(Math.sin(x*.006)*Math.cos(z*.005)*8+Math.sin((x+z)*.003)*4));}ground.computeVertexNormals();
 const floor=new T.Mesh(ground,materials.terrain);floor.receiveShadow=true;floor.name='Illustrative surrounding landscape';root.add(floor);
 const towers=towerSpecs.map(s=>{const tower=new T.Group();tower.name=s.name;tower.userData={...s};tower.position.set(s.x,0,s.z);tower.rotation.y=s.rotation;root.add(tower);return tower;});
 return {root,towers};
}
