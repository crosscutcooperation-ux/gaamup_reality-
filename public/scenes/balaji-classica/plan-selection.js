// Source drawing coordinates remain independent of illustrative render pixels.
export function mapPolygon(polygon, from, to) {
  return polygon.map(([x,y]) => [to[0]+(x-from[0])/(from[2]-from[0])*(to[2]-to[0]),to[1]+(y-from[1])/(from[3]-from[1])*(to[3]-to[1])]);
}
export function furnishedRooms(template, unit) {
  const [w,h]=template.renderSize,b=template.renderBounds;
  if(template.renderRooms)return template.renderRooms.map(room=>({...room,polygon:room.polygon.map(([x,y])=>[unit.flipX?w-x:x,unit.flipY?h-y:y])}));
  return template.normalizedRooms.map(room=>({...room,polygon:room.polygon.map(([u,v])=>{
    const x=b[0]+u*(b[2]-b[0]),y=b[1]+v*(b[3]-b[1]);
    return [unit.flipX?w-x:x,unit.flipY?h-y:y];
  })}));
}
export function insidePolygon([x,y], polygon) {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [a,b]=polygon[i],[c,d]=polygon[j];
    if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;
  }
  return inside;
}
