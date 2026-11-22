'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export default function SmoothScroll(){
 const pathname=usePathname();
 useEffect(()=>{
  if(pathname.startsWith('/admin'))return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let cleanup=()=>{};
  function setup(){
   cleanup();if(reduced.matches)return;
   const scroll=new Lenis({autoRaf:true,lerp:.1,smoothWheel:true,syncTouch:false,anchors:{offset:-90},prevent:node=>Boolean(node.closest?.('dialog,[data-lenis-prevent],.property-assistant,.finder-suggestions,.property-track,.header nav'))});
   const update=()=>window.ScrollTrigger?.update();scroll.on('scroll',update);
   const locks=()=>{
    const locked=document.body.style.overflow==='hidden'||Boolean(document.querySelector('dialog[open]'));
    if(locked&&!scroll.isStopped)scroll.stop();else if(!locked&&scroll.isStopped)scroll.start();
   };
   const observer=new MutationObserver(locks);observer.observe(document.body,{attributes:true,attributeFilter:['style','class']});
   document.addEventListener('toggle',locks,true);document.addEventListener('close',locks,true);locks();
   cleanup=()=>{observer.disconnect();document.removeEventListener('toggle',locks,true);document.removeEventListener('close',locks,true);scroll.off('scroll',update);scroll.destroy();};
  }
  setup();reduced.addEventListener('change',setup);
  return()=>{reduced.removeEventListener('change',setup);cleanup();};
 },[pathname]);
 return null;
}
