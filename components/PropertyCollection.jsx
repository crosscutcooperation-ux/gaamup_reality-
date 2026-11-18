'use client';
import {useRef} from 'react';
import Link from 'next/link';
import {propertyImage} from '../lib/backend.js';
import {propertyRows} from '../lib/property-collection.js';
import {useSite} from './SiteProvider.jsx';
const stage={'under-construction':'Under construction','ready-to-move':'Ready to move','new-launch':'New launch'};
function PropertyRow({properties,index}){
  const track=useRef(null),{saved,toggleSaved,showProperty}=useSite();
  function scroll(direction){track.current?.scrollBy({left:direction*track.current.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  return <div className="property-row"><div className="property-row-toolbar"><span className="eyebrow">COLLECTION / 0{index+1}</span><div className="row-arrows"><button type="button" aria-label={`Scroll collection ${index+1} left`} onClick={()=>scroll(-1)}>Previous</button><button type="button" aria-label={`Scroll collection ${index+1} right`} onClick={()=>scroll(1)}>Next</button></div></div><div className="property-track" ref={track} tabIndex={0} role="region" aria-label={`Featured property collection ${index+1}`}>{properties.map(property=><article className="project-card" key={property.id}><div className="property-image"><img src={propertyImage(property.image)} alt={property.name} loading="lazy" width="800" height="650"/><span className="property-tag">FEATURED RESIDENCE</span><button type="button" className="save-property" aria-pressed={saved.includes(property.id)} aria-label={`${saved.includes(property.id)?'Unsave':'Save'} ${property.name}`} onClick={()=>toggleSaved(property.id)}>{saved.includes(property.id)?'♥':'♡'}</button></div><p className="project-place">{property.locality} · {property.city}</p><div className="property-title"><h3>{property.name}</h3><span>{property.price}</span></div><div className="project-bottom"><span>{property.bhk}{stage[property.constructionStatus]&&<> · {stage[property.constructionStatus]}</>}</span>{property.projectHref?<Link href={property.projectHref} prefetch={false}>Explore residence</Link>:<button type="button" onClick={()=>showProperty(property.id)}>Explore residence</button>}</div></article>)}</div></div>;
}
export default function PropertyCollection({properties,onReset,filtered}){
  return <div id="featured-grid" className="property-collection" aria-live="polite">{properties.length?propertyRows(properties).map((row,index)=>row.length>0&&<PropertyRow properties={row} index={index} key={index}/>):<div className="collection-empty"><p>No homes match these filters yet.</p><button type="button" onClick={onReset}>Clear filters </button></div>}{filtered&&properties.length>0&&<p className="collection-count">{properties.length} homes match your filters.</p>}</div>;
}
