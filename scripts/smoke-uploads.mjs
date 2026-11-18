import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runRust,project} from './rust.mjs';
const require=createRequire(import.meta.url),directory=await mkdtemp(path.join(tmpdir(),'aero-upload-smoke-'));
const fixtureKey='fixture-key-for-isolated-upload-tests-only-0000000000000';
const port=process.env.AERO_UPLOAD_TEST_FRONTEND_PORT||'14173',backendPort=process.env.AERO_UPLOAD_TEST_BACKEND_PORT||'14000';
const env={...process.env,AERO_DATA_DIR:directory,AERO_BACKEND_PORT:backendPort,AERO_BACKEND_URL:`http://127.0.0.1:${backendPort}`,AERO_NEXT_DIST_DIR:'.next-upload-smoke'};
const base=`http://127.0.0.1:${port}`;let backend,frontend;
async function ready(url){const deadline=Date.now()+90000;while(Date.now()<deadline){try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)return;}catch{}await new Promise(r=>setTimeout(r,250));}throw new Error('Test service did not become ready.');}
async function request(route,{body,kind,method='GET',auth=true,type='application/octet-stream'}={}){const response=await fetch(base+route,{method,headers:{...(auth?{Authorization:`Bearer ${fixtureKey}`} : {}),'Content-Type':type,...(kind?{'X-Asset-Kind':kind,'X-File-Name':encodeURIComponent('Scene – test.glb'),'X-Building-Id':'tower-A'}:{})},body,signal:AbortSignal.timeout(45000)});return {status:response.status,data:await response.json()};}
try{
  await writeFile(path.join(directory,'admin-key.txt'),fixtureKey,{mode:0o600});backend=runRust(['run'],{env,stdio:'pipe'});backend.stderr.on('data',()=>{});backend.stdout.on('data',()=>{});await ready(env.AERO_BACKEND_URL+'/api/health');
  frontend=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port',port],{cwd:project,env,stdio:'pipe'});frontend.stdout.on('data',()=>{});frontend.stderr.on('data',()=>{});await ready(base+'/api/health');
  assert.equal((await request('/api/admin/projects',{auth:false})).status,401);
  const sourceGlb=await readFile(path.join(project,'public/models/mumbai-ac-local.glb'));
  // A legal unknown GLB chunk adds fixture weight while retaining the current train scene.
  const padding=Buffer.alloc(3*1024*1024),chunk=Buffer.alloc(8);chunk.writeUInt32LE(padding.length,0);chunk.write('AERO',4);
  const glb=Buffer.concat([sourceGlb,chunk,padding]);glb.writeUInt32LE(glb.length,8);assert.ok(glb.length>10*1024*1024,'Exercise the proxy beyond its default 10 MB size.');
  const upload=await request('/api/admin/projects/sai-world-dreams/assets',{method:'POST',kind:'colony',body:glb});assert.equal(upload.status,201,JSON.stringify(upload.data));assert.equal(upload.data.bytes,glb.length);assert.equal(upload.data.name,'Scene – test.glb');
  const download=await fetch(base+upload.data.url);assert.equal(download.status,200);assert.equal(createHash('sha256').update(Buffer.from(await download.arrayBuffer())).digest('hex'),upload.data.sha256);
  assert.equal((await request('/api/admin/projects/sai-world-dreams/viewer',{method:'POST',body:JSON.stringify({assetId:upload.data.id}),type:'application/json'})).data.viewer.kind,'glb');
  const html='<!doctype html><html><body><button id="view">Orbit</button><script>document.querySelector("button").onclick=()=>document.body.dataset.clicked="yes";</script></body></html>';
  const code=await request('/api/admin/projects/sai-world-dreams/assets',{method:'POST',kind:'code',body:html,type:'text/html'});assert.equal(code.status,201);const file=await fetch(base+code.data.url);assert.equal(await file.text(),html);assert.match(file.headers.get('content-security-policy'),/^sandbox allow-scripts/);assert.ok(!file.headers.get('content-security-policy').includes('allow-same-origin'));
  const manifest={schemaVersion:1,projectId:'sai-world-dreams',nodes:[{id:'tower-A',type:'building',name:'Castle'}]};assert.equal((await request('/api/admin/projects/sai-world-dreams/assets',{method:'POST',kind:'manifest',body:JSON.stringify(manifest),type:'application/json'})).status,201);
  const data=(await request('/api/projects/sai-world-dreams',{auth:false})).data;assert.equal(data.assets.length,3);assert.equal(data.project.manifest.nodes[0].id,'tower-A');assert.equal(data.project.viewer.assetId,upload.data.id);
  const response=await fetch(base+'/projects/sai-world-dreams?city=thane');assert.equal(response.status,200);assert.match(await response.text(),/glb.html\?model=/);
  console.log('Upload HTTP smoke passed: >10 MB GLB through Next.js → Rust, exact file checksum, UTF-8 names, scene activation, sandboxed HTML, hierarchy persistence and public project rendering. Real admin data was untouched.');
}finally{
  for(const child of [frontend,backend])if(child&&!child.killed){child.kill('SIGINT');await Promise.race([new Promise(resolve=>child.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,3000))]);}
  await rm(directory,{recursive:true,force:true});
}
