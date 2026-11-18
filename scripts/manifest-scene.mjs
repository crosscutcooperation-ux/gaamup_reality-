import {BUILDINGS,resolvePlan} from '../public/scenes/sai-world-dreams/floor-plan-data.js';
import {buildSite} from '../public/scenes/sai-world-dreams/model.js';
import * as T from '../public/scenes/sai-world-dreams/vendor/three.module.js';
import {readFile,readdir,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('../public/scenes/sai-world-dreams/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
const apartmentLibrary=JSON.parse(await readFile(new URL('assets/apartments/index.json',base),'utf8'));
const model=buildSite();model.root.updateMatrixWorld(true);
for(const tower of model.towers){const node=manifest.nodes.find(n=>n.id==='tower-'+tower.userData.towerId);const bounds=new T.Box3().setFromObject(tower);node.bounds={min:bounds.min.toArray(),max:bounds.max.toArray()};node.siteTransform=tower.matrixWorld.toArray();node.assetType='procedural-textured-exterior';if(tower.userData.sharedReference)node.sharedReference=tower.userData.sharedReference;}
manifest.assets=[];
async function visit(relative){for(const entry of await readdir(new URL(relative,base),{withFileTypes:true})){const path=relative+entry.name;if(entry.isDirectory())await visit(path+'/');else if(path!=='manifest.json'){const bytes=await readFile(new URL(path,base));manifest.assets.push({path,bytes:(await stat(new URL(path,base))).size,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
await visit('assets/');
manifest.floorPlans=[];
for(const building of BUILDINGS){
  const floors=[];
  for(let floor=0;floor<=building.floors;floor++){
    const plan=resolvePlan(building.id,floor);
    const entry={id:`${building.sceneId?'tower-'+building.sceneId:building.id}-floor-${floor}`,number:floor,available:plan.available,assignmentVerified:!!plan.verified};
    if(plan.available){entry.key=plan.key;if(plan.sharedReference)entry.sharedReference=plan.sharedReference;entry.drawing='assets/plans/'+plan.key+'-floor.png';const data=JSON.parse(await readFile(new URL('assets/plans/'+plan.key+'-units.json',base),'utf8'));entry.units=data.units.map(unit=>({id:entry.id+'-unit-'+unit.id,number:unit.id,type:unit.type,sourceKey:unit.key,layoutFamily:unit.renderPair,plan:'assets/plans/'+unit.renderPair+'-flat.webp',furnishedImage:'assets/plans/'+unit.renderPair+'-furnished.webp',model:apartmentLibrary.apartments[`${plan.sharedReference||building.id}:${building.id==='breeze'?(floor<=9?'6-9':'upper'):'typical'}:${unit.id}`]?.url??null}));}else entry.reason=plan.reason;
    floors.push(entry);
  }
  manifest.floorPlans.push({buildingId:building.sceneId?'tower-'+building.sceneId:building.id,name:building.name,floors});
}
manifest.compression={draco:false,meshopt:false,ktx2:false};manifest.assumptions=['Illustrative model units; no verified metre conversion available in source.','2D and furnished images come from the supplied repository. Complete furnished apartment GLBs come from the validated backend-program library, in metres. Typical-floor assignments remain unverified except where the source plan labels them. Orchard uses the neighbouring Spring model and plan at the user’s direction.'];
manifest.apartmentLibrary='assets/apartments/index.json';manifest.provenance.scope='Reference-led exterior reconstruction with imported complete furnished apartments; exterior dimensions and floor assignments remain approximate.';
await writeFile(new URL('manifest.json',base),JSON.stringify(manifest,null,2)+'\n');
console.log(`Scene manifest: ${manifest.assets.length} assets with hashes, eight tower bounds/transforms.`);
