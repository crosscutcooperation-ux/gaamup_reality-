import * as T from './vendor/three.module.js?v=shared-runtime-12';
export {towerSpecs} from './project-data.js';
import {towerSpecs} from './project-data.js';
export const materials={};
for(const [key,color] of Object.entries({terrain:0xe7e9e5,ivory:0xdcccb0,sand:0xc1b39f,dark:0x635d53,glass:0x86a5af,lawn:0x557649,road:0x505452,path:0xb7ab96,wood:0x856c50,water:0x49b6c1,court:0x527a70}))materials[key]=new T.MeshStandardMaterial({color,roughness:.75});
export function buildSite(){
 const root=new T.Group();root.name='Balaji Classica';
 const floor=new T.Mesh(new T.PlaneGeometry(1400,1400),materials.terrain);floor.rotation.x=-Math.PI/2;floor.position.y=-.65;floor.receiveShadow=true;floor.name='Plain ground';root.add(floor);
 const towers=towerSpecs.map(s=>{const tower=new T.Group();tower.name=s.name;tower.userData={...s};tower.position.set(s.x,0,s.z);tower.rotation.y=s.rotation;root.add(tower);return tower;});
 return {root,towers};
}
