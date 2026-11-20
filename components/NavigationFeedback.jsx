'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {pendingDestination} from '../lib/navigation-feedback.js';
export default function NavigationFeedback(){
 const pathname=usePathname(),[pending,setPending]=useState(false);
 useEffect(()=>setPending(false),[pathname]);
 useEffect(()=>{
  let timer;
  function click(event){if(!pendingDestination(event,window.location))return;setPending(true);clearTimeout(timer);timer=setTimeout(()=>setPending(false),20000);}
  const clear=()=>{clearTimeout(timer);setPending(false);};window.addEventListener('popstate',clear);document.addEventListener('click',click,true);window.addEventListener('pageshow',clear);
  return ()=>{clearTimeout(timer);document.removeEventListener('click',click,true);window.removeEventListener('pageshow',clear);window.removeEventListener('popstate',clear);};
 },[]);
 return pending?<div className="navigation-feedback" role="status"><span className="loading-spinner" aria-hidden="true"/>Opening page…</div>:null;
}
