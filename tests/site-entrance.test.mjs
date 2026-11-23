import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {transform} from 'esbuild';
import {Window} from 'happy-dom';
import React,{act} from 'react';
const require=createRequire(import.meta.url);
test('building entrance dismisses after 1.5 seconds and stays dismissed on rerender',async()=>{
 const win=new Window(),previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
 Object.assign(globalThis,{window:win,document:win.document,IS_REACT_ACT_ENVIRONMENT:true});
 let dismiss;
 globalThis.setTimeout=(fn,delay,...args)=>delay===1500?(dismiss=fn,-1500):previous.setTimeout(fn,delay,...args);
 globalThis.clearTimeout=id=>{if(id!==-1500)previous.clearTimeout(id);};
 let source=await readFile(new URL('../components/SiteEntrance.jsx',import.meta.url),'utf8');
 source=source.replace("import styles from './SiteEntrance.module.css';","const styles=new Proxy({},{get:(_,key)=>key});").replace("from 'react'",`from '${pathToFileURL(require.resolve('react')).href}'`);
 const {code}=await transform(`import React from '${pathToFileURL(require.resolve('react')).href}';\n${source}`,{loader:'jsx',format:'esm'});
 const {default:Entrance}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const {createRoot}=await import('react-dom/client'),host=win.document.createElement('div'),root=createRoot(host);
 try{
  await act(()=>root.render(React.createElement(Entrance)));
  assert.ok(host.querySelector('[role=status] svg'));assert.equal(typeof dismiss,'function');
  await act(()=>dismiss());assert.equal(host.querySelector('[role=status]'),null);
  await act(()=>root.render(React.createElement(Entrance)));assert.equal(host.querySelector('[role=status]'),null);
 }finally{await act(()=>root.unmount());Object.assign(globalThis,previous);win.happyDOM.abort();}
});
