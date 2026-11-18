import * as THREE from 'three';

const panels={
  coachLower:{width:2048,height:154},
  coachUpper:{width:2057,height:60},
  cabLower:{width:1024,height:145},
  cabUpper:{width:1024,height:56},
};

function repeatArtwork(ctx,artwork,width,height){
  // Tile at the image's natural aspect ratio instead of squeezing it flat.
  const tileWidth=height*artwork.width/artwork.height;
  for(let x=0;x<width;x+=tileWidth)ctx.drawImage(artwork,x,0,tileWidth,height);
}

function makePanelTexture(logo,artwork,{width,height},upper){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  repeatArtwork(ctx,artwork,width,height);
  ctx.fillStyle=upper?'rgba(22,48,75,.76)':'rgba(255,245,224,.90)';
  const badgeWidth=upper?Math.min(width*.24,height*8):Math.min(width*.33,height*4.4);
  const badgeHeight=upper?height*.77:height*.82;
  ctx.fillRect((width-badgeWidth)/2,(height-badgeHeight)/2,badgeWidth,badgeHeight);
  const logoHeight=upper?height*.58:height*.52;
  const logoWidth=logoHeight*logo.width/logo.height;
  ctx.drawImage(logo,(width-logoWidth)/2,upper?(height-logoHeight)/2:height*.12,logoWidth,logoHeight);
  if(!upper){
    ctx.fillStyle='#513321';
    ctx.font=`700 ${Math.round(height*.16)}px Arial, sans-serif`;
    ctx.textAlign='center';
    ctx.fillText('panvibesonline.com',width/2,height*.83);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
}

/** Print layouts fitted to the AC local's cab, coach, belt, and roofline. */
export function createTrainAdvertTexture(logo,artwork){
  return Object.fromEntries(Object.entries(panels).map(([name,size])=>[
    name,makePanelTexture(logo,artwork,size,name.endsWith('Upper')),
  ]));
}
