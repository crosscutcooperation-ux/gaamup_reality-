import assert from 'node:assert/strict';
import {cities,railwayStations} from '../lib/catalog.js';
import {getDisplayProperties,projectProperties} from '../lib/property-collection.js';
import {projectsForCity} from '../lib/projects.js';
const base=process.env.AERO_TEST_BASE_URL||'http://127.0.0.1:4173';
const catalogue=await fetch(base+'/api/catalog');assert.equal(catalogue.status,200);assert.match(catalogue.headers.get('content-type'),/json/);assert.equal(catalogue.headers.get('location'),null);const data=await catalogue.json();assert.equal(data.cities.length,cities.length);const projectRecords=await (await fetch(base+'/api/projects')).json();const featured=projectProperties(projectRecords,data.properties);
const home=await fetch(base);assert.equal(home.status,200);assert.match(home.headers.get('content-type'),/text\/html/);assert.equal(home.headers.get('x-powered-by'),null);const html=await home.text();
assert.match(html,/<section class="hero"[^>]*><\/section>/);
assert.equal((html.match(/<article class="project-card"/g)||[]).length,featured.length);
assert.equal((html.match(/<button type="button" class="station station-arrow"/g)||[]).length,railwayStations.length);
assert.equal((html.match(/class="builder"/g)||[]).length,2);
assert.match(html,/Gaamup reality/);assert.match(html,/brokerage-badge/);assert.match(html,/0%/);assert.match(html,/gaamup-mark.png/);
assert.ok(!html.includes('Placeholder residence'));assert.ok(!html.includes('Godrej Greenfront'));assert.ok(!html.includes('L&amp;T Evara'));assert.ok(!html.includes('Find your home'));
assert.match(html,/class="filter-explore" href="\/locations\/dombivli"/);
assert.equal((html.match(/class="property-track"/g)||[]).length,2);
assert.match(html,/Under construction/);assert.match(html,/1 BHK/);
assert.match(html,/station-click-guide|Preparing your journey/);
assert.match(html,/railway-frame locked-map/);assert.ok(!html.includes('class="sketchfab-map"'));
for(const removed of ['class="hero-foot"','THE AERO LINE','01 / YOUR NEXT DESTINATION','class="map-hud"','class="map-foot"'])assert.ok(!html.includes(removed),removed+' is removed');
for(const city of railwayStations)assert.ok(html.includes('<strong>'+city.name+'</strong>'),'Station names stay visible');
for(const asset of ['woodland-surroundings.webp','journey-cloud-cumulus.webp','surroundings-height.json','scan-edge-mask.png','generated-scenery.json'])assert.equal((await fetch(base+'/assets/landscape/'+asset)).status,200,asset);


