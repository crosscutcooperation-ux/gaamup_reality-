import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolveApartmentModel} from '../public/scenes/sai-world-dreams/apartment-models.js';
const root=new URL('../public/scenes/sai-world-dreams/',import.meta.url);
test('all supplied house numbers select a complete furnished apartment from the matching tower and configuration',async()=>{
  const previous=globalThis.fetch;
  globalThis.fetch=async path=>new Response(await readFile(new URL(path,root)));
  try{
    const index=JSON.parse(await readFile(new URL('assets/apartments/index.json',root)));
    assert.equal(Object.keys(index.apartments).length,71);
    for(const name of (await readdir(new URL('assets/plans/',root))).filter(n=>n.endsWith('-units.json'))){
      const tower=name.split('-')[0],floor=name.startsWith('breeze-low')?8:15;
      const data=JSON.parse(await readFile(new URL('assets/plans/'+name,root)));
      for(const unit of data.units){
        const model=await resolveApartmentModel(tower,floor,unit.id);
        assert.equal(model.tower,tower);assert.equal(model.unit,unit.id);
        assert.equal(model.bedrooms,parseFloat(unit.type),`${name} apartment ${unit.id}`);
      }
    }
    const orchard=await resolveApartmentModel('orchard',9,'01'),spring=await resolveApartmentModel('spring',9,'01');
    assert.equal(orchard.url,spring.url);assert.equal(orchard.sharedReference,'spring');
    await assert.rejects(()=>resolveApartmentModel('castle',9,'99'),/not supplied/);
    for(const model of Object.values(index.apartments)){
      const bytes=await readFile(new URL(model.url.split('?')[0],root));
      assert.equal(bytes.length,model.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),model.sha256);
      assert.equal(bytes.subarray(0,4).toString(),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);
      const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
      assert.ok(json.meshes.length>100,'Complete apartment geometry, furniture and fittings');
      assert.ok(json.images.length>=5,'Embedded material textures');
      assert.ok(json.nodes.some(n=>/kitchen/i.test(n.name||'')),'The kitchen is included');
      assert.ok(json.nodes.some(n=>/bed/i.test(n.name||'')),'The bedrooms are included');
    }
  }finally{globalThis.fetch=previous;}
});
