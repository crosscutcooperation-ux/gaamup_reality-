export const cities = [
  {name:'Dombivli',native:'डोंबिवली',slug:'dombivli',index:0},
  {name:'Panvel',native:'पनवेल',slug:'panvel',index:1},
];
export const railwayStations = cities;
export const properties = [
  {
    "id": "sai-world-dreams",
    "name": "Sai World Dreams",
    "city": "Dombivli",
    "locality": "Dombivli",
    "price": "₹52.50 L onwards",
    "constructionStatus": "under-construction",
    "area": "450–1322 sq.ft",
    "bhk": "1, 2, 2.5 & 3 BHK",
    "developer": "Paradise Group",
    "image": "/scenes/sai-world-dreams/assets/exteriors/courtyard-1280.webp",
    "featured": true,
    "published": true,
    "archived": false,
    "description": "Explore the residential towers, landscaped courtyard and pool terrace in an interactive 3D colony. This is a reference-led exterior study from the supplied project."
  },
  {
    "id": "venus-skky-city",
    "name": "Venus Skky City",
    "city": "Dombivli",
    "locality": "Dombivli East",
    "price": "₹42.25 L onwards",
    "constructionStatus": "under-construction",
    "area": "436–572 sq.ft",
    "bhk": "1 & 2 BHK",
    "developer": "Venus Nirvana LLP",
    "image": "/scenes/venus-skky-city/assets/elevation.webp",
    "featured": true,
    "published": true,
    "archived": false,
    "description": "Explore Venus Skky City’s nine residential buildings, pool, clubhouse, gardens and Jain temple. Select a tower and floor to see the supplied residential plans."
  },
  {
    "id": "elements-new-panvel",
    "name": "Codename Elements",
    "city": "Panvel",
    "locality": "New Panvel",
    "price": "Price on request",
    "constructionStatus": "under-construction",
    "area": "Area on request",
    "bhk": "1 & 2 BHK",
    "developer": "Today Group",
    "image": "/scenes/elements-new-panvel/assets/marketing/Front View.jpg",
    "featured": true,
    "published": true,
    "archived": false,
    "description": "Explore two residential towers, landscaped podium and pool in 3D. Select a floor and apartment to see the supplied plans."
  }
];
export const builders = [
  {logo:"SSL",style:"ssl",name:"SSL (SS Life Spaces)",city:"Dombivli",project:"Balaji Classica",projectHref:"/projects/balaji-classica?city=dombivli"},

  {
    "logo": "Paradise",
    "style": "paradise",
    "name": "Paradise Group",
    "city": "Dombivli",
    "project": "Sai World Dreams",
    "projectHref": "/projects/sai-world-dreams?city=dombivli"
  },
  {
    "logo": "Venus Nirvana",
    "style": "venus",
    "name": "Venus Nirvana LLP",
    "city": "Dombivli",
    "project": "Venus Skky City",
    "projectHref": "/projects/venus-skky-city?city=dombivli"
  },
  {logo:'Today Group',style:'today',name:'Today Group',city:'Panvel',project:'Codename Elements',projectHref:'/projects/elements-new-panvel?city=panvel'}
];
export function getCatalog(){return {cities,properties,builders};}
export function getCity(slug){return cities.find(city=>city.slug===slug);}
