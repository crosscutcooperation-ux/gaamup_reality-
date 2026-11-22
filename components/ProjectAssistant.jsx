'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useSite} from './SiteProvider.jsx';
import {catalogStatusLabels} from '../lib/catalog-search.js';
import {CHAT_GREETING,CHAT_MAX_MESSAGE,chatRequestMessages} from '../lib/chat.js';
import EnquiryForm from './EnquiryForm.jsx';

export default function ProjectAssistant(){
 const {properties}=useSite();
 const [open,setOpen]=useState(false),[mode,setMode]=useState('chat'),[project,setProject]=useState(''),[query,setQuery]=useState('');
 const [messages,setMessages]=useState([]),[draft,setDraft]=useState(''),[pendingText,setPendingText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[failed,setFailed]=useState('');
 const launcher=useRef(null),input=useRef(null),searchInput=useRef(null),log=useRef(null),pending=useRef(null);
 useEffect(()=>{
  if(open)(mode==='chat'?input:mode==='projects'?searchInput:null)?.current?.focus();
  const escape=e=>{if(e.key==='Escape'){setOpen(false);launcher.current?.focus();}};
  if(open)window.addEventListener('keydown',escape);
  return()=>window.removeEventListener('keydown',escape);
 },[open,mode]);
 useEffect(()=>{if(log.current)log.current.scrollTop=log.current.scrollHeight;},[messages,pendingText,error,open,mode]);
 useEffect(()=>()=>pending.current?.abort(),[]);
 const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 const matches=properties.filter(p=>!terms.length||terms.every(t=>`${p.name} ${p.city} ${p.locality} ${p.developer} ${p.bhk}`.toLowerCase().includes(t)));
 function enquire(name=''){setProject(name);setMode('enquiry');}
 function close(){setOpen(false);launcher.current?.focus();}
 async function send(text=draft){
  text=text.trim();if(!text||text.length>CHAT_MAX_MESSAGE||pending.current)return;
  const controller=new AbortController();pending.current=controller;setBusy(true);setPendingText(text);setDraft(current=>current.trim()===text?'':current);setError('');setFailed('');
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:chatRequestMessages(messages,text)}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(32000)])});
   const result=await response.json();if(!response.ok)throw Error(result.error||'I couldn’t reply just now. Please retry.');
   if(typeof result.reply!=='string')throw Error('That reply could not load. Please retry.');
   setMessages([...messages,{role:'user',content:text},{role:'assistant',content:result.reply,projects:Array.isArray(result.projects)?result.projects:[]}].slice(-40));
  }catch(cause){
   if(controller.signal.aborted)return;
   setError(cause.name==='TimeoutError'?'That reply took too long. Please retry, or send an enquiry.':cause.message);setFailed(text);setDraft(current=>current||text);
  }finally{if(pending.current===controller){pending.current=null;setBusy(false);setPendingText('');}}
 }
 function newChat(){if(busy)return;setProject('');setMessages([]);setDraft('');setError('');setFailed('');setMode('chat');input.current?.focus();}
 return <>
  <button className="assistant-launcher" ref={launcher} aria-label={open?'Close AI property assistant':'Open AI property assistant'} aria-expanded={open} aria-controls="property-assistant" onClick={()=>setOpen(v=>!v)}>{open?'×':'⌁'}<span>{open?'Close':'Ask Gaamup AI'}</span></button>
  {open&&<section id="property-assistant" className="property-assistant ai-assistant" role="dialog" aria-label="Gaamup AI assistant">
   <header><div><small>GAAMUP AI</small><h2>Let’s talk.</h2></div><div className="assistant-header-actions"><button type="button" aria-label="Start a new conversation" title="New conversation" onClick={newChat} disabled={busy}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></svg></button><button type="button" aria-label="Close assistant" onClick={close}>×</button></div></header>
   <nav className="assistant-tabs" aria-label="Assistant sections">{[['chat','Chat'],['projects','Projects'],['enquiry','Enquire']].map(([value,label])=><button type="button" key={value} aria-pressed={mode===value} onClick={()=>setMode(value)}>{label}</button>)}</nav>
   {mode==='chat'?<div className="assistant-chat">
    <div className="assistant-conversation" ref={log} role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation">
     <div className="chat-message assistant"><span>Gaamup AI</span><p>{CHAT_GREETING}</p></div>
     {!messages.length&&!busy&&<div className="chat-starters">{['I’m looking for a home','Compare your projects','Help with the website'].map(text=><button type="button" key={text} onClick={()=>send(text)}>{text}</button>)}</div>}
     {messages.map((message,index)=><div key={index} className={`chat-message ${message.role}`}><span>{message.role==='user'?'You':'Gaamup AI'}</span><p>{message.content}</p>{message.projects?.map(item=><div className="chat-project" key={item.id}><Link href={item.href} onClick={()=>setOpen(false)}>{item.name}</Link><p>{item.location} · {item.price}</p><button type="button" onClick={()=>enquire(item.name)}>Enquire about this project</button></div>)}</div>)}
     {busy&&<><div className="chat-message user"><span>You</span><p>{pendingText}</p></div><p className="chat-thinking" role="status"><span className="loading-spinner" aria-hidden="true"/>Thinking…</p></>}
     {error&&<div className="chat-error" role="alert"><p>{error}</p><button type="button" onClick={()=>send(failed)} disabled={busy}>Retry reply</button><button type="button" onClick={()=>enquire()}>Send an enquiry</button></div>}
    </div>
    <form className="chat-composer" onSubmit={event=>{event.preventDefault();send();}}><label className="sr-only" htmlFor="gaamup-chat-message">Your message</label><textarea id="gaamup-chat-message" ref={input} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ask about homes, the website, or anything else…" maxLength={CHAT_MAX_MESSAGE} rows={2} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();send();}}}/><button type="submit" disabled={busy||!draft.trim()} aria-label="Send message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></form>
    <p className="chat-disclosure">AI chat · Messages are processed by Google. Share contact details through Enquire.</p>
   </div>:mode==='enquiry'?<div className="assistant-body"><button type="button" className="assistant-back" onClick={()=>setMode('chat')}>← Back to conversation</button><EnquiryForm key={project} project={project} source="property-assistant"/></div>:<div className="assistant-body"><p>Explore the collection, or ask me to help you compare.</p><label className="assistant-search">Search projects or locations<input ref={searchInput} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try Panvel, Venus or 2 BHK"/></label><div>{matches.slice(0,8).map(p=><article key={p.id}><small>{p.city} · {p.bhk}</small><h3>{p.name}</h3><p>{p.price} · {catalogStatusLabels[p.constructionStatus]||'Ask for availability'}</p><Link href={p.projectHref||'/locations'} onClick={()=>setOpen(false)}>Explore project</Link><button type="button" onClick={()=>enquire(p.name)}>Enquire</button></article>)}{!matches.length&&<p>No exact match. Ask me about what you’re looking for.</p>}</div><button type="button" className="solid-button" onClick={()=>setMode('chat')}>Help me choose</button></div>}
  </section>}
 </>;
}
