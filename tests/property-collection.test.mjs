import test from 'node:test';
import assert from 'node:assert/strict';
import {getDisplayProperties,filterProperties,propertyRows,projectProperties} from '../lib/property-collection.js';
import {bundledProjects} from '../lib/projects.js';
test('the collection shows only real inventory without inventing filler cards',()=>{
  const inventory=[{id:'real',name:'Saved home',featured:true,published:true,bhk:'2 & 3 BHK'}],before=JSON.stringify(inventory);
  const display=getDisplayProperties(inventory);assert.equal(display.length,1);assert.equal(display[0].id,'real');assert.equal(JSON.stringify(inventory),before);
  assert.deepEqual(getDisplayProperties([{id:'evara',featured:true},{id:'greenfront',featured:true},{id:'preview-1',featured:true}]),[]);
  const projects=projectProperties(bundledProjects,inventory);assert.deepEqual(propertyRows(projects).map(row=>row.length),[2,2]);
  assert.equal(projects.filter(p=>p.projectHref?.startsWith('/projects/')).length,3);
  assert.deepEqual(projectProperties(bundledProjects,[...inventory,{...projects[0]}]).map(p=>p.id),['sai-world-dreams','venus-skky-city','elements-new-panvel','real']);
});
test('bedroom and construction filters combine and preserve unknown status',()=>{
  const items=[{id:'two',bhk:'2 & 3 BHK',constructionStatus:'under-construction'},{id:'one',bhk:'1 BHK',constructionStatus:'ready-to-move'},{id:'four',bhk:'4, 5 BHK',constructionStatus:''},{id:'unknown',bhk:'2 BHK'}];
  assert.deepEqual(filterProperties(items,{bhk:'2',constructionStatus:'under-construction'}).map(p=>p.id),['two']);
  assert.deepEqual(filterProperties(items,{bhk:'4+'}).map(p=>p.id),['four']);
  assert.deepEqual(filterProperties(items,{constructionStatus:'ready-to-move'}).map(p=>p.id),['one']);
  assert.equal(filterProperties(items).length,4);
});
test('unpublished, archived and unfeatured listings stay out of the public collection',()=>{
  const display=getDisplayProperties([{id:'draft',published:false,featured:true},{id:'archive',archived:true,featured:true},{id:'normal',featured:false}]);assert.deepEqual(display,[]);
});
