import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {transform} from 'esbuild';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import {Window} from './helpers/scene-dom.mjs';
import * as T from '../public/scenes/sai-world-dreams/vendor/three.module.js';
import {createSceneGuidance} from '../public/scenes/venus-skky-city/scene-guidance.js';
const require=createRequire(import.meta.url);

test('each property photograph opens its project and the save control remains independent',async()=>{
 let source=await readFile(new URL('../components/PropertyCollection.jsx',import.meta.url),'utf8');
 source=source.replace("import Link from 'next/link';","const Link=({children,prefetch,...props})=>React.createElement('a',props,children);")
  .replace("import {useSite} from './SiteProvider.jsx';","const useSite=()=>({saved:[],toggleSaved(){},showProperty(){}});")
  .replace(/from '(react|\.\.\/lib\/backend.js|\.\.\/lib\/property-collection.js)'/g,(_,id)=>`from '${id==='react'?pathToFileURL(require.resolve('react')).href:new URL(id, new URL('../components/',import.meta.url)).href}'`);
 source=`import React from '${pathToFileURL(require.resolve('react')).href}';\n`+source;
 const {code}=await transform(source,{loader:'jsx',format:'esm',jsx:'transform'});
 const {default:Collection}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const win=new Window();win.document.body.innerHTML=renderToStaticMarkup(React.createElement(Collection,{properties:[{id:'sai',name:'Sai World Dreams',projectHref:'/projects/sai-world-dreams?city=dombivli',image:'sai.webp',bhk:'2 BHK'}]}));
 const image=win.document.querySelector('.property-image-link'),save=win.document.querySelector('.save-property');
 assert.equal(image.tagName,'A');assert.equal(image.getAttribute('href'),'/projects/sai-world-dreams?city=dombivli');assert.ok(image.querySelector('img'));assert.equal(image.getAttribute('aria-label'),'Explore Sai World Dreams');assert.equal(save.closest('a'),null);await win.happyDOM.close();
});

test('Elements uses the same replayable building and floor guide as Venus',async()=>{
 const win=new Window();globalThis.document=win.document;globalThis.CustomEvent=win.CustomEvent;
 document.body.innerHTML='<div id="viewport"></div><button id="show-scene-help"></button><div class="detail-stage"></div>';
 const host=document.getElementById('viewport');Object.defineProperties(host,{clientWidth:{value:900},clientHeight:{value:700}});
 const camera=new T.PerspectiveCamera(45,900/700,.1,500);camera.position.set(0,100,180);camera.lookAt(0,40,0);camera.updateMatrixWorld();
 const towers=['Tower 1','Tower 2'].map((name,i)=>{const g=new T.Group();g.position.x=i*15;g.userData={name,id:'T'+(i+1)};return g;}),calls=[];
 const guide=createSceneGuidance({camera,towers,host,focusTower:id=>calls.push(id),targetNames:['Tower 1','Tower 2'],floorHost:document.querySelector('.detail-stage'),unitHost:null});
 try{guide.update(0,true);const button=document.querySelector('.architecture-guide');assert.equal(button.hidden,false);assert.match(button.textContent,/Tower 1/);button.click();assert.deepEqual(calls,['T1']);guide.update(1,true);assert.equal(button.hidden,true);document.getElementById('show-scene-help').click();guide.update(2,true);assert.equal(button.hidden,false);guide.complete();guide.update(3,true);assert.equal(button.hidden,true);assert.match(document.querySelector('.detail-stage .level-guide').textContent,/Choose a floor/);}finally{guide.dispose();await win.happyDOM.close();}
 const html=await readFile(new URL('../public/scenes/elements-new-panvel/index.html',import.meta.url),'utf8');assert.match(html,/sai-world-dreams\/explorer.css/);
});

 test("production CSP permits embedded GLB texture fetches while keeping network origins bounded",async()=>{
 const config=await readFile(new URL("../deploy/gaamup-security-headers.conf",import.meta.url),"utf8");
 const connect=config.match(/connect-src ([^;]+)/)[1].split(/\s+/);assert.deepEqual(connect,["'self'","blob:","https://challenges.cloudflare.com"]);assert.match(config,/object-src 'none'/);assert.match(config,/frame-ancestors 'self'/);
 });
