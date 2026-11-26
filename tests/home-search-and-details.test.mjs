import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {transform} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Window} from './helpers/scene-dom.mjs';
import {locationSearchUrl} from '../lib/location-search.js';
import {catalogFiltersFromQuery,searchCatalog,projectFacts} from '../lib/catalog-search.js';
import {bundledProjects,projectsForCity} from '../lib/projects.js';
const require=createRequire(import.meta.url);

test('homepage choices survive the URL and filter real published projects together',()=>{
 for(const [city,bhk,status,terms,expected] of [
  ['dombivli','2.5','under-construction',[],['sai-world-dreams']],
  ['panvel','2','under-construction',[],['elements-new-panvel']],
  ['','1','under-construction',['Venus'],['venus-skky-city']],
  ['','2','ready-to-move',[],[]],
 ]){
  const url=new URL(locationSearchUrl(city,terms,{bhk,status}),'https://example.com');
  const filters=catalogFiltersFromQuery({...Object.fromEntries(url.searchParams),place:url.searchParams.getAll('place')});
  assert.deepEqual(searchCatalog(projectsForCity(bundledProjects,city),filters).map(p=>p.id),expected);
 }
 assert.equal(locationSearchUrl('../admin',[],{bhk:'99',status:'anything'}),'/locations');
});

test('published sales updates retain every tower-specific amount, carpet area and timeline',()=>{
 const [sai,venus,elements]=bundledProjects,sw=projectFacts(sai),v=projectFacts(venus);
 assert.equal(sai.price,'₹52.50 L onwards');assert.equal(venus.price,'₹42.25 L onwards');
 assert.equal(sw.offers.length,10);assert.equal(v.offers.length,3);
 assert.deepEqual(sw.offers.map(o=>o.amount),[8499000,13900000,5550000,7099000,8499000,11000000,13900000,5250000,8399000,9599000]);
 assert.deepEqual(v.offers.map(o=>[o.tower,o.carpet,o.amount,o.possession]),[['Tower A','436',4225000,'December 2028'],['Tower A','522',5200000,'December 2028'],['Tower F','572',6150000,'December 2027']]);
 assert.equal(v.offers[2].price,'₹61.50 L + taxes');assert.equal(v.offers[2].status,'Nearing possession');
 assert.equal(elements.price,'Price on request');
 for(const p of bundledProjects){assert.ok(projectFacts(p).address);assert.ok(projectFacts(p).addressSource);}
 assert.deepEqual(searchCatalog(bundledProjects,{maxPrice:'5000000'}).map(p=>p.id),['balaji-classica','venus-skky-city']);
});

test('project pages render supplied offers and a lazy map with real directions for every address',async()=>{
 let source=await readFile(new URL('../components/ProjectDetails.jsx',import.meta.url),'utf8');
 source=source.replace("import Link from 'next/link';","const Link=({children,...props})=>React.createElement('a',props,children);")
  .replace("'../lib/catalog-search.js'",JSON.stringify(new URL('../lib/catalog-search.js',import.meta.url).href));
 source=`import React from '${pathToFileURL(require.resolve('react')).href}';\n`+source;
 const {code}=await transform(source,{loader:'jsx',format:'esm'});
 const {default:Details}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const win=new Window();
 try{for(const project of bundledProjects){
  win.document.body.innerHTML=renderToStaticMarkup(React.createElement(Details,{project}));
  assert.equal(win.document.querySelector('address').textContent,projectFacts(project).address);
  const map=win.document.querySelector('iframe'),src=new URL(map.src);
  assert.equal(map.getAttribute('loading'),'lazy');assert.equal(src.hostname,'www.google.com');assert.equal(src.searchParams.get('q'),projectFacts(project).address);
  assert.equal(win.document.querySelectorAll('tbody tr').length,projectFacts(project).offers.length);
  const cost=win.document.querySelector('.project-price-note a');if(cost)assert.equal(new URL(cost.href,'https://example.com').searchParams.get('project'),project.name);
 }}finally{await win.happyDOM.close();}
 const config=await readFile(new URL('../deploy/gaamup-security-headers.conf',import.meta.url),'utf8');
 assert.deepEqual(config.match(/frame-src ([^;]+)/)[1].split(/\s+/),["'self'",'https://challenges.cloudflare.com','https://www.google.com']);
});


test('the homepage form submits the chosen city, bedroom and construction selections',async()=>{
 const win=new Window(),prior={window:globalThis.window,document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,FormData:globalThis.FormData,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 globalThis.window=win;globalThis.document=win.document;globalThis.FormData=win.FormData;globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 let pushed='';globalThis.__homeSearchPush=href=>{pushed=href;};
 let source=await readFile(new URL('../components/PropertyFilters.jsx',import.meta.url),'utf8');
 source=source.replace("import {useRouter} from 'next/navigation';","const useRouter=()=>({push:globalThis.__homeSearchPush});")
  .replace("import {useSite} from './SiteProvider.jsx';","const useSite=()=>({properties:[]});")
  .replace(/from '(react|\.\.\/lib\/catalog.js|\.\.\/lib\/location-search.js)'/g,(_,id)=>`from '${id==='react'?pathToFileURL(require.resolve('react')).href:new URL(id,new URL('../components/',import.meta.url)).href}'`);
 source=`import React from '${pathToFileURL(require.resolve('react')).href}';\n`+source;
 const {code}=await transform(source,{loader:'jsx',format:'esm'});
 const {default:Filters}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const {createRoot}=await import('react-dom/client'),{act}=await import('react');
 const host=win.document.createElement('div');win.document.body.append(host);const root=createRoot(host);
 try{
  await act(()=>root.render(React.createElement(Filters)));
  const selects=host.querySelectorAll('select');assert.equal(selects.length,3);
  await act(()=>{for(const [i,value] of ['panvel','2','under-construction'].entries()){selects[i].value=value;selects[i].dispatchEvent(new win.Event('change',{bubbles:true}));}});
  assert.match(host.querySelector('[type=submit]').textContent,/Find my home/);
  await act(()=>host.querySelector('form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(pushed,'/locations/panvel?bhk=2&status=under-construction');
 }finally{await act(()=>root.unmount());for(const [key,value] of Object.entries(prior)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}delete globalThis.__homeSearchPush;await win.happyDOM.close();}
});
