import fs from 'node:fs/promises';import sharp from 'sharp';
const root='public/scenes/venus-skky-city/assets/plans',dest=root+'/generated';await fs.mkdir(dest,{recursive:true});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
function lines(d,dx=0,dy=0){return d.walls.map(([x1,y1,x2,y2])=>`<path d="M${x1+dx} ${y1+dy}L${x2+dx} ${y2+dy}"/>`).join('');}
function svg(w,h,body){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="-12 -12 ${w+24} ${h+24}"><rect x="-12" y="-12" width="${w+24}" height="${h+24}" fill="#fff"/>${body}</svg>`;}
const modelIndex=JSON.parse(await fs.readFile('public/scenes/venus-skky-city/assets/apartments/index.json','utf8'));
const manifest={schemaVersion:1,note:'Generated clean 2D and furnished presentation drawings from individual supplied references. Layout details and finishes remain illustrative.',units:[],floors:[]};
for(const building of ['A','C','F','lavista','aristo']){
 const layout=JSON.parse(await fs.readFile(root+'/'+building+'.json','utf8'));let floor='';
 for(const u of layout.units){const d=JSON.parse(await fs.readFile('public/scenes/venus-skky-city/'+u.data,'utf8'));const color=u.beds===1?'#e5ebe1':'#e3e9ef',polygon=d.footprint.map(p=>p.join(',')).join(' ');const body=`<polygon points="${polygon}" fill="#f5f3ed" stroke="#30332e" stroke-width="1.5"/><g fill="none" stroke="#282d29" stroke-width="2.2" stroke-linecap="square">${lines(d)}</g>`;
  const filename=u.id+'-2d.svg';await fs.writeFile(dest+'/'+filename,svg(d.width,d.height,body));
  const [dx,dy]=u.origin;floor+=`<g transform="translate(${dx} ${dy})"><polygon points="${polygon}" fill="${color}" stroke="#9da997" stroke-width="2"/><g fill="none" stroke="#30352f" stroke-width="2.6">${lines(d)}</g></g><text x="${u.center[0]}" y="${u.center[1]}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#41613d" stroke="#fff" stroke-width="6" paint-order="stroke">${String(u.flat).padStart(2,'0')}</text>`;
  manifest.units.push({id:u.id,building,flat:u.flat,beds:u.beds,plan:'generated/'+u.id+'-2d-clean.webp',furnished:'generated/'+u.id+'-furnished.webp',rotate:modelIndex.units[u.id]?.url||null});
 }
 for(const p of layout.corridors||[])floor=`<polygon points="${p.map(p=>p.join(',')).join(' ')}" fill="#eceee7" stroke="#b7bdb0" stroke-width="2"/>`+floor;
 const filename=building+'-floor.svg';await fs.writeFile(dest+'/'+filename,svg(layout.width,layout.height,floor));manifest.floors.push({id:building,plan:'generated/'+filename});
}
await fs.writeFile(dest+'/manifest.json',JSON.stringify(manifest,null,2));
// Web copies retain the original generated PNGs as editable source assets.
for(const file of (await fs.readdir(dest)).filter(f=>f.endsWith('-furnished.png')||f.endsWith('-2d-clean.png')))await sharp(dest+'/'+file).resize({width:2000,withoutEnlargement:true}).webp({quality:89}).toFile(dest+'/'+file.replace('.png','.webp'));
console.log('Prepared',manifest.units.length,'individual 2D and furnished asset pairs and',manifest.floors.length,'floor selector layouts.');
