import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
const root=new URL('../public/scenes/',import.meta.url);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco.createDecoderModule()});
const triangles=doc=>doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((n,p)=>n+p.getIndices().getCount()/3,0);
test('Venus compressed base retains the full mesh, selectable towers and materials',async()=>{
 const before=await io.read(fileURLToPath(new URL('venus-skky-city/assets/venus-skky-city-web.glb',root)));
 const path=fileURLToPath(new URL('venus-skky-city/assets/venus-site-v2.bin',root)),after=await io.read(path);
 assert.equal(triangles(after),triangles(before));
 assert.deepEqual(after.getRoot().listNodes().filter(n=>n.getExtras().kind==='tower').map(n=>n.getExtras().id),before.getRoot().listNodes().filter(n=>n.getExtras().kind==='tower').map(n=>n.getExtras().id));
 assert.equal(after.getRoot().listMaterials().length,before.getRoot().listMaterials().length);
 assert.ok((await stat(path)).size<3_000_000);
});
test('supplied detailed facades are delivered without re-encoding',async()=>{
 for(const [folder,original,served] of [['venus-skky-city','venus-detailed-facades.glb','venus-facades-v2.bin'],['elements-new-panvel','elements-towers.glb','elements-towers-v2.bin']])assert.deepEqual(await readFile(new URL(`${folder}/assets/${served}`,root)),await readFile(new URL(`${folder}/assets/${original}`,root)));
});
