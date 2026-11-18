import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const project=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export function runRust(args=['run'],options={}){
  const localCargo=path.join(project,'.tooling/cargo/bin/cargo');
  const cargo=existsSync(localCargo)?localCargo:(process.env.CARGO||'cargo');
  const env={...process.env,...options.env};
  if(existsSync(localCargo)){env.CARGO_HOME=path.join(project,'.tooling/cargo');env.RUSTUP_HOME=path.join(project,'.tooling/rustup');}
  return spawn(cargo,[...args,'--manifest-path',path.join(project,'backend/Cargo.toml')],{cwd:project,stdio:options.stdio||'inherit',env});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const child=runRust(process.argv.slice(2).length?process.argv.slice(2):['run']);
  child.on('error',()=>{console.error('Rust/Cargo was not found. Install Rust using the instructions in README.md.');process.exitCode=1;});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
  child.on('exit',(code)=>{process.exitCode=code||0;});
}
