'use client';
import {useEffect,useRef} from 'react';
import {observeProjectMotion} from '../lib/scroll-reveal.js';

export default function ProjectPageMotion({children}){
  const root=useRef(null);
  useEffect(()=>{
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    let clean;
    const configure=()=>{clean?.();clean=undefined;if(!preference.matches)clean=observeProjectMotion(root.current);};
    configure();preference.addEventListener('change',configure);
    return ()=>{clean?.();preference.removeEventListener('change',configure);};
  },[]);
  return <main ref={root} id="destination" className="project-experience">{children}</main>;
}
