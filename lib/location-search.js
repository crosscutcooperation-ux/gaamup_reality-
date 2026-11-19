const citySlugs=new Set(['dombivli','panvel']);
export function locationSearchUrl(city='',terms=[]){
 const selected=[...new Set(terms.filter(t=>typeof t==='string').map(t=>t.trim().slice(0,150)).filter(Boolean))].slice(0,3);
 const query=new URLSearchParams();selected.forEach(t=>query.append('place',t));
 return `/locations${citySlugs.has(city)?'/'+city:''}${query.size?'?'+query:''}`;
}
