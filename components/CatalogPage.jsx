import Link from 'next/link';
import {getCatalogListings,projectsForCity} from '../lib/projects.js';
import {catalogFiltersFromQuery} from '../lib/catalog-search.js';
import ProjectCatalog from './ProjectCatalog.jsx';

export default async function CatalogPage({city, query}) {
  const {projects,offline} = await getCatalogListings();
  const collection = projectsForCity(projects, city?.slug);
  const initialFilters = catalogFiltersFromQuery(query);
  return (
    <main id="destination" className="city-catalog">
      <Link href="/#locations" className="catalog-back" prefetch={false}>Back to the railway</Link>
      <div className="catalog-heading"><div>
        <span className="eyebrow">Gaamup reality / RESIDENTIAL COLLECTION</span>
        <h1>{city ? <>Properties for sale in <em>{city.name}.</em></> : <>Explore <em>all properties.</em></>}</h1>
      </div></div>
      <p className="catalog-note">Explore homes, compare details and step inside in 3D.</p>
      {offline&&<p className="catalog-note" role="status">Showing the saved collection while the property service reconnects.</p>}
      <ProjectCatalog key={`${city?.slug||'all'}:${JSON.stringify(initialFilters)}`} projects={collection} citySlug={city?.slug} cityName={city?.name||'All locations'} initialFilters={initialFilters}/>
    </main>
  );
}
