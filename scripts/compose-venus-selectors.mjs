import fs from 'node:fs/promises';import sharp from 'sharp';
const root='public/scenes/venus-skky-city/assets/plans',out=root+'/generated';let total=0;
for(const building of ['A','C','F','lavista','aristo']){
 const layout=JSON.parse(await fs.readFile(root+'/'+building+'.json','utf8')),scale=4096/layout.width,composites=[];
 const canvasHeight=Math.ceil(layout.height*scale);
 let core=`<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="${canvasHeight}" viewBox="0 0 ${layout.width} ${layout.height}"><rect width="100%" height="100%" fill="#f6f4f1"/></svg>`;
 // Retain the supplied lift/stair/corridor geometry only; apartment imagery is regenerated.
 const mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="${canvasHeight}" viewBox="0 0 ${layout.width} ${layout.height}">${(layout.corridors||[]).map(poly=>`<polygon points="${poly.map(p=>p.join(',')).join(' ')}" fill="white"/>`).join('')}</svg>`);
 const coreImage=await sharp('public/scenes/venus-skky-city/'+layout.image).resize(4096,canvasHeight,{fit:'fill'}).ensureAlpha().composite([{input:mask,blend:'dest-in'}]).png().toBuffer();composites.push({input:coreImage,left:0,top:0});
 for(const unit of layout.units){const d=JSON.parse(await fs.readFile('public/scenes/venus-skky-city/'+unit.data,'utf8'));const width=Math.round(d.width*scale),height=Math.round(d.height*scale);const input=await sharp(out+'/'+unit.id+'-furnished.webp').trim({threshold:18}).resize(width,height,{fit:'fill'}).webp({quality:90}).toBuffer();composites.push({input,left:Math.max(0,Math.round(unit.origin[0]*scale)),top:Math.max(0,Math.round(unit.origin[1]*scale))});total++;}
 await sharp(Buffer.from(core)).composite(composites).webp({quality:91}).toFile(out+'/'+building+'-selector.webp');
}
console.log('Composed',total,'furnished apartments into five high resolution clickable floor selectors.');
