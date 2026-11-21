import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {transform} from 'esbuild';
import React,{act} from 'react';
import {Window} from './helpers/scene-dom.mjs';
const require=createRequire(import.meta.url);
test('AI chat asks first, submits a conversation, escapes replies, retries and hands off to enquiry',async()=>{
 const win=new Window(),previous={window:globalThis.window,document:globalThis.document,FormData:globalThis.FormData,fetch:globalThis.fetch,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:win,document:win.document,FormData:win.FormData,IS_REACT_ACT_ENVIRONMENT:true});
 const payloads=[];let complete;
 globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/chat');payloads.push(JSON.parse(options.body));return new Promise(resolve=>{complete=resolve;});};
 let source=await readFile(new URL('../components/ProjectAssistant.jsx',import.meta.url),'utf8');
 source=source.replace("import Link from 'next/link';","const Link=({children,...props})=>React.createElement('a',props,children);")
  .replace("import {useSite} from './SiteProvider.jsx';","const useSite=()=>({properties:[]});")
  .replace("import EnquiryForm from './EnquiryForm.jsx';","const EnquiryForm=({project})=>React.createElement('div',{'data-enquiry-project':project},'Secure enquiry form');")
  .replace(/from '(react|\.\.\/lib\/catalog-search.js|\.\.\/lib\/chat.js)'/g,(_,id)=>`from '${id==='react'?pathToFileURL(require.resolve('react')).href:new URL(id,new URL('../components/',import.meta.url)).href}'`);
 source=`import React from '${pathToFileURL(require.resolve('react')).href}';\n`+source;
 const {code}=await transform(source,{loader:'jsx',format:'esm'});const {default:Assistant}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const {createRoot}=await import('react-dom/client'),host=win.document.createElement('div');win.document.body.append(host);const root=createRoot(host);
 const click=selector=>host.querySelector(selector).click();
 try{
  await act(()=>root.render(React.createElement(Assistant)));
  await act(()=>click('.assistant-launcher'));assert.match(host.querySelector('[role=log]').textContent,/What are you looking for today/);assert.match(host.textContent,/processed by Google/);
  await act(()=>click('.chat-starters button'));assert.equal(payloads[0].messages[0].role,'user');assert.match(payloads[0].messages[0].content,/looking for a home/);assert.match(host.querySelector('[role=status]').textContent,/Thinking/);assert.equal(host.querySelector('[aria-label="Send message"]').disabled,true);
  await act(()=>complete(Response.json({reply:'Venus Skky City could suit you. <img src=x onerror=alert(1)> What is your budget?',projects:[{id:'venus-skky-city',name:'Venus Skky City',href:'/projects/venus-skky-city',location:'Dombivli East',price:'₹42.25 L onwards'}]})));
  assert.equal(host.querySelector('.chat-message img'),null);assert.match(host.querySelector('[role=log]').textContent,/<img/);assert.equal(host.querySelector('.chat-project a').getAttribute('href'),'/projects/venus-skky-city');
  await act(()=>click('.chat-project button'));assert.equal(host.querySelector('[data-enquiry-project]').getAttribute('data-enquiry-project'),'Venus Skky City');
  await act(()=>click('.assistant-tabs button'));assert.match(host.querySelector('[role=log]').textContent,/What is your budget/);
  await act(()=>click('[aria-label="Close assistant"]'));await act(()=>click('.assistant-launcher'));assert.match(host.querySelector('[role=log]').textContent,/What is your budget/);
  await act(()=>click('[aria-label="Start a new conversation"]'));assert.equal(host.querySelector('.chat-project'),null);
  await act(()=>click('.chat-starters button'));await act(()=>complete(Response.json({error:'Temporarily unavailable.'},{status:503})));assert.match(host.querySelector('[role=alert]').textContent,/Temporarily unavailable/);assert.match(host.querySelector('textarea').value,/looking for a home/);
  await act(()=>click('.chat-error button'));assert.equal(payloads.at(-1).messages.length,1);await act(()=>complete(Response.json({reply:'Which location do you prefer?',projects:[]})));assert.match(host.querySelector('[role=log]').textContent,/Which location/);assert.equal(host.querySelector('[role=alert]'),null);
 }finally{await act(()=>root.unmount());for(const [key,value] of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}await win.happyDOM.close();}
});
