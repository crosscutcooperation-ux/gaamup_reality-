import Link from 'next/link';
import {projectFacts} from '../lib/catalog-search.js';

export default function ProjectDetails({project}){
 const facts=projectFacts(project),towers=[...new Set(facts.offers.map(offer=>offer.tower))];
 const query=encodeURIComponent(facts.address),directions=`https://www.google.com/maps/search/?api=1&query=${query}`;
 return <div className="project-details">
  {towers.length>0&&<section className="project-pricing" id="project-pricing" aria-labelledby="project-pricing-title">
   <header><h2 id="project-pricing-title">Find your <em>space.</em></h2><p>Compare homes, carpet areas and possession timelines at {project.name}.</p></header>
   <div className="project-price-groups">{towers.map(tower=>{const offers=facts.offers.filter(offer=>offer.tower===tower),first=offers[0];return <article key={tower}><div className="project-price-heading"><div><h3>{tower}</h3><p>{[first.phase,first.status].filter(Boolean).join(' · ')}</p></div><p>Possession <strong>{first.possession}</strong></p></div><div className="project-price-scroll"><table><caption className="sr-only">{tower} homes and prices</caption><thead><tr><th scope="col">Home</th><th scope="col">Carpet area</th><th scope="col">Price</th></tr></thead><tbody>{offers.map((offer,index)=><tr key={index}><th scope="row">{offer.bhk} BHK</th><td>{offer.carpet} sq.ft</td><td>{offer.price}</td></tr>)}</tbody></table></div></article>;})}</div>
   <div className="project-price-note"><p>Sales update: {facts.pricingUpdated}. Prices and possession timelines are supplied by the sales team, subject to availability and confirmation. Taxes and other charges apply; request a complete cost sheet.</p><Link href={`/contact?project=${encodeURIComponent(project.name)}`} className="solid-button">Request a cost sheet</Link></div>
   {facts.highlights.length>0&&<div className="project-highlights"><h3>Life at {project.name}</h3><ul>{facts.highlights.map(item=><li key={item}>{item}</li>)}</ul>{facts.salesHighlights.length>0&&<p className="project-sales-note">Sales team update: {facts.salesHighlights.join('. ')}. Travel times are indicative; confirm metro operation and current inventory with the team.</p>}</div>}
  </section>}
  {facts.address&&<section className="project-location" id="project-location" aria-labelledby="project-location-title"><div className="project-location-copy"><h2 id="project-location-title">An address<br/><em>to call home.</em></h2><h3>{project.name}</h3><address>{facts.address}</address>{facts.nearby.length>0&&<><h4>In the neighbourhood</h4><ul>{facts.nearby.map(place=><li key={place}>{place}</li>)}</ul></>}<a className="solid-button" href={directions} target="_blank" rel="noreferrer">Open in Google Maps</a><a className="project-location-source" href={facts.addressSource} target="_blank" rel="noreferrer">Location source</a></div><div className="project-location-map"><iframe src={`https://www.google.com/maps?q=${query}&output=embed`} title={`${project.name} location map`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/><a href={directions} target="_blank" rel="noreferrer">Get directions to {project.name}</a></div></section>}
 </div>;
}
