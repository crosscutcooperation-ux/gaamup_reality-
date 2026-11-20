import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SCAN_MODEL_URL} from '../lib/scanned-landscape.js';
test('the CDN railway retains every source photograph and triangle within its download budget',async()=>{
 const bytes=await readFile(new URL('../public'+SCAN_MODEL_URL,import.meta.url));
 assert.ok(bytes.length<13_000_000,'The map must stay below 13 MB before transport compression');
 const size=bytes.readUInt32LE(12),doc=JSON.parse(bytes.subarray(20,20+size)),binary=bytes.subarray(28+size);
 assert.ok(doc.extensionsRequired.includes('KHR_draco_mesh_compression'));
 const hashes=doc.images.map(image=>{const view=doc.bufferViews[image.bufferView];return createHash('sha256').update(binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength)).digest('hex');}).sort();
 assert.deepEqual(hashes,["4672b2466dbb0d457c0d70a2e9ca2c559a5ac0163285112c4d07b4e7a44b03c5", "495b5d304ce431de53a60ce66b76632b3b820c8a2aa3a0614495f6a7b01f7df7", "49921433ae8e757613620a36f9a2e3ef7b637d12edec220a3b4693555496b343", "544bd4265ddb5bf0ba995e974b69ef5c945d31f5626f473334c963b93c34eff8", "54827ec4dc11b61c8034b0afd4bb9d1e7d1df55ecd40f3bc22b0a5d4921f493f", "798329512f724f325946e3a0729b60ab59448daa121e96194a04cd90cf467dc6", "92e1f0f328394af01efa8b5553b11e304b68e7d24b7251ce6f9f3edade2e3146", "982d9837f02e01618f51fb6943ad737c7536b86c1dcddb63a6b721c06eeb6f90", "bd2c65c76cce7126184903b21cb58f1fc26198b442a921557983118a08b97f1f", "cec5557f306c0932e1a4d3817ccd008b86dae09f32922587c633b4487a0888ba", "d5f207cee5e391439bb514171fb6c0fd4720a3b16fe9ffc11dac0b49bf500ebe", "e5ea0ac6e2688cba58a306bf2a7186a80511f3970d28e08b76f106b5928cc2b4", "f4d0197b10684038a0035323e66a923c6e8aa9070f099d7ab3ebab297bd1f707"]);
 const triangles=doc.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+doc.accessors[p.indices].count/3,0);
 assert.equal(triangles,589799,'Compression retains all source triangles');
});

 test("landscape cache revisions match the exact deployed asset bytes",async()=>{
 const {LANDSCAPE_ASSETS}=await import("../lib/landscape-assets.js");
 for(const url of Object.values(LANDSCAPE_ASSETS)){const bytes=await readFile(new URL("../public"+url,import.meta.url));assert.equal(new URL(url,"https://example.com").searchParams.get("v"),createHash("sha256").update(bytes).digest("hex").slice(0,12));}
 });
