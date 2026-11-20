'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {cities} from '../lib/catalog.js';
import {searchCatalog,projectFacts,catalogStatusLabels} from '../lib/catalog-search.js';
const initial={searchTerms:[],query:'',localities:[],bhk:[],types:[],statuses:[],developers:[],minPrice:'',maxPrice:'',minArea:'',maxArea:'',sort:'location'};
const budgets=[['','Any'],['5000000','₹50 L'],['7500000','₹75 L'],['10000000','₹1 Cr'],['15000000','₹1.5 Cr'],['20000000','₹2 Cr'],['30000000','₹3 Cr'],['50000000','₹5 Cr'],['100000000','₹10 Cr']];
export default function ProjectCatalog({projects,citySlug,cityName,initialFilters={}}){
  const router=useRouter();
  const [filters,setFilters]=useState({...initial,...initialFilters}),[open,setOpen]=useState(false),[saved,setSaved]=useState([]);
  useEffect(()=>{try{const list=JSON.parse(localStorage.getItem('aero-project-shortlist')||'[]');setSaved(Array.isArray(list)?list:[]);}catch{}},[]);
  useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const escape=e=>{if(e.key==='Escape')setOpen(false);};window.addEventListener('keydown',escape);return()=>{document.body.style.overflow=previous;window.removeEventListener('keydown',escape);};},[open]);
  const facts=useMemo(()=>projects.map(projectFacts),[projects]);
  const localities=[...new Set(facts.map(p=>p.location.split(',')[0].trim()).filter(Boolean))];
  const developers=[...new Set(facts.map(p=>p.developer).filter(Boolean))];
  const filtered=useMemo(()=>searchCatalog(projects,filters),[projects,filters]);
  const active=Object.entries(filters).filter(([key,value])=>key!=='sort').flatMap(([key,value])=>Array.isArray(value)?value.map(v=>({key,value:v})):value?[{key,value}]:[]);
  function set(key,value){setFilters(current=>({...current,[key]:value}));}
  function toggle(key,value){setFilters(current=>({...current,[key]:current[key].includes(value)?current[key].filter(v=>v!==value):[...current[key],value]}));}
  function reset(){setFilters({...initial,sort:filters.sort});}
  function remove(chip){Array.isArray(filters[chip.key])?toggle(chip.key,chip.value):set(chip.key,'');}
  function save(id){setSaved(current=>{const next=current.includes(id)?current.filter(v=>v!==id):[...current,id];try{localStorage.setItem('aero-project-shortlist',JSON.stringify(next));}catch{}return next;});}
  function checkGroup(key,options){return <div className="filter-checks">{options.map(([value,label])=><label key={value}><input type="checkbox" checked={filters[key].includes(value)} onChange={()=>toggle(key,value)}/><span>{label}</span><small>{facts.filter(f=>key==='localities'?f.location.split(',')[0].trim()===value:key==='developers'?f.developer===value:key==='types'?f.propertyType===value:f.status===value).length}</small></label>)}</div>;}
  function ranges(key,label,options){return <label><span>{label}</span><select aria-label={label} value={filters[key]} onChange={e=>set(key,e.target.value)}>{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></label>;}
  return <section className="project-catalog listing-catalog" aria-label={citySlug?`Projects in ${cityName}`:"All properties"}>
    <div className="listing-search">
      <label className="listing-city">
        <span>Location</span>
        <select value={citySlug||''} onChange={event=>{
          const slug=event.target.value;
          const query=new URLSearchParams();filters.searchTerms.forEach(t=>query.append('place',t));
          if(filters.bhk.length===1)query.set('bhk',filters.bhk[0]);
          if(filters.statuses.length===1)query.set('status',filters.statuses[0]);
          const suffix=query.size?`?${query}`:'';
          router.push(slug?`/locations/${slug}${suffix}`:`/locations${suffix}`);
        }}>
          <option value="">All locations</option>
          {cities.map(city=><option key={city.slug} value={city.slug}>{city.name}</option>)}
        </select>
      </label><label><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.5" stroke="currentColor"/><path d="m15 15 5 5" stroke="currentColor"/></svg><input type="search" aria-label="Search projects and localities" placeholder="Search by project, locality or developer" value={filters.query} onChange={e=>set('query',e.target.value)}/></label><button type="button" onClick={()=>document.getElementById('catalog-listings')?.scrollIntoView({behavior:'smooth',block:'start'})}>Search <span></span></button></div>
    <div className="listing-layout"><button type="button" className="filter-shade" hidden={!open} onClick={()=>setOpen(false)} aria-label="Close filters"/>
      <aside className={`listing-sidebar${open?' is-open':''}`} aria-label="Property filters"><div className="filter-title"><h2>Filters <span>{active.length?`(${active.length})`:''}</span></h2><button type="button" onClick={reset} disabled={!active.length}>Clear all</button><button type="button" className="filter-close" onClick={()=>setOpen(false)} aria-label="Close filters">×</button></div>
        <details open><summary>Budget <span>−</span></summary><div className="filter-range">{ranges('minPrice','Min budget',budgets)}<span>—</span>{ranges('maxPrice','Max budget',budgets)}</div><p className="filter-fineprint">Prices shown as supplied by the project.</p></details>
        <details open><summary>Configuration <span>−</span></summary><div className="filter-bhk">{['1','2','2.5','3','4+'].map(value=><button key={value} type="button" aria-pressed={filters.bhk.includes(value)} onClick={()=>toggle('bhk',value)}>{value} BHK</button>)}</div></details>
        <details open><summary>Localities <span>−</span></summary>{checkGroup('localities',localities.map(value=>[value,value]))}</details>
        <details open><summary>Possession status <span>−</span></summary>{checkGroup('statuses',Object.entries(catalogStatusLabels))}</details>
        <details open><summary>Property type <span>−</span></summary>{checkGroup('types',[['Apartment','Apartments'],['Villa','Villas'],['Plot','Plots'],['Commercial','Commercial']])}</details>
        <details><summary>Carpet area <span>＋</span></summary><div className="filter-range">{ranges('minArea','Min sq.ft',[['','Any'],['500','500'],['750','750'],['1000','1,000'],['1500','1,500'],['2000','2,000']])}<span>—</span>{ranges('maxArea','Max sq.ft',[['','Any'],['750','750'],['1000','1,000'],['1500','1,500'],['2000','2,000'],['3000','3,000']])}</div></details>
        {developers.length>0&&<details><summary>Developers <span>＋</span></summary>{checkGroup('developers',developers.map(value=>[value,value]))}</details>}
        <div className="filter-mobile-done"><button type="button" onClick={()=>setOpen(false)}>Show {filtered.length} {filtered.length===1?'property':'properties'} </button></div>
      </aside>
      <div className="listing-results" id="catalog-listings"><div className="listing-toolbar"><p className="catalog-results" aria-live="polite">Showing <strong>{filtered.length}</strong> {filtered.length===1?'property':'properties'}</p><div><button className="mobile-filter-trigger" type="button" onClick={()=>setOpen(true)} aria-expanded={open}>☷ Filters{active.length?` (${active.length})`:''}</button><label>Sort by <select value={filters.sort} onChange={e=>set('sort',e.target.value)}><option value="location">Location</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select></label></div></div>
        {active.length>0&&<div className="listing-active">{active.map(chip=><button key={`${chip.key}-${chip.value}`} type="button" onClick={()=>remove(chip)}>{chip.key==='bhk'?`${chip.value} BHK`:chip.key==='statuses'?catalogStatusLabels[chip.value]:chip.key.includes('Price')?`${chip.key==='minPrice'?'From':'Up to'} ${budgets.find(b=>b[0]===chip.value)?.[1]}`:chip.key.includes('Area')?`${chip.key==='minArea'?'From':'Up to'} ${chip.value} sq.ft`:chip.value} <span>×</span></button>)}</div>}
        <div className="listing-quick-filters">{[['statuses','under-construction','Under construction'],['statuses','ready-to-move','Ready possession'],['statuses','new-launch','New launch']].map(([key,value,label])=><button key={value} type="button" aria-pressed={filters[key].includes(value)} onClick={()=>toggle(key,value)}>{label} <span>＋</span></button>)}</div>
        {filtered.length?<div className="listing-cards">{filtered.map(project=><ListingCard key={project.id} project={project} citySlug={citySlug} saved={saved.includes(project.id)} onSave={()=>save(project.id)}/>)}</div>:<div className="catalog-empty listing-empty"><span>⌕</span><h2>A little room to explore.</h2><p>No properties match these filters. Try a wider budget or another configuration.</p><button type="button" onClick={reset}>Clear all filters </button></div>}
        <p className="listing-end">{filtered.length?'You’ve explored the current collection.':'Your next address is waiting.'} <Link href="/#locations" prefetch={false}>Explore another location </Link></p>
      </div>
    </div>
  </section>;
}
function ListingCard({project,citySlug,saved,onSave}){
  const facts=projectFacts(project),[photo,setPhoto]=useState(0),[more,setMore]=useState(false);const href=project.listingOnly?null:`/projects/${project.slug}?${citySlug?`city=${citySlug}`:'from=catalog'}`;
  const photoImage=<img src={facts.photos[photo]} alt={`${project.name} ${photo===0?'cover':'project'} view`}/>;
  return <article className="catalog-card listing-card"><div className="listing-card-main"><div className="listing-media">{href?<Link href={href} prefetch={false} className="catalog-photo">{photoImage}</Link>:<div className="catalog-photo">{photoImage}</div>}{project.viewer?.kind&&<span className="listing-media-badge">◉ INTERACTIVE 3D TOUR</span>}{facts.photos.length>1&&<><button type="button" className="photo-prev" onClick={()=>setPhoto((photo+facts.photos.length-1)%facts.photos.length)} aria-label={`Previous photo of ${project.name}`}>Previous</button><button type="button" className="photo-next" onClick={()=>setPhoto((photo+1)%facts.photos.length)} aria-label={`Next photo of ${project.name}`}>Next</button><div className="listing-photo-dots">{facts.photos.map((_,index)=><button type="button" key={index} aria-label={`Show project photo ${index+1}`} aria-pressed={photo===index} onClick={()=>setPhoto(index)}/>)}</div></>}<div className="listing-media-links"><button type="button" onClick={()=>setPhoto((photo+1)%facts.photos.length)}>▧ Photos <span>{facts.photos.length}</span></button>{project.viewer?.kind&&<><Link href={`${href}&explore=floors`} prefetch={false}>▦ Floor plans</Link><Link href={href} prefetch={false}>◉ 360° view</Link></>}</div></div>
      <div className="listing-card-info"><div className="listing-name"><div>{facts.developer&&<p className="listing-developer">By {facts.developer}</p>}<h2>{href?<Link href={href} prefetch={false}>{project.name}</Link>:project.name}</h2></div><button type="button" className="listing-save" onClick={onSave} aria-pressed={saved} aria-label={`${saved?'Remove':'Save'} ${project.name}`}>{saved?'♥':'♡'}</button></div><p className="listing-location">⌖ {project.location}</p><p className="listing-config">{facts.bhk.length?facts.bhk.map(v=>`${v}`).join(', ')+' BHK':project.configuration} · {facts.propertyType==='Apartment'?'Apartments':facts.propertyType}</p><div className="listing-price"><strong>{project.price||'Price on request'}</strong><span>{facts.status?catalogStatusLabels[facts.status]||facts.status:'Possession on request'}{facts.possession?` · ${facts.possession}`:''}</span></div>
        <table className="listing-specs"><thead><tr><th>Configuration</th><th>Carpet area</th><th>Price</th></tr></thead><tbody>{(facts.variants.length?facts.variants:facts.bhk.length?facts.bhk.map(bhk=>({configuration:`${bhk} BHK`,area:facts.area||'On request',price:project.price||'On request'})):[{configuration:project.configuration||facts.propertyType,area:facts.area||'On request',price:project.price||'On request'}]).map((row,index)=><tr key={index}><td>{row.configuration}</td><td>{row.area||'On request'}</td><td>{row.price||'On request'}</td></tr>)}</tbody></table>
      </div></div>
    {facts.amenities.length>0&&<div className="listing-amenities"><span>TOP AMENITIES</span><div>{facts.amenities.map((amenity,index)=><span key={amenity}><i aria-hidden="true">{['≈','♧','⌂','◇'][index%4]}</i>{amenity}</span>)}</div></div>}
    {facts.description&&<div className="listing-description"><p className={more?'expanded':''}>{facts.description}</p><button type="button" aria-expanded={more} onClick={()=>setMore(!more)}>{more?'Show less':'Show more'} {more?'−':'＋'}</button></div>}
    <div className="listing-card-footer"><div>
      {project.viewer?.kind&&<Link href={`${href}&explore=floors`} prefetch={false} className="listing-outline">View floor plans</Link>}
      {href?<Link href={href} prefetch={false} className="listing-primary">View details</Link>:<Link href="/contact" prefetch={false} className="listing-primary">Enquire</Link>}
    </div></div>
  </article>;
}
