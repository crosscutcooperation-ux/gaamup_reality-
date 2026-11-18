import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {runRust} from './rust.mjs';
const require=createRequire(import.meta.url),backend=process.env.AERO_BACKEND_URL||`http://127.0.0.1:${process.env.AERO_BACKEND_PORT||4000}`;
let rust,frontend,stopping=false;
function stop(){if(stopping)return;stopping=true;frontend?.kill('SIGINT');rust?.kill('SIGINT');}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
process.on('exit',stop);
async function ready(){try{const r=await fetch(backend+'/api/health',{signal:AbortSignal.timeout(1000)});return r.ok&&(await r.json()).runtime==='rust';}catch{return false;}}
if(!await ready()){
  console.log('Starting the Rust property backend. The first build can take a minute.');
  rust=runRust();let failed=false;rust.on('error',()=>{failed=true;console.error('Rust/Cargo is missing. See README.md for installation.');});rust.on('exit',()=>{failed=true;if(frontend&&!stopping){console.error('Rust backend stopped.');stop();process.exitCode=1;}});
  const until=Date.now()+300000;while(!failed&&!stopping&&Date.now()<until&&!await ready())await new Promise(resolve=>setTimeout(resolve,400));
  if(failed||stopping||!await ready()){stop();process.exitCode=1;} 
}
if(!process.exitCode&&!stopping){
  const mode=process.argv.includes('--production')?'start':'dev';
  const port=process.env.AERO_FRONTEND_PORT||'4173';console.log(`Website: http://127.0.0.1:${port}/`);console.log(`Property desk: http://127.0.0.1:${port}/admin`);console.log('Admin key: run npm run admin:key in another Terminal window.');
  frontend=spawn(process.execPath,[require.resolve('next/dist/bin/next'),mode,'--hostname','127.0.0.1','--port',port],{stdio:'inherit',env:process.env});frontend.on('exit',code=>{stop();process.exitCode=code||0;});
}
