import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {loadTrainGeometry} from './helpers/load-model.mjs';import {replaceFacades} from '../public/scenes/venus-skky-city/replace-facades.js';import {prepareTownship} from '../public/scenes/venus-skky-city/scene-settings.js';
const root=new URL('../',import.meta.url);
test('the supplied detailed facades replace all nine old buildings without moving the site or changing its other objects',async()=>{
 const original=await loadTrainGeometry(new URL('public/scenes/venus-skky-city/assets/venus-skky-city-web.glb',root));
 const detailed=await loadTrainGeometry(new URL('output/venus-facade-replacement/venus-detailed-facades-decoded.glb',root));
 const old=prepareTownship(original.scene).towers,positions=new Map(old.map(t=>[t.userData.id,{position:t.position.toArray(),quaternion:t.quaternion.toArray()}]));
 const context=[];original.scene.traverse(o=>{if(o.isMesh&&!old.some(t=>{let p=o;while(p){if(p===t)return true;p=p.parent;}return false;}))context.push(o);});
 const installed=replaceFacades(original.scene,detailed.scene);assert.equal(installed.length,9);
 for(const tower of installed){const saved=positions.get(tower.userData.id);assert.deepEqual(tower.position.toArray(),saved.position);assert.deepEqual(tower.quaternion.toArray(),saved.quaternion);assert.ok(tower.userData.windowCount>900);assert.ok(tower.userData.balconyCount>300);assert.ok(tower.children.length);assert.equal(tower.userData.kind,'tower');}
 for(const t of old)assert.equal(t.parent,null);for(const o of context)assert.ok(o.parent,'Existing podium, amenities and landscape are retained');
 const supplied=await readFile('/Users/robin/Desktop/panvibes/venus-detailed-facades.glb'),served=await readFile(new URL('public/scenes/venus-skky-city/assets/venus-detailed-facades.glb',root));assert.equal(createHash('sha256').update(served).digest('hex'),createHash('sha256').update(supplied).digest('hex'));
});
