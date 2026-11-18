import test from 'node:test';import assert from 'node:assert/strict';import {readFile,stat} from 'node:fs/promises';import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),scene=new URL('public/scenes/venus-skky-city/',root);
test('all numbered Venus apartments bind complete self-contained GLBs with preserved source hashes',async()=>{
 const index=JSON.parse(await readFile(new URL('assets/apartments/index.json',scene))),ids=[];assert.equal(Object.keys(index.units).length,61);assert.equal(index.alternatives.length,3);
 for(const b of ['A','C','F','lavista','aristo']){const layout=JSON.parse(await readFile(new URL('assets/plans/'+b+'.json',scene)));for(const unit of layout.units){ids.push(unit.id);const entry=index.units[unit.id];assert.ok(entry);assert.equal(entry.building,b);assert.equal(entry.bedrooms,unit.beds);assert.equal(String(entry.flat).padStart(2,'0'),String(unit.flat).padStart(2,'0'));}}
 for(const unit of [...Object.values(index.units),...index.alternatives]){assert.match(unit.url,/^\/scene-assets\/venus-apartments\/[A-Za-z0-9-]+\.glb$/);const file=new URL('backend/data'+unit.url,root),bytes=await readFile(file);assert.equal(bytes.length,unit.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),unit.sha256);assert.equal(bytes.subarray(0,4).toString(),'glTF');const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));assert.ok(json.meshes.length>15);assert.ok((json.buffers||[]).every(b=>!b.uri));assert.ok((json.images||[]).every(i=>!i.uri||i.uri.startsWith('data:')));}
 assert.equal(new Set(ids).size,61);
});
test('every apartment has its own generated 2D and furnished images and every floor selector is available',async()=>{
 const manifest=JSON.parse(await readFile(new URL('assets/plans/generated/manifest.json',scene)));assert.equal(manifest.units.length,61);const furnishedHashes=new Set();
 for(const unit of manifest.units){assert.ok(unit.rotate);assert.match(unit.plan,/-2d-clean\.webp$/);for(const path of [unit.plan,unit.furnished])assert.ok((await stat(new URL('assets/plans/'+path,scene))).size>10000,path);furnishedHashes.add(createHash('sha256').update(await readFile(new URL('assets/plans/'+unit.furnished,scene))).digest('hex'));}
 assert.equal(furnishedHashes.size,61);for(const b of ['A','C','F','lavista','aristo'])assert.ok((await stat(new URL('assets/plans/generated/'+b+'-selector.webp',scene))).size>100000);
});
