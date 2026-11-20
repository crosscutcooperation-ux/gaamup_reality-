'use client';
import {useEffect,useRef,useState} from 'react';
import './ProjectPresentation.css';

const defaultBase='/projects/sai-world-dreams/media/';
const collection=[
  {id:'aerial',name:'The garden courts',group:'LANDSCAPE',note:'Room to slow down.',alt:'Landscaped gardens between the Sai World Dreams residential towers'},
  {id:'pool',name:'The pool terrace',group:'WELLBEING',note:'A different pace.',alt:'Pool terrace and clubhouse at Sai World Dreams'},
  {id:'entrance',name:'A considered arrival',group:'ARRIVAL',note:'A sense of occasion.',alt:'Sai World Dreams entrance and commercial boulevard'},
  {id:'balcony',name:'Your own outlook',group:'AT HOME',note:'Life, a little closer.',alt:'A furnished balcony overlooking the Sai World Dreams landscape'},
  {id:'courtyard',name:'The residences',group:'ARCHITECTURE',note:'A place in the skyline.',alt:'Courtyard-facing residential buildings at Sai World Dreams'},
];
const films=[{id:'project-film',title:'A world of possibilities',subtitle:'Sai World Dreams · the project film'},{id:'lifestyle-film',title:'A new way to come home',subtitle:'Sai World Dreams · the lifestyle film'}];
function Photo({id,alt,className='',sizes='100vw',base=defaultBase,src}){
  if(src)return <picture className={`story-photo ${className}`}><img src={src} sizes={sizes} alt={alt} loading="lazy" decoding="async"/></picture>;
  return <picture className={`story-photo ${className}`}><img src={`${base}${id}-2400.webp`} srcSet={`${base}${id}-960.webp 960w, ${base}${id}-2400.webp 2400w`} sizes={sizes} alt={alt} loading="lazy" decoding="async"/></picture>;
}
function Eyebrow({number,children}){return <p className="story-eyebrow"><span>{number}</span><i/>{children}</p>;}
function AmbientFilm({base=defaultBase,src,poster}){
  const video=useRef(null);
  useEffect(()=>{
    const element=video.current,preference=matchMedia('(prefers-reduced-motion: reduce)');
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting&&!preference.matches&&!document.hidden)element.play().catch(()=>{});else element.pause();
    },{threshold:.2});
    observer.observe(element);
    const pause=()=>{if(document.hidden)element.pause();};document.addEventListener('visibilitychange',pause);
    return ()=>{observer.disconnect();element.pause();document.removeEventListener('visibilitychange',pause);};
  },[]);
  return <video ref={video} className="story-film" muted loop playsInline preload="none" poster={poster||`${base}project-film-poster.jpg`} aria-hidden="true"><source src={src||`${base}project-film.mp4`} type="video/mp4"/></video>;
}
export default function ProjectPresentation({projectId='sai-world-dreams'}){
  const venus=projectId==='venus-skky-city',elements=projectId==='elements-new-panvel',name=elements?'CODENAME ELEMENTS':venus?'VENUS SKKY CITY':'SAI WORLD DREAMS',base=venus?'/projects/venus-skky-city/media/':defaultBase;
  const elementsMedia='/scenes/elements-new-panvel/assets/marketing/';
  const items=elements?[
    {id:'aerial',name:'The residences',group:'ARCHITECTURE',note:'Two towers, one new address.',alt:'Codename Elements residential towers',src:elementsMedia+'Front View.jpg'},
    {id:'pool',name:'The landscaped podium',group:'LANDSCAPE',note:'Room to meet and unwind.',alt:'Codename Elements landscaped podium',src:elementsMedia+'Podium View.jpg'},
    {id:'entrance',name:'A considered arrival',group:'ARRIVAL',note:'A welcoming first impression.',alt:'Codename Elements entrance lobby',src:elementsMedia+'Entrance Lobby.jpg'},
    {id:'balcony',name:'A new perspective',group:'ARCHITECTURE',note:'Life above the city.',alt:'Codename Elements building elevation',src:elementsMedia+'Elevation.jpg'},
  ]:venus?[
    {id:'aerial',name:'The garden courts',group:'LANDSCAPE',note:'Room to slow down.',alt:'Venus Skky City landscaped gardens'},
    {id:'pool',name:'The beach-inspired pool',group:'WELLBEING',note:'A different pace.',alt:'Venus Skky City swimming pool'},
    {id:'entrance',name:'A considered arrival',group:'ARRIVAL',note:'Your new address.',alt:'Venus Skky City entrance boulevard'},
    {id:'balcony',name:'The Vivanta clubhouse',group:'TOGETHER',note:'A place to gather.',alt:'Venus Skky City Vivanta clubhouse'},
    {id:'courtyard',name:'The residences',group:'ARCHITECTURE',note:'A place in the skyline.',alt:'Venus Skky City residential towers'},
    ...[{id:'night',name:'After sunset'},{id:'temple',name:'The Jain temple'},{id:'school',name:'Eva World School'},{id:'court',name:'The sports court'},{id:'beach',name:'A moment of escape'}].map(x=>({...x,group:'VENUS SKKY CITY',alt:x.name+' at Venus Skky City',note:'Explore the address.'}))
  ]:collection;
  const projectFilms=elements?[{id:'project-film',title:'The Elements story',subtitle:'Codename Elements · project film',src:elementsMedia+'Teaser 1.mp4',poster:elementsMedia+'Front View.jpg'}]:venus?films.map((f,i)=>({...f,subtitle:'Venus Skky City · '+(i?'residence walkthrough':'aerial project film')})):films;
  const [film,setFilm]=useState(null),[chapter,setChapter]=useState('project-life');
  const root=useRef(null);
  const dialog=useRef(null),returnFocus=useRef(null);
  useEffect(()=>{
    if(film===null)return;
    const modal=dialog.current,previous=document.body.style.overflow;returnFocus.current=document.activeElement;
    document.body.style.overflow='hidden';modal.showModal();
    return ()=>{modal.close();document.body.style.overflow=previous;returnFocus.current?.focus?.();};
  },[film===null]);
  useEffect(()=>{
    const element=root.current;
    const sections=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)setChapter(entry.target.id);},{rootMargin:'-20% 0px -45% 0px'});
    element.querySelectorAll('section[id]').forEach(section=>sections.observe(section));
    return ()=>sections.disconnect();
  },[]);
  function visitPhoto(id){document.getElementById('project-photo-'+id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center',inline:'center'});}
  return <div ref={root} className={`project-story${elements?' elements-story':''}`}>
    <nav className="story-chapters" aria-label="Project chapters"><span>{name}</span><a href="#project-life" aria-current={chapter==='project-life'?'location':undefined}>The collection</a><a href="#project-rhythm" aria-current={chapter==='project-rhythm'?'location':undefined}>The film</a><a href="#project-residences" aria-current={chapter==='project-residences'?'location':undefined}>The residences</a><a href="#project-gallery" aria-current={chapter==='project-gallery'?'location':undefined}>The gallery</a>{!elements&&<a href="#project-pricing">Homes & prices</a>}<a href="#project-location">Location</a></nav>
    <section id="project-life" className="story-index">
      <div className="story-index-head"><Eyebrow number="01">THE AMENITY COLLECTION</Eyebrow><h2>More ways<br/><em>to spend a day.</em></h2><p className="story-lead">A little movement. A moment of stillness. A place to gather.<br/>Discover the spaces that make this address your own.</p></div>
      <div className="story-index-body"><figure id="project-photo-pool" className="story-index-stage"><Photo base={base} id="pool" src={items[1].src} alt={items[1].alt} sizes="(max-width: 760px) 100vw, 42vw"/><figcaption>{elements?'THE LANDSCAPED PODIUM':'THE POOL TERRACE / WELLBEING'}</figcaption></figure><ol className="story-index-list">{items.map((item,index)=><li key={item.id}><button type="button" onClick={()=>visitPhoto(item.id)}><span className="story-index-num">{String(index+1).padStart(2,'0')}</span><span className="story-index-name">{item.name}</span><span className="story-index-group">{item.group}</span><span className="story-index-note">{item.note}</span></button></li>)}</ol></div>
      <div className="story-index-foot"><span>{elements?'FOUR PERSPECTIVES. ONE ADDRESS.':venus?'TEN PERSPECTIVES. ONE ADDRESS.':'FIVE PERSPECTIVES. ONE ADDRESS.'}</span><a href="#project-rhythm" aria-current={chapter==='project-rhythm'?'location':undefined}>Discover your rhythm</a></div>
    </section>
    <section id="project-rhythm" className="story-cinema" aria-labelledby="project-film-title"><AmbientFilm base={base} src={projectFilms[0].src} poster={projectFilms[0].poster}/><div className="story-cinema-shade"/><div className="story-cinema-top"><span>02 / LIFE IN MOTION</span><span>{name} · {elements?'NEW PANVEL':'DOMBIVLI'}</span></div><div className="story-cinema-copy"><p className="story-eyebrow">THE PROJECT FILM</p><h2 id="project-film-title">A world<br/><em>of possibilities.</em></h2><button type="button" className="story-watch" onClick={()=>setFilm(0)}><span className="story-play" aria-hidden="true">Play</span><span>Watch the film</span></button></div><span className="story-cinema-credit">PROJECT PROMOTIONAL FILM</span></section>
    <section id="project-residences" className="story-residences"><div className="story-residence-copy"><Eyebrow number="03">THE RESIDENCES</Eyebrow><h2>A little more<br/><em>room for life.</em></h2><p>From the first view of the skyline to a quiet moment on the balcony. Explore the residences from every angle, then return to the model to find your floor and your home.</p><button type="button" className="story-text-link" onClick={()=>document.querySelector('.colony-view')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>Explore the residences</button><span className="story-small">BUILDING · FLOOR · APARTMENT</span></div><figure id="project-photo-balcony" className="story-residence-image"><Photo base={base} id="balcony" src={items[3].src} alt={items[3].alt} sizes="(max-width: 760px) 100vw, 54vw"/><figcaption>{elements?'THE TOWER ELEVATION':venus?'THE VIVANTA CLUBHOUSE':'YOUR OWN OUTLOOK'} / {name}</figcaption></figure></section>
    <section id="project-gallery" className="story-gallery"><header><Eyebrow number="04">THE VISUAL JOURNAL</Eyebrow><h2>A closer <em>look.</em></h2><p>Architecture, landscape and the spaces in between.</p></header><div className="story-gallery-track">{items.filter(item=>!['pool','balcony'].includes(item.id)).map(item=><figure id={'project-photo-'+item.id} key={item.id}><Photo base={base} id={item.id} src={item.src} alt={item.alt} sizes="(max-width: 760px) 84vw, 56vw"/><figcaption><span>{item.name}</span><small>{item.group}</small></figcaption></figure>)}</div><div className="story-gallery-foot"><span>SCROLL TO EXPLORE THE COLLECTION</span><button onClick={()=>setFilm(elements?0:1)}>{elements?'Watch the project film':'Watch the lifestyle film'}</button></div></section>
    <div className="story-end"><span>Gaamup reality / {name}</span><p>Your next chapter.<br/><em>A new perspective.</em></p><a href="#destination">Return to the model</a><small>Project images are supplied architectural visualisations. Furnishings, landscape and amenity appearance are illustrative.</small></div>
    <dialog ref={dialog} className="story-film-dialog" aria-label={film===null?'Project film':projectFilms[film].title} onCancel={()=>setFilm(null)} onClose={()=>setFilm(null)} onKeyDown={event=>{if(event.key==='ArrowRight')setFilm(value=>(value+1)%projectFilms.length);if(event.key==='ArrowLeft')setFilm(value=>(value+projectFilms.length-1)%projectFilms.length);}}>{film!==null&&<><header><span>Gaamup reality / {name}</span><button type="button" onClick={()=>setFilm(null)} aria-label="Close project film">Close ×</button></header><div className="story-film-frame"><video key={projectFilms[film].id} src={projectFilms[film].src||`${base}${projectFilms[film].id}.mp4`} poster={projectFilms[film].poster||`${base}${projectFilms[film].id}-poster.jpg`} controls playsInline autoPlay preload="metadata"/></div><div className="story-film-foot"><div><span>{String(film+1).padStart(2,'0')} / {String(projectFilms.length).padStart(2,'0')}</span><h3>{projectFilms[film].title}</h3><p>{projectFilms[film].subtitle}</p></div><nav aria-label="Choose a project film"><button onClick={()=>setFilm(value=>(value+projectFilms.length-1)%projectFilms.length)}>Previous</button>{projectFilms.map((item,index)=><button key={item.id} aria-label={item.title} aria-pressed={index===film} onClick={()=>setFilm(index)}>{String(index+1).padStart(2,'0')}</button>)}<button onClick={()=>setFilm(value=>(value+1)%projectFilms.length)}>Next</button></nav></div></>}</dialog>
  </div>;
}
