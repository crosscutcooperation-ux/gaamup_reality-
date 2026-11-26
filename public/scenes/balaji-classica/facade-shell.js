export function pointInFootprint(x,z,s){
 const p=s.outline;let inside=false;
 for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside;
 return inside;
}
export function elevationSpan(s){const a=s.detailYaw||0,c=Math.cos(a),n=Math.sin(a),xs=s.outline.map(([x,z])=>c*x+n*z);return [Math.min(...xs),Math.max(...xs)];}
