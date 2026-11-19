'use client';
import {useEffect,useRef,useState} from 'react';
export default function HeroFilm(){
 const video=useRef(null),[paused,setPaused]=useState(false);
 useEffect(()=>{const el=video.current,reduce=matchMedia('(prefers-reduced-motion: reduce)');if(reduce.matches){el.pause();setPaused(true);}
 const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!reduce.matches&&!el.dataset.paused)el.play().catch(()=>{});else el.pause();},{threshold:.05});observer.observe(el);
 const visibility=()=>{if(document.hidden)el.pause();else if(!el.dataset.paused&&!reduce.matches)el.play().catch(()=>{});};document.addEventListener('visibilitychange',visibility);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility);};},[]);
 function toggle(){const el=video.current;if(paused){delete el.dataset.paused;el.play().catch(()=>{});}else{el.dataset.paused='true';el.pause();}setPaused(!paused);}
 return <section className={`hero hero-film${paused?' is-paused':''}`} aria-label="Architecture from morning to night"><video ref={video} autoPlay muted loop playsInline preload="metadata" poster="/scenes/elements-new-panvel/assets/marketing/Front%20View.jpg" aria-hidden="true"><source src="/assets/video/architectural-time-lapse.mp4" type="video/mp4"/></video><div className="hero-day-cycle" aria-hidden="true"/><div className="hero-film-caption"><span>MORNING TO NIGHT · A NEW PERSPECTIVE</span><button type="button" onClick={toggle} aria-label={paused?'Play hero film':'Pause hero film'}>{paused?'▷ Play':'Ⅱ Pause'}</button></div></section>;
}
