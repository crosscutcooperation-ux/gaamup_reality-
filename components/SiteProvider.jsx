'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {projectProperties,getDisplayProperties} from '../lib/property-collection.js';
import SiteFooter from './SiteFooter.jsx';
import NavigationFeedback from './NavigationFeedback.jsx';
import ProjectAssistant from './ProjectAssistant.jsx';
import Brand from './Brand.jsx';
import {propertyImage} from '../lib/backend.js';
import {builders,cities,railwayStations} from '../lib/catalog.js';

const SiteContext=createContext(null);
export function useSite(){return useContext(SiteContext);}
export default function SiteProvider({children}){
  const pathname=usePathname();
  const [properties,setProperties]=useState(()=>getDisplayProperties([]));
  const [saved,setSaved]=useState([]),[hydrated,setHydrated]=useState(false),[modal,setModal]=useState(null),[toast,setToast]=useState(''),[covered,setCovered]=useState(false),[menuOpen,setMenuOpen]=useState(false);
  const dialog=useRef(null),travelHandler=useRef(null),toastTimer=useRef(null),locationsMenu=useRef(null);
  useEffect(()=>{try{const value=JSON.parse(localStorage.getItem('aero-saved')||'[]');if(Array.isArray(value))setSaved(value.filter(id=>typeof id==='string').slice(0,100));}catch{}setHydrated(true);},[]);
  useEffect(()=>{if(hydrated)try{localStorage.setItem('aero-saved',JSON.stringify(saved));}catch{}},[saved,hydrated]);
  useEffect(()=>{const abort=new AbortController();Promise.all([fetch('/api/catalog',{cache:'no-store',signal:abort.signal}).then(response=>response.ok?response.json():{properties:[]}),fetch('/api/projects',{cache:'no-store',signal:abort.signal}).then(response=>{if(!response.ok)throw new Error('Project service unavailable');return response.json();})]).then(([catalog,projects])=>setProperties(projectProperties(projects,catalog.properties))).catch(()=>{});return ()=>abort.abort();},[pathname]);
  useEffect(()=>{setCovered(false);setModal(null);setMenuOpen(false);if(locationsMenu.current)locationsMenu.current.open=false;document.body.style.overflow='';},[pathname]);
  useEffect(()=>{const el=dialog.current;if(modal&&!el.open)el.showModal();else if(!modal&&el.open)el.close();},[modal]);
  useEffect(()=>()=>clearTimeout(toastTimer.current),[]);
  useEffect(()=>{function dismiss(event){if(event.type==='keydown'&&event.key==='Escape'){setMenuOpen(false);if(locationsMenu.current)locationsMenu.current.open=false;}if(event.type==='pointerdown'&&locationsMenu.current&&!locationsMenu.current.contains(event.target))locationsMenu.current.open=false;}document.addEventListener('keydown',dismiss);document.addEventListener('pointerdown',dismiss);return()=>{document.removeEventListener('keydown',dismiss);document.removeEventListener('pointerdown',dismiss);};},[]);
  const notify=useCallback(message=>{setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),3200);},[]);
  const registerTravel=useCallback(handler=>{travelHandler.current=handler;return ()=>{if(travelHandler.current===handler)travelHandler.current=null;};},[]);
  const travel=useCallback(cityName=>{const city=railwayStations.find(c=>c.name===cityName);if(!city){notify('The railway currently serves Dombivli and Panvel.');return;}setModal(null);if(travelHandler.current)travelHandler.current(city);else notify('Return to the railway to begin your journey.');},[notify]);
  const toggleSaved=id=>{setSaved(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);};
  const selectedProperty=modal?.type==='property'?properties.find(p=>p.id===modal.id):null;
  const selectedBuilder=modal?.type==='builder'?builders.find(b=>b.name===modal.name):null;
  return <SiteContext.Provider value={{properties,setProperties,saved,toggleSaved,showProperty:id=>setModal({type:'property',id}),showBuilder:name=>setModal({type:'builder',name}),showSaved:()=>setModal({type:'saved'}),registerTravel,travel,notify,setCovered}}>
    <span id="top"/><a className="skip" href={pathname==='/'?'#locations':'#destination'}>Skip to content</a>
    <header className={`header${pathname==='/' || ['/about','/contact'].includes(pathname) ? ' hero-header' : ''}`}><Brand/><nav id="main-navigation" aria-label="Main navigation" className={menuOpen?'open':''}>
      <Link href="/#home" onClick={()=>setMenuOpen(false)}>Home</Link>
      <Link href="/about" onClick={()=>setMenuOpen(false)}>About</Link>
      <Link href="/#projects" onClick={()=>setMenuOpen(false)}>Projects</Link>
      <details className="nav-dropdown" ref={locationsMenu}><summary>Locations <span aria-hidden="true">⌄</span></summary><div className="location-menu"><Link href="/locations" onClick={()=>setMenuOpen(false)}>All properties</Link>{cities.map(city=><Link href={`/locations/${city.slug}`} key={city.slug} prefetch={false} onClick={()=>setMenuOpen(false)}>{city.name}<span aria-hidden="true"></span></Link>)}</div></details>
      <Link href="/contact" onClick={()=>setMenuOpen(false)}>Contact</Link>
    </nav><div className="header-actions"><button type="button" className="saved-button" aria-label="View saved homes" onClick={()=>setModal({type:'saved'})}>♡ <span id="saved-count">{saved.length}</span></button><span className="brokerage-badge"><strong>0%</strong><span>brokerage</span></span><button type="button" className="menu-button" aria-label={menuOpen?'Close menu':'Open menu'} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={()=>setMenuOpen(!menuOpen)}><i/><i/></button></div></header>
    <NavigationFeedback/>
    {children}
    <SiteFooter/>
    {!pathname.startsWith('/admin')&&<ProjectAssistant/>}
    <dialog id="dialog" ref={dialog} onCancel={()=>setModal(null)} onClose={()=>setModal(null)} onClick={event=>{if(event.target!==event.currentTarget)return;const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)setModal(null);}} aria-label="Property collection"><button type="button" className="dialog-close" aria-label="Close dialog" onClick={()=>setModal(null)}>×</button><div id="dialog-content">
      {modal?.type==='saved'&&<><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h2>A few <em>favourites.</em></h2>{saved.length?saved.map(id=>{const p=properties.find(value=>value.id===id);return <div className="saved-row" key={id}><h3>{p?.name||'Unavailable residence'}</h3><button type="button" onClick={()=>toggleSaved(id)}>Remove</button></div>;}):<p>Use the heart on a featured residence to save it here.</p>}</>}
      {selectedProperty&&<><span className="eyebrow">{selectedProperty.city} / {selectedProperty.locality}</span><h2>{selectedProperty.name}</h2><img className="dialog-image" src={propertyImage(selectedProperty.image)} alt={selectedProperty.name}/><p>{selectedProperty.price}<br/>{selectedProperty.bhk} · {selectedProperty.area}<br/>{selectedProperty.developer}</p>{selectedProperty.description&&<p>{selectedProperty.description}</p>}<Link className="solid-button" href={selectedProperty.projectHref||`/locations/${selectedProperty.city.toLowerCase().replaceAll(' ','-')}`} prefetch={false} onClick={()=>setModal(null)}>Explore {selectedProperty.name}</Link></>}
      {selectedBuilder&&<><span className="eyebrow">OUR BUILDERS</span><h2>{selectedBuilder.name}</h2><p>Discover the next address in the {selectedBuilder.name} collection.</p><Link className="solid-button" href={selectedBuilder.projectHref} prefetch={false} onClick={()=>setModal(null)}>Explore {selectedBuilder.project}</Link></>}
    </div></dialog>
    <div id="toast" className={`toast${toast?' show':''}`} role="status" aria-live="polite">{toast}</div>
    <div className="route-cover" data-covered={covered} aria-hidden="true"/>
  </SiteContext.Provider>;
}
