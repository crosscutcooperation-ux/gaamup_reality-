const citySlugs=new Set(['dombivli','panvel']);
export function locationSearchUrl(city='',terms=[],{bhk='',status=''}={}){
 const selected=[...new Set(terms.filter(t=>typeof t==='string').map(t=>t.trim().slice(0,150)).filter(Boolean))].slice(0,3);
 const query=new URLSearchParams();selected.forEach(t=>query.append('place',t));
 if(['1','2','2.5','3','4+'].includes(bhk))query.set('bhk',bhk);
 if(['under-construction','ready-to-move','new-launch'].includes(status))query.set('status',status);
 return `/locations${citySlugs.has(city)?'/'+city:''}${query.size?'?'+query:''}`;
}
