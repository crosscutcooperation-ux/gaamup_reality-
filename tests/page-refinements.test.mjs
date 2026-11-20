import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';import sharp from 'sharp';
import config from '../next.config.mjs';
test('clean company routes retain redirects for old shared links',async()=>{
 const redirects=await config.redirects();for(const page of ['about','contact']){assert.deepEqual(redirects.find(r=>r.source===`/company/${page}.html`),{source:`/company/${page}.html`,destination:`/${page}`,permanent:true});await access(new URL(`../app/(company)/${page}/page.jsx`,import.meta.url));}
});
test('all three projects load shared back controls and early model hints',async()=>{
 for(const project of ['sai-world-dreams','venus-skky-city','elements-new-panvel']){const html=await readFile(new URL(`../public/scenes/${project}/index.html`,import.meta.url),'utf8');assert.match(html,/navigation-feedback\.css/);assert.match(html,/rel="preload" as="fetch" href="assets\/.+\.bin/);}
 for(const file of ['venus-skky-city/plan-explorer.js','elements-new-panvel/plan-explorer.js']){const code=await readFile(new URL(`../public/scenes/${file}`,import.meta.url),'utf8');assert.match(code,/id="floor-back"[^>]*>[\s\S]*?<svg aria-hidden="true"/);}
});
test('the smaller ground texture retains every pixel and full resolution',async()=>{
 const base=new URL('../public/scenes/elements-new-panvel/assets/',import.meta.url),a=await sharp(await readFile(new URL('illustrative-panvel-ground.png',base))).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(await readFile(new URL('illustrative-panvel-ground-lossless.webp',base))).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual(a.info,b.info);assert.ok(a.data.equals(b.data));
});

test('production viewers share one runtime and all bundled imports exist',async()=>{
 const base=new URL('../public/scenes/runtime/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
 let runtimeDefinitions=0;
 for(const file of manifest.files){
  const source=await readFile(new URL(file,base),'utf8');runtimeDefinitions+=(source.match(/Multiple instances of Three\.js being imported/g)||[]).length;
  for(const match of source.matchAll(/(?:from|import)\s*["'](\.\/[^"']+)["']/g))await access(new URL(match[1],base));
 }
 assert.equal(runtimeDefinitions,1);
 for(const [slug,name] of [['sai-world-dreams','sai'],['venus-skky-city','venus'],['elements-new-panvel','elements']])assert.ok((await readFile(new URL('../public/scenes/'+slug+'/index.html',import.meta.url),'utf8')).includes(manifest.entries[name]));
 const {createHash}=await import('node:crypto');
 for(const [file,hash] of Object.entries(manifest.sources))assert.equal(createHash('sha256').update(await readFile(new URL('../'+file,import.meta.url))).digest('hex'),hash,'Rebuild changed scene: '+file);
});
