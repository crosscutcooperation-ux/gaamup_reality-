import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFacts,priceRange,searchCatalog,catalogFiltersFromQuery} from '../lib/catalog-search.js';
const a={id:'a',name:'Garden Home',location:'Dombivli, Thane',configuration:'2 & 3 BHK',price:'₹75 L – ₹1.2 Cr',manifest:{catalog:{status:'under-construction',area:'700–1,200 sq.ft',developer:'Builder A',propertyType:'Apartment'}}};
const b={id:'b',name:'Bay Villa',location:'Kalyan, Thane',configuration:'4 BHK',price:'₹3 Cr',manifest:{catalog:{status:'ready-to-move',area:'2,000 sq.ft',developer:'Builder B',propertyType:'Villa'}}};
const unknown={id:'unknown',name:'The Preview',location:'Dombivli',configuration:'Residential township',price:'Price on request'};
test('catalog price ranges support mixed Lakh/Crore units and unknown prices',()=>{assert.deepEqual(priceRange(a.price),{min:7500000,max:12000000});assert.deepEqual(priceRange('₹1.2 – 1.8 Cr'),{min:12000000,max:18000000});assert.equal(priceRange('Price on request'),null);});
test('side filters combine locality, bedrooms, budget, area, type, developer and possession',()=>{
 const source=[a,b,unknown];const result=searchCatalog(source,{localities:['Dombivli'],bhk:['2'],types:['Apartment'],statuses:['under-construction'],developers:['Builder A'],minPrice:'8000000',maxPrice:'13000000',minArea:'800',maxArea:'1400'});
 assert.deepEqual(result.map(p=>p.id),['a']);assert.equal(source.length,3);
 assert.equal(searchCatalog(source,{bhk:['1']}).length,0);assert.equal(searchCatalog(source,{minPrice:'30000000',maxPrice:'10000000'}).length,0);
});
test('sorting keeps unknown prices last and search finds names and developers',()=>{
 assert.deepEqual(searchCatalog([unknown,b,a],{sort:'price-low'}).map(p=>p.id),['a','b','unknown']);assert.deepEqual(searchCatalog([unknown,b,a],{sort:'price-high'}).map(p=>p.id),['b','a','unknown']);assert.deepEqual(searchCatalog([a,b],{query:'builder b'}).map(p=>p.id),['b']);assert.equal(searchCatalog([unknown],{minPrice:'1'}).length,0);
});
test('the bundled project uses its supplied bedroom types and honest request-only prices',()=>{const p=projectFacts({...unknown,id:'sai-world-dreams'});assert.deepEqual(p.bhk,['1','2','2.5','3']);assert.equal(p.price,null);assert.equal(p.areaRange,null);assert.equal(p.developer,'Paradise Group');});

test('the Venus catalog exposes the real developer and the complete published amenity collection',()=>{const facts=projectFacts({id:'venus-skky-city',configuration:'1 & 2 BHK'});assert.equal(facts.developer,'Venus Nirvana LLP');assert.equal(facts.amenities.length,18);assert.ok(facts.amenities.includes('Private beach'));assert.ok(facts.amenities.includes('EV charging'));});

test('homepage multi-location searches match alternatives and reject unknown city paths',async()=>{
 const {locationSearchUrl}=await import('../lib/location-search.js');
 assert.equal(locationSearchUrl('panvel',[' New Panvel ','New Panvel']),'/locations/panvel?place=New+Panvel');
 assert.equal(locationSearchUrl('../admin',['Venus']),'/locations?place=Venus');
 const source=[{id:'v',name:'Venus',location:'Dombivli East',configuration:'1 & 2 BHK'},{id:'e',name:'Elements',location:'New Panvel',configuration:'1 & 2 BHK'},{id:'s',name:'Sai',location:'Dombivli',configuration:'1 BHK'}];
 assert.deepEqual(searchCatalog(source,{searchTerms:['Venus','New Panvel']}).map(p=>p.id).sort(),['e','v']);
 assert.deepEqual(catalogFiltersFromQuery({place:['Venus','New Panvel']}).searchTerms,['Venus','New Panvel']);
});
