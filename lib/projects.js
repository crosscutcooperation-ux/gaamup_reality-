import demo from './demo-project.json' with {type:'json'};
import venus from './venus-project.json' with {type:'json'};
import elements from './elements-project.json' with {type:'json'};
import balaji from './balaji-project.json' with {type:'json'};
import {getLiveCatalog,propertyImage} from './backend.js';
import {isPublicProperty} from './property-collection.js';
import {getCity} from './catalog.js';
export const bundledProjects=[demo,venus,elements,balaji];
const origin=()=>process.env.AERO_BACKEND_URL||`http://127.0.0.1:${process.env.AERO_BACKEND_PORT||4000}`;
export const demoProject=demo;
export async function getProjects(){
  try {
    const response=await fetch(`${origin()}/api/projects`,{cache:'no-store',signal:AbortSignal.timeout(4000)});
    if(!response.ok)throw new Error('Project service unavailable');
    return {projects:await response.json(),offline:false};
  } catch {
    return {projects:bundledProjects,offline:true};
  }
}
export async function getProject(slug){
  try {
    const response=await fetch(`${origin()}/api/projects/${encodeURIComponent(slug)}`,{cache:'no-store',signal:AbortSignal.timeout(4000)});
    if(response.status===404)return null;
    if(!response.ok)throw new Error('Project service unavailable');
    return {...await response.json(),offline:false};
  } catch {
    const project=bundledProjects.find(p=>p.slug===slug);
    return project?{project,assets:[],offline:true}:null;
  }
}
export function projectsForCity(projects,slug){
  return projects.filter(project=>project.published&&!project.archived&&(!slug||project.citySlugs?.includes(slug)));
}
export async function getCatalogListings(){
  const [{projects,offline},catalog]=await Promise.all([getProjects(),getLiveCatalog().catch(()=>null)]);
  // Bundled project records also exist in the older inventory. The Project Library owns them.
  const projectIds=new Set([...bundledProjects,...projects].map(project=>project.id));
  const inventory=(catalog?.properties||[]).filter(property=>isPublicProperty(property)&&!projectIds.has(property.id));
  return {
    offline:offline||!catalog,
    projects:[...projects,...inventory.map(property=>{
      const citySlug=property.city.toLowerCase().replaceAll(' ','-');
      return {
        ...property,
        listingOnly:true,
        citySlugs:getCity(citySlug)?[citySlug]:[],
        location:[property.locality,property.city].filter(Boolean).join(', '),
        configuration:property.bhk,
        coverImage:propertyImage(property.image),
      };
    })],
  };
}
export function filterProjects(projects,{query='',configuration=''}={}){
  const term=query.trim().toLowerCase();
  return projects.filter(project=>{
    if(configuration&&project.configuration!==configuration)return false;
    if(!term)return true;
    return [project.name,project.location,project.configuration,project.price]
      .some(value=>typeof value==='string'&&value.toLowerCase().includes(term));
  });
}
