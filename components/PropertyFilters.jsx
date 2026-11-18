'use client';
import {useLayoutEffect,useRef} from 'react';
import Link from 'next/link';
export default function PropertyFilters({value,onChange}){
  const panel=useRef(null);
  useLayoutEffect(()=>{
    const element=panel.current;
    const measure=()=>element.style.setProperty('--finder-height',`${element.getBoundingClientRect().height}px`);
    measure();const observer=new ResizeObserver(measure);observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  return <section ref={panel} className="home-filters" aria-label="Find a home"><div className="filter-label"><p>Find your <em>kind of home.</em></p></div><div className="filter-controls"><fieldset><legend>Bedrooms</legend><div className="bhk-options">{[['','All'],['1','1 BHK'],['2','2 BHK'],['2.5','2.5 BHK'],['3','3 BHK'],['4+','4+ BHK']].map(([key,label])=><button type="button" key={key} aria-pressed={value.bhk===key} onClick={()=>onChange({...value,bhk:key})}>{label}</button>)}</div></fieldset><label className="construction-filter"><span>Construction status</span><select value={value.constructionStatus} onChange={event=>onChange({...value,constructionStatus:event.target.value})}><option value="">Any stage</option><option value="under-construction">Under construction</option><option value="ready-to-move">Ready to move</option><option value="new-launch">New launch</option></select></label><Link className="filter-explore" href={{pathname:'/locations',query:{...(value.bhk?{bhk:value.bhk}:{}),...(value.constructionStatus?{status:value.constructionStatus}:{})}}} prefetch={false}>Find home</Link></div></section>;
}
