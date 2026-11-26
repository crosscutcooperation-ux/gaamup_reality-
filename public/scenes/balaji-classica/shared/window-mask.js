// Intersect the intended room openings with the registered glazing texture.
// Stone, rails and slab edges stay black even when the source has blue shadows.
export function registeredWindowMask(source,width,height,columns,floors=35){
  const output=new Uint8ClampedArray(width*height*4),rowHeight=height/floors;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,phase=(y%rowHeight)/rowHeight;
    const inRoom=phase>.14&&phase<.49&&columns.some(([left,right])=>x>Math.ceil(left*width)+1&&x<Math.floor(right*width)-1);
    const value=inRoom&&source[i]>180?255:0;output[i]=output[i+1]=output[i+2]=value;output[i+3]=255;
  }
  return output;
}
