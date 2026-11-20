import {build} from 'esbuild';
import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),outdir=path.join(root,'public/scenes/runtime');
const entries={sai:'sai-world-dreams/app.js','sai-plans':'sai-world-dreams/floor-plans.js','sai-bridge':'sai-world-dreams/bridge.js',venus:'venus-skky-city/app.js',elements:'elements-new-panvel/app.js'};
const canonical=path.join(root,'public/scenes/sai-world-dreams/vendor/three.module.js');
await mkdir(outdir,{recursive:true});
let previous;try{previous=JSON.parse(await readFile(path.join(outdir,'manifest.json'),'utf8'));}catch{}
const result=await build({entryPoints:Object.fromEntries(Object.entries(entries).map(([key,file])=>[key,path.join(root,'public/scenes',file)])),outdir,bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',entryNames:'[name]-[hash]',chunkNames:'chunk-[hash]',metafile:true,minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,legalComments:'inline',plugins:[{name:'one-three-runtime',setup(b){b.onResolve({filter:/three\.module\.js/},()=>({path:canonical}));b.onResolve({filter:/^three$/},()=>({path:canonical}));b.onResolve({filter:/\?.*$/},a=>({path:path.resolve(a.resolveDir,a.path.split('?')[0])}));}}]});
const files=Object.keys(result.metafile.outputs).map(file=>path.basename(file));
const manifest={files,entries:{},sources:{}};
for(const file of Object.keys(result.metafile.inputs)){manifest.sources[path.relative(root,path.resolve(file))]=createHash('sha256').update(await readFile(file)).digest('hex');}
for(const [name,entry] of Object.entries(entries)){
 const output=Object.entries(result.metafile.outputs).find(([,v])=>v.entryPoint&&path.resolve(v.entryPoint)===path.join(root,'public/scenes',entry));
 if(!output)throw Error('Missing entry: '+name);manifest.entries[name]='/scenes/runtime/'+path.basename(output[0]);
}
for(const [slug,names] of [['sai-world-dreams',['sai-bridge','sai','sai-plans']],['venus-skky-city',['venus']],['elements-new-panvel',['elements']]]){
 const file=path.join(root,'public/scenes',slug,'index.html');let html=await readFile(file,'utf8');
 html=html.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/g,'').replace(/<link rel="modulepreload"[^>]*>\s*/g,'').replace(/<script type="module"[^>]*><\/script>/g,'');
 const preload=new Set();
 function collect(file){if(preload.has(file))return;preload.add(file);for(const item of result.metafile.outputs[file].imports||[])if(item.kind!=='dynamic-import'&&result.metafile.outputs[item.path])collect(item.path);}
 for(const name of names){const file=Object.keys(result.metafile.outputs).find(f=>f.endsWith(path.basename(manifest.entries[name])));collect(file);}
 html=html.replace('<title>',[...preload].map(f=>'<link rel="modulepreload" href="/scenes/runtime/'+path.basename(f)+'">').join('')+'<title>');
 html=html.replace('</body>',names.map(n=>'<script type="module" src="'+manifest.entries[n]+'"></script>').join('')+'</body>');await writeFile(file,html);
}
await writeFile(path.join(outdir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
for(const file of previous?.files||[])if(!files.includes(file)&&/^[-\w]+\.js$/.test(file))await unlink(path.join(outdir,file));
console.log('Bundled full-detail viewers into',files.length,'cacheable modules.');
