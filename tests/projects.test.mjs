import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {filterProjects,projectsForCity,demoProject,bundledProjects} from '../lib/projects.js';
import {buildSite,towerLayout} from '../public/scenes/sai-world-dreams/model.js';
import {catalogFiltersFromQuery,searchCatalog} from '../lib/catalog-search.js';
import * as T from '../public/scenes/sai-world-dreams/vendor/three.module.js';
test('the homepage filter searches all projects and every station lists only its local projects',()=>{
  const all=projectsForCity([...bundledProjects].reverse());
  const filter=catalogFiltersFromQuery({bhk:'2',status:'under-construction'});
  assert.deepEqual(searchCatalog(all,filter).map(project=>project.id),['sai-world-dreams','venus-skky-city','elements-new-panvel']);
  assert.deepEqual(searchCatalog(all,{...filter,bhk:['2.5']}).map(project=>project.id),['sai-world-dreams']);
  assert.equal(searchCatalog(all,{...filter,statuses:['ready-to-move']}).length,0);
  assert.deepEqual(projectsForCity(all,'dombivli').map(project=>project.id),['venus-skky-city','sai-world-dreams']);
  assert.deepEqual(projectsForCity(all,'panvel').map(project=>project.id),['elements-new-panvel']);
  assert.equal(projectsForCity(all,'kalyan').length,0);
  assert.equal(projectsForCity([{...demoProject,published:false}],'dombivli').length,0);
});
test('city catalog filters search project details and configuration without changing the source list',()=>{
  const projects=[demoProject,{...demoProject,id:'other',name:'Green Heights',location:'Kalyan',configuration:'2 BHK',price:'₹1 Cr'}];
  assert.deepEqual(filterProjects(projects,{query:'kalyan'}).map(project=>project.id),['other']);
  assert.deepEqual(filterProjects(projects,{configuration:'2 BHK'}).map(project=>project.id),['other']);
  assert.equal(filterProjects(projects,{query:'not found'}).length,0);
  assert.equal(projects.length,2);
});
test('the imported colony builds with eight selectable buildings and matches manifest identities',()=>{
  const model=buildSite(),nodes=demoProject.manifest.nodes.filter(n=>n.type==='building');
  assert.equal(model.towers.length,8);assert.equal(nodes.length,8);
  for(const [index,tower] of model.towers.entries()){
    assert.equal(tower.userData.towerId,towerLayout[index].id);assert.equal(nodes[index].id,'tower-'+tower.userData.towerId);
    const bounds=new T.Box3().setFromObject(tower);assert.ok(!bounds.isEmpty());assert.ok(bounds.getSize(new T.Vector3()).y>90);
  }
  const geometries=new Set(),materials=new Set();for(const root of [model.root,model.context])root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
});
test('all local viewer imports and texture requests resolve to packaged assets',async()=>{
  const base=new URL('../public/scenes/sai-world-dreams/',import.meta.url),seen=new Set();
  async function module(file){if(seen.has(file.pathname))return;seen.add(file.pathname);const source=await readFile(file,'utf8');for(const match of source.matchAll(/from\s*['"]([^'"]+)['"]/g)){if(!match[1].startsWith('.'))continue;const dep=new URL(match[1],file);dep.search='';await module(dep);}}
  for(const entry of ['app.js','floor-plans.js','bridge.js','viewer.js'])await module(new URL(entry,base));assert.ok(seen.size>10);
  for(const name of ['environment.hdr','residential-facades.glb','canopy-spray.webp','stone.jpg','stone-bump.jpg','grass.jpg','water-bump.jpg','asphalt.jpg','pool-pattern.jpg','wood-deck.jpg','clerestory.jpg','posters-west.jpg','posters-east.jpg','arcade-glass.jpg','shop-display.jpg','shop-upper.jpg','plaza-relief.jpg',...['center','left','right'].flatMap(n=>[`facade-35-${n}.jpg`,...['roughness','metalness','glass'].map(s=>`facade-35-${n}-${s}.jpg`)])])assert.ok((await stat(new URL('assets/'+name,base))).size>0,name);
  const bytes=await readFile(new URL('assets/residential-facades.glb',base));assert.equal(bytes.subarray(0,4).toString(),'glTF');assert.equal(createHash('sha256').update(bytes).digest('hex').length,64);
});
