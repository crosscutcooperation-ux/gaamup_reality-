'use client';
import {useEffect,useRef,useState} from 'react';
import Script from 'next/script';
import {wordmarkLetters,wordmarkViewBox,propertiesLabel} from '../lib/gaamup-wordmark.js';
import styles from './HeroFilm.module.css';
const assets='/assets/gaamup-hero/';

export default function HeroFilm(){
 const scene=useRef(null),[gsapReady,setGsapReady]=useState(false),[motionReady,setMotionReady]=useState(false);
 useEffect(()=>{
  if(!motionReady)return;
  const {gsap,ScrollTrigger}=window,el=scene.current;
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const context=gsap.context(()=>{
    const find=name=>el.querySelector(`.${styles[name]}`);
    const houses=[...el.querySelectorAll(`.${styles.house}`)],outline=find('outline'),content=find('content');
    // Same sequence, easing and 0.1-second scrub as the supplied AERO hero.
    // Both house layers share the same transform throughout the transition.
    const timeline=gsap.timeline({scrollTrigger:{id:'gaamup-hero',trigger:el,start:'top top',end:'bottom top',scrub:.1,invalidateOnRefresh:true}});
    gsap.set(find('smoke'),{yPercent:70});
    timeline.to(houses,{yPercent:-40,scale:1.3,duration:1},0)
     .to(find('smoke'),{yPercent:0,duration:1},0)
     .to(find('cloudLeft'),{xPercent:-15,duration:1},0)
     .to(find('cloudRight'),{xPercent:15,duration:1},0)
     .to(content,{yPercent:20,scale:.9,duration:1},0)
     .to(content,{autoAlpha:0,duration:.2},0)
     .to(outline,{opacity:1,duration:.01},.1)
     .to(outline,{opacity:0,duration:.2},.28)
     .to(find('composite'),{opacity:1,duration:.1},.3)
     .to(houses[0],{opacity:0,duration:.1},.3);
    outline.querySelectorAll('path').forEach(path=>{
     const length=path.getTotalLength();
     gsap.set(path,{strokeDasharray:length,strokeDashoffset:length});
     timeline.to(path,{strokeDashoffset:0,duration:.3},.1);
    });
    gsap.from(find('sky'),{scale:1.1,duration:5,ease:'expo.out'});
    gsap.from(find('cloudLeft'),{yPercent:50,duration:3,ease:'expo.out'});
    gsap.from(find('cloudRight'),{yPercent:100,duration:4,ease:'expo.out',delay:.1});
    const images=houses.map(house=>house.querySelector('img'));
    gsap.from(images,{opacity:0,duration:.6,delay:.2});
    gsap.from(images,{yPercent:10,duration:3,ease:'expo.out',delay:.2});
    gsap.from([content.querySelector('p'),content.querySelector('button')],{y:70,opacity:0,duration:2,stagger:.1,ease:'expo.out',delay:.4});
   },el);
   return()=>context.revert();
  });
  return()=>media.revert();
 },[motionReady]);
 function explore(){const search=document.getElementById('home-property-search');search?.closest('section')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});search?.focus({preventScroll:true});}
 return <>
  <Script src={`${assets}gsap.min.js`} onReady={()=>setGsapReady(true)}/>
  {gsapReady&&<Script src={`${assets}ScrollTrigger.min.js`} onReady={()=>setMotionReady(true)}/>}
  <section ref={scene} className={styles.scene} aria-label="GAAMUP Properties — Moves You Forward"><div className={styles.stage}>
   <div className={styles.background} aria-hidden="true">
    <img className={styles.sky} src={`${assets}back.f53e9773.webp`} alt="" fetchPriority="high" decoding="async"/>
    <div className={`${styles.house} ${styles.originalHouse}`}><img src={`${assets}house.8ed9b3db.webp`} alt="" decoding="async"/></div>
    <div className={styles.composite}><div className={styles.house}><img src={`${assets}house.8ed9b3db.webp`} alt="" decoding="async"/></div></div>
    <div className={`${styles.cloud} ${styles.cloudLeft}`}><img src={`${assets}cloud.c8800fa9.webp`} alt="" decoding="async"/></div><div className={`${styles.cloud} ${styles.cloudRight}`}><img src={`${assets}cloud.c8800fa9.webp`} alt="" decoding="async"/></div>
    <svg className={styles.outline} viewBox={wordmarkViewBox}>
     {wordmarkLetters.map(({letter,x,d},index)=><path key={`${letter}-${index}`} transform={`translate(${x} 0)`} d={d} fillRule="evenodd"/>)}
     <text {...propertiesLabel} textAnchor="middle" lengthAdjust="spacingAndGlyphs">PROPERTIES</text>
    </svg>
    <div className={styles.smoke}><img src={`${assets}smoke.9f683cb4.webp`} alt="" decoding="async"/></div>
   </div>
   <div className={styles.content}><div className={styles.copy}><h1>GAAMUP Moves You Forward</h1><p>Expert agents. Real guidance. <span>Your next chapter starts with GAAMUP.</span></p><button type="button" onClick={explore}>Explore with GAAMUP <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.5"/></svg></button></div></div>
  </div></section>
 </>;
}
