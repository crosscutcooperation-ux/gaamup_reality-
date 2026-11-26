export function spaceWalkHotspots(points){
  if(points.length===2&&Math.abs(points[0].x-points[1].x)<135&&Math.abs(points[0].y-points[1].y)<35)points[1].y=points[0].y-42;
  return points;
}
