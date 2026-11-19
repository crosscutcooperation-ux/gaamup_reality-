'use client';
import Link from 'next/link';
import HeroFilm from './HeroFilm.jsx';
import {useEffect,useMemo} from 'react';
import PropertyFilters from './PropertyFilters.jsx';
import PropertyCollection from './PropertyCollection.jsx';
import {getDisplayProperties} from '../lib/property-collection.js';
import RailwayExplorer from './RailwayExplorer.jsx';
import {useSite} from './SiteProvider.jsx';
export default function HomePage({catalog,backendOffline=false}){
  const {setProperties}=useSite();
  const display=useMemo(()=>getDisplayProperties(catalog.properties),[catalog.properties]);
  useEffect(()=>setProperties(display),[display,setProperties]);
  return <main id="home">
    <link rel="preload" href="/models/nature-landscape-draco-v1.bin?release=1" as="fetch" type="model/gltf-binary" crossOrigin="anonymous" fetchPriority="high"/>
    <HeroFilm/>
    <div className="home-discovery">
    <PropertyFilters/>
    <RailwayExplorer cities={catalog.cities}/>
    </div>
    <section id="projects" className="section featured"><div className="section-top"><span className="eyebrow">02 / THE FEATURED COLLECTION</span><span className="eyebrow">FIND YOUR NEXT ADDRESS</span></div><div className="section-heading"><h2>Considered spaces.<br/><em>Extraordinary beginnings.</em></h2><p>Room to explore.<br/>Swipe through the collection.</p></div>{backendOffline&&<p className="service-note" role="status">Showing the saved project collection while the property service reconnects.</p>}<PropertyCollection properties={display}/></section>
    <section id="about" className="section builders"><div className="section-top"><span className="eyebrow">03 / THE PEOPLE BEHIND THE PLACES</span><span className="eyebrow">ABOUT Gaamup reality</span></div><div className="section-heading"><h2>Built on <em>vision.</em></h2><p>The names shaping our cities.<br/>The people creating your next chapter.</p></div><div className="builder-list" id="builder-list">{catalog.builders.map(builder=><Link className="builder" key={builder.name} href={builder.projectHref} prefetch={false}><span className={`builder-logo ${builder.style}`}>{builder.logo}</span><span className="builder-name">{builder.name}</span><span className="builder-cta">{builder.project} · Explore project</span></Link>)}</div></section>

  </main>;
}
