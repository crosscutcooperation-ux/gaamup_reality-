import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {cities,properties,getCity,railwayStations,builders} from '../lib/catalog.js';
import {propertyImage} from '../lib/backend.js';
test('the only public stations match the two inventory locations',async()=>{
  const data=JSON.parse(await fs.readFile(new URL('../backend/seed.json',import.meta.url),'utf8'));assert.deepEqual(data.properties.map(p=>p.id),['sai-world-dreams','venus-skky-city','elements-new-panvel']);assert.deepEqual(data.builders,builders);assert.deepEqual(builders.map(b=>b.name),['Paradise Group','Venus Nirvana LLP']);assert.deepEqual(railwayStations.map(city=>city.name),['Dombivli','Panvel']);assert.deepEqual(railwayStations.map(city=>city.index),[0,1]);assert.equal(new Set(cities.map(city=>city.slug)).size,cities.length);assert.deepEqual(data.cities,cities);assert.ok(data.properties.every(property=>property.constructionStatus==='under-construction'));
});
test('property and railway images are local assets',async()=>{
  for(const image of [...properties.map(p=>p.image),'station-diamond-board.png','fonts/repose-display.woff2','landscape/scan-edge-mask.png'])await fs.access(new URL('../public'+propertyImage(image),import.meta.url));
});
test('unknown destination slugs are rejected',()=>{assert.equal(getCity('not-a-station'),undefined);assert.equal(getCity('panvel').name,'Panvel');});
