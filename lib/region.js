export const REGION={bounds:[72.96,19.10,73.19,19.30],width:280,depth:242,verticalScale:.036};
export function geoToWorld(lon,lat){
  const [west,south,east,north]=REGION.bounds;
  return [(lon-(west+east)/2)/(east-west)*REGION.width,((south+north)/2-lat)/(north-south)*REGION.depth];
}
// The stations are geographic anchors; the rail connection is a visual journey,
// not a claim about the operating line or a proposed metro alignment.
export const LOCATION_ANCHORS=[
  {slug:'dombivli',lon:73.086,lat:19.218},
  {slug:'kalyan',lon:73.129,lat:19.236},
  {slug:'shilphata',lon:73.040,lat:19.143},
];
export const JOURNEY_COORDINATES=[
  [73.129,19.236],[73.116,19.231],[73.103,19.227],[73.086,19.218],
  [73.075,19.208],[73.063,19.193],[73.050,19.183],[73.045,19.163],[73.040,19.143],
];
