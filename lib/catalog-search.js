import venus from './venus-project.json' with {type:'json'};
import {getCity} from './catalog.js';

/** Listing facts come from project records; the bundled demo uses its supplied plan types. */
export function priceRange(value){
  if(typeof value!=='string'||!/\d/.test(value))return null;
  const tokens=[...value.replaceAll(',','').matchAll(/(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|l)?/gi)];
  if(!tokens.length)return null;
  const fallback=tokens.findLast(t=>t[2])?.[2]?.toLowerCase();
  const amounts=tokens.map(t=>Number(t[1])*((t[2]||fallback||'').toLowerCase().startsWith('c')?1e7:/^l/.test((t[2]||fallback||'').toLowerCase())?1e5:1));
  return {min:Math.min(...amounts),max:Math.max(...amounts)};
}
export function projectFacts(project){
  const data={...(project.id==='venus-skky-city'?venus.manifest.catalog:{}),...project.manifest?.catalog};const demo=project.id==='sai-world-dreams';
  const bhk=(Array.isArray(data.bhk)?data.bhk.map(String):null)||[...new Set((project.configuration||'').match(/\d+(?:\.\d+)?/g)||[])];
  const variants=Array.isArray(data.variants)?data.variants:[];
  const areaValues=(data.area||project.area||'').replaceAll(',','').match(/\d+(?:\.\d+)?/g)?.map(Number)||[];
  return {id:project.id,name:project.name,location:project.location||'',developer:data.developer||project.developer||(demo?'Paradise Group':''),
    bhk:bhk.length?bhk:demo?['1','2','2.5','3']:[],propertyType:data.propertyType||(/villa/i.test(project.configuration)?'Villa':/plot/i.test(project.configuration)?'Plot':/office|commercial/i.test(project.configuration)?'Commercial':'Apartment'),
    status:project.constructionStatus??data.status??'',possession:data.possession||'',area:data.area||project.area||'',areaRange:areaValues.length?{min:Math.min(...areaValues),max:Math.max(...areaValues)}:null,
    price:priceRange(project.price),variants,amenities:data.amenities||(demo?['Swimming pool','Landscaped gardens','Clubhouse','Sports courts']:[]),
    photos:data.photos?.length?data.photos:[project.coverImage||'/assets/evara.webp',...(demo?['/scenes/sai-world-dreams/assets/exteriors/roadside-1280.webp']:[])],description:project.description||''};
}
export function searchCatalog(projects,filters={}){
  const {query='',localities=[],bhk=[],types=[],statuses=[],developers=[],minPrice='',maxPrice='',minArea='',maxArea='',sort='location'}=filters;
  const term=query.trim().toLowerCase();
  if(minPrice!==''&&maxPrice!==''&&Number(minPrice)>Number(maxPrice)||minArea!==''&&maxArea!==''&&Number(minArea)>Number(maxArea))return [];
  const result=projects.filter(project=>{
    const facts=projectFacts(project);
    if(term&&![project.name,project.location,project.configuration,facts.developer,project.price].some(v=>v?.toLowerCase().includes(term)))return false;
    if(localities.length&&!localities.includes(facts.location.split(',')[0].trim()))return false;
    if(bhk.length&&!bhk.some(n=>n.endsWith('+')?facts.bhk.some(v=>Number(v)>=Number(n.slice(0,-1))):facts.bhk.includes(n)))return false;
    if(types.length&&!types.includes(facts.propertyType))return false;
    if(statuses.length&&!statuses.includes(facts.status))return false;
    if(developers.length&&!developers.includes(facts.developer))return false;
    if(minPrice!==''&&(!facts.price||facts.price.max<Number(minPrice)))return false;
    if(maxPrice!==''&&(!facts.price||facts.price.min>Number(maxPrice)))return false;
    if(minArea!==''&&(!facts.areaRange||facts.areaRange.max<Number(minArea)))return false;
    if(maxArea!==''&&(!facts.areaRange||facts.areaRange.min>Number(maxArea)))return false;
    return true;
  });
  if(sort==='location')result.sort((a,b)=>{
    const locationOf = project => getCity(project.citySlugs?.[0])?.name || project.city || project.location || '';
    return locationOf(a).localeCompare(locationOf(b)) || (a.location||'').split(',')[0].localeCompare((b.location||'').split(',')[0]) || a.name.localeCompare(b.name);
  });
  if(sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='price-low'||sort==='price-high')result.sort((a,b)=>{const x=projectFacts(a).price?.min,y=projectFacts(b).price?.min;if(x==null)return y==null?0:1;if(y==null)return -1;return sort==='price-low'?x-y:y-x;});
  return result;
}
export const catalogStatusLabels={'under-construction':'Under construction','ready-to-move':'Ready to move','new-launch':'New launch'};

export function catalogFiltersFromQuery(query={}){
  return {
    bhk:['1','2','2.5','3','4','4+','5+'].includes(query.bhk)?[query.bhk]:[],
    statuses:typeof query.status==='string'&&Object.hasOwn(catalogStatusLabels,query.status)?[query.status]:[],
  };
}
