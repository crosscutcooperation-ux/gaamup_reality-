import HomePage from '../components/HomePage.jsx';
import {builders,railwayStations} from '../lib/catalog.js';
import {getLiveCatalog} from '../lib/backend.js';
import {getProjects} from '../lib/projects.js';
import {projectProperties} from '../lib/property-collection.js';
export const dynamic='force-dynamic';
export default async function Page(){
  const [{projects,offline},catalog]=await Promise.all([getProjects(),getLiveCatalog().catch(()=>null)]);
  return <HomePage catalog={{cities:railwayStations,builders,properties:projectProperties(projects,catalog?.properties)}} backendOffline={offline}/>;
}
