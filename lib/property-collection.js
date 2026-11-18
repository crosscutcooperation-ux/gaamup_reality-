import {projectFacts} from './catalog-search.js';
import {getCity,properties as bundledProperties} from './catalog.js';
const retiredSamples=new Set(['evara','greenfront']);
/** Public inventory never creates sample residences to fill empty card slots. */
export function isPublicProperty(property){
  return property.published!==false&&!property.archived&&!property.preview&&!retiredSamples.has(property.id)&&!property.id?.startsWith('preview-');
}
export function getDisplayProperties(properties=[]){
  return properties.filter(property=>property.featured&&isPublicProperty(property));
}
export function projectProperties(projects=[],inventory=[]){
  const residences=projects.filter(p=>p.published&&!p.archived).map(project=>{
    const facts=projectFacts(project),city=getCity(project.citySlugs?.[0]);
    return {id:project.id,name:project.name,city:city?.name||project.location?.split(',')[0]||'',locality:project.location?.split(',')[0]||'',price:project.price||'Price on request',area:facts.area,bhk:facts.bhk.length?`${facts.bhk.join(', ')} BHK`:project.configuration,developer:facts.developer,image:project.coverImage,description:project.description,constructionStatus:facts.status,featured:true,published:true,projectHref:`/projects/${project.slug}${city?`?city=${city.slug}`:''}`};
  });
  const ids=new Set([...projects,...bundledProperties].map(p=>p.id));
  return [...residences,...getDisplayProperties(inventory).filter(p=>!ids.has(p.id))]
    .sort((a,b)=>(a.city||'\uffff').localeCompare(b.city||'\uffff')||(a.locality||'').localeCompare(b.locality||''));
}
export function filterProperties(properties,{bhk='',constructionStatus=''}={}){
  return properties.filter(property=>{
    const sizes=((property.bhk||'').match(/\d+(?:\.\d+)?/g)||[]).map(Number);
    const configuration=!bhk||sizes.some(size=>bhk==='4+'?size>=4:size===Number(bhk));
    return configuration&&(!constructionStatus||property.constructionStatus===constructionStatus);
  });
}
export function propertyRows(properties){const split=Math.ceil(properties.length/2);return [properties.slice(0,split),properties.slice(split)];}
