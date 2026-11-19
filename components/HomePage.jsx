'use client';
import Link from 'next/link';
import Brand from './Brand.jsx';
import {useEffect,useMemo,useState} from 'react';
import PropertyFilters from './PropertyFilters.jsx';
import PropertyCollection from './PropertyCollection.jsx';
import {getDisplayProperties,filterProperties} from '../lib/property-collection.js';
import RailwayExplorer from './RailwayExplorer.jsx';
import {useSite} from './SiteProvider.jsx';
export default function HomePage({catalog,backendOffline=false}){
  const {setProperties,saved,toggleSaved,showProperty,showBuilder,showSaved}=useSite();
  const [filters,setFilters]=useState({bhk:'',constructionStatus:''});
  const display=useMemo(()=>getDisplayProperties(catalog.properties),[catalog.properties]);
  const filtered=useMemo(()=>filterProperties(display,filters),[display,filters]);
  useEffect(()=>setProperties(display),[display,setProperties]);
  return <main id="home">
    <link rel="preload" href="/models/nature-landscape-draco-v1.bin?release=1" as="fetch" type="model/gltf-binary" crossOrigin="anonymous" fetchPriority="high"/>
    <section className="hero hero-film" aria-label="Architectural time-lapse"><video autoPlay muted loop playsInline preload="metadata" aria-hidden="true"><source src="/assets/video/architectural-time-lapse.mp4" type="video/mp4"/></video></section>
    <div className="home-discovery">
    <PropertyFilters value={filters} onChange={setFilters}/>
    <RailwayExplorer cities={catalog.cities}/>
    </div>
    <section id="projects" className="section featured"><div className="section-top"><span className="eyebrow">02 / THE FEATURED COLLECTION</span><span className="eyebrow">FIND YOUR NEXT ADDRESS</span></div><div className="section-heading"><h2>Considered spaces.<br/><em>Extraordinary beginnings.</em></h2><p>Room to explore.<br/>Swipe through the collection.</p></div>{backendOffline&&<p className="service-note" role="status">Showing the saved project collection while the property service reconnects.</p>}<PropertyCollection properties={filtered} filtered={Boolean(filters.bhk||filters.constructionStatus)} onReset={()=>setFilters({bhk:'',constructionStatus:''})}/></section>
    <section id="about" className="section builders"><div className="section-top"><span className="eyebrow">03 / THE PEOPLE BEHIND THE PLACES</span><span className="eyebrow">ABOUT Gaamup reality</span></div><div className="section-heading"><h2>Built on <em>vision.</em></h2><p>The names shaping our cities.<br/>The people creating your next chapter.</p></div><div className="builder-list" id="builder-list">{catalog.builders.map(builder=><Link className="builder" key={builder.name} href={builder.projectHref} prefetch={false}><span className={`builder-logo ${builder.style}`}>{builder.logo}</span><span className="builder-name">{builder.name}</span><span className="builder-cta">{builder.project} · Explore project</span></Link>)}</div></section>
    <footer id="contact"><div className="footer-top"><Brand/><p>Thoughtful homes.<br/><em>Extraordinary beginnings.</em></p><a href="#locations" className="footer-up" aria-label="Back to destinations">Top</a></div><div className="footer-links"><a href="#locations">Destinations</a><a href="#projects">Featured homes</a><a href="/company/about.html">About us</a><a href="/company/contact.html">Contact us</a><button type="button" onClick={showSaved}>Your saved homes </button><Link href="/admin" prefetch={false}>Manage properties </Link><span>INDIA & BEYOND</span></div><div className="footer-bottom"><span>© 2026 Gaamup reality</span><span>DESIGNED AROUND YOU.</span></div></footer>
  </main>;
}
