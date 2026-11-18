import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import project from '../lib/elements-project.json' with {type:'json'};

const scene = new URL('../public/scenes/elements-new-panvel/', import.meta.url);

test('Elements opens through the live viewer with the established project controls', async () => {
  const [entry, code, elementsHtml, venusHtml] = await Promise.all([
    readFile(new URL('app.js', scene), 'utf8'),
    readFile(new URL('viewer.js', scene), 'utf8'),
    readFile(new URL('index.html', scene), 'utf8'),
    readFile(new URL('../venus-skky-city/index.html', scene), 'utf8'),
  ]);
  assert.match(entry, /import '\.\/viewer\.js/);
  assert.match(code, /send\('ready'/);
  assert.match(code, /createAtmosphere\(scene/);
  assert.equal(project.viewer.url, '/scenes/elements-new-panvel/index.html');
  const elements = new Window().document;
  elements.write(elementsHtml);
  const venus = new Window().document;
  venus.write(venusHtml);
  for (const id of ['explore-toggle','explore-drawer','amenity-menu','scene','fullscreen','zoom-in','zoom-out','reset','rotate','walk-launcher','walk-panel']) {
    assert.ok(venus.getElementById(id), `${id} is a reference control`);
    assert.ok(elements.getElementById(id), `${id} is present in Elements`);
  }
  for (const mode of ['day','evening','night']) assert.ok(elements.querySelector(`[data-lighting="${mode}"]`));
  for (const view of ['courtyard','aerial','street','plan']) assert.ok(elements.querySelector(`[data-view="${view}"]`));
});

test('Elements uses the supplied two-tower model, matching apartment GLBs, and local media', async () => {
  const bytes = await readFile(new URL('assets/elements-towers.glb', scene));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'aa3bca4d59033b0984faded2e3dc0a950ead0b41c1215ecc125324c84fa08a6a');
  const jsonLength = bytes.readUInt32LE(12);
  const model = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  assert.deepEqual(model.nodes.filter(node => ['T1','T2'].includes(node.extras?.id)).map(node => node.extras.id).sort(), ['T1','T2']);
  for (const name of ['stone-ivory', 'Masonry front', 'Warm grey render', 'Glazing front']) {
    const finish = model.materials.find(material => material.name === name);
    const texture = model.textures[finish.pbrMetallicRoughness.baseColorTexture.index];
    assert.ok(Number.isInteger(model.images[texture.source].bufferView), `${name} has an embedded finish`);
  }
  for (const tower of [1,2]) for (const flat of [1,2,3,4,5,6,7,8]) {
    const beds = tower === 2 && flat === 7 ? 2 : [3,4,7,8].includes(flat) ? 2 : 1;
    const name = `assets/apartments/Codename-Elements_Tower-${tower}_Flat-${String(flat).padStart(2,'0')}_${beds}BHK.glb`;
    await access(new URL(name, scene));
  }
  for (const path of ['assets/illustrative-panvel-ground.png','assets/marketing/Front View.jpg','assets/marketing/Podium View.jpg','assets/marketing/Entrance Lobby.jpg','assets/marketing/Elevation.jpg','assets/marketing/Teaser 1.mp4']) await access(new URL(path, scene));
});