assert.equal((await fetch(base+'/models/mumbai-ac-local.glb')).status,200);
const landscape=await fetch(base+'/models/nature-landscape.glb',{headers:{Range:'bytes=0-1023'}});assert.equal(landscape.status,206);assert.equal((await landscape.arrayBuffer()).byteLength,1024);assert.match(html,/Laslo.S/);assert.match(html,/CC BY 4.0/);for(const name of ['manifest.json','grounding-validation.json','preview.webp'])assert.equal((await fetch(base+'/assets/landscape/'+name)).status,200);
const health=await fetch(base+'/api/health');assert.equal((await health.json()).runtime,'rust');
assert.equal((await fetch(base+'/api/admin/properties')).status,401);
const admin=await fetch(base+'/admin');assert.equal(admin.status,200);assert.match(await admin.text(),/Open your property desk/);
for(const city of cities){const response=await fetch(base+'/locations/'+city.slug);assert.equal(response.status,200,city.name);const page=await response.text();assert.match(page,/<main id="destination"/);assert.match(page,/Sai World Dreams/);assert.match(page,/\/projects\/sai-world-dreams\?city=/);assert.equal((page.match(/<article class="catalog-card listing-card"/g)||[]).length,projectsForCity(projectRecords,city.slug).length);if(city.slug==='dombivli'){assert.match(page,/Venus Skky City/);assert.match(page,/Venus Nirvana LLP/);assert.match(page,/Private beach/);assert.match(page,/EV charging/);}}
assert.equal((await fetch(base+'/locations/not-a-station')).status,404);
for(const asset of ['region/terrain.json','region/architecture.json','region/residential-facade.webp','fonts/repose-display.woff2'])assert.equal((await fetch(base+'/assets/'+asset)).status,200,asset);
const projects=await fetch(base+'/api/projects');assert.equal(projects.status,200);assert.equal((await projects.json())[0].slug,'sai-world-dreams');
const projectPage=await fetch(base+'/projects/sai-world-dreams?city=thane');assert.equal(projectPage.status,200);const projectHtml=await projectPage.text();assert.match(projectHtml,/rotating 3D colony/);for(const section of ['project-life','project-rhythm','project-residences','project-gallery'])assert.ok(projectHtml.includes('id="'+section+'"'));assert.match(projectHtml,/project-film.mp4/);assert.match(projectHtml,/\/locations\/thane/);assert.match(projectHtml,/\/scenes\/sai-world-dreams\/index.html/);
assert.equal((await fetch(base+'/api/admin/projects')).status,401);
for(const asset of ['index.html','viewer.js','model.js','site-environment.js','assets/dombivli-satellite-2016.jpg','assets/environment.hdr','assets/residential-facades.glb','assets/facade-35-center.jpg','vendor/fonts/helvetiker_regular.typeface.json'])assert.equal((await fetch(base+'/scenes/sai-world-dreams/'+asset)).status,200,asset);
assert.equal((await fetch(base+'/projects/unknown-project')).status,404);
console.log('HTTP smoke passed: live Rust inventory, homepage, all city catalogs, colony viewer, 3D asset APIs, property desk, admin authorization, local imagery and unknown-route 404.');

const sceneRoot='/scenes/sai-world-dreams/';
for(const asset of ['app.js','scene-guidance.js','apartment-lighting.js','bridge.js','floor-plan-data.js','floor-plans.js','floor-plan-viewer.js','tower-elevation.js','architectural-lighting.js','explorer.css','glb.html','assets/plans/castle-typical-units.json','assets/plans/castle-typical-floor.png','assets/plans/unit-sheets/p2-07-u01-2110-flat.webp','assets/plans/unit-sheets/p2-07-u01-2110-furnished.webp','apartment-models.js','assets/apartments/index.json','assets/apartments/castle/typical/01.glb','assets/apartments/spring/typical/01.glb'])assert.equal((await fetch(base+sceneRoot+asset)).status,200,asset);
const scene=await (await fetch(base+sceneRoot+'index.html')).text();assert.ok(!scene.includes('class="scene-attribution"'),'No image credit over the model');assert.ok(projectHtml.includes('project-image-credits'),'Source credit remains available outside the viewer');for(const token of ['id="elevation"','id="floor-plan-dialog"','data-lighting="night"','data-plan-mode="rotate"','id="walk-panel"'])assert.ok(scene.includes(token),token);
console.log('Full project flow assets passed: building/floor/house controllers, day/night, walkthrough, original plans, furnished images and 3D house models.');

for(const asset of ['courtyard-2400.webp','balcony-960.webp','project-film.mp4','lifestyle-film.mp4','sources.json']){const r=await fetch(base+'/projects/sai-world-dreams/media/'+asset);assert.equal(r.status,200,asset);await r.body.cancel();}
const partial=await fetch(base+'/projects/sai-world-dreams/media/project-film.mp4',{headers:{Range:'bytes=0-1023'}});assert.equal(partial.status,206);assert.equal((await partial.arrayBuffer()).byteLength,1024);
console.log('Project media passed: supplied images, two local films, byte-range video playback and complete apartment GLBs.');

assert.ok(!scene.includes('id="context"'),'The city-block control is removed');assert.ok(scene.includes('id="walk-launcher"'));assert.ok(scene.includes('Show me where to click'));
const photos=[...projectHtml.matchAll(/src="([^"]+\/media\/[^"]+-2400\.webp)"/g)].map(m=>m[1]);assert.equal(photos.length,5);assert.equal(new Set(photos).size,5,'Each supplied render appears once');assert.ok(!photos.some(url=>url.includes('night-courtyard')));
console.log('Discoverability and presentation passed: visible walk launchers, replayable guidance, no city-block control and five unique photographs.');
