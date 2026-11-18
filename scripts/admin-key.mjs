import fs from 'node:fs/promises';
import path from 'node:path';
import {project} from './rust.mjs';
const data=process.env.AERO_DATA_DIR||path.join(project,'backend/data');
try{console.log((await fs.readFile(path.join(data,'admin-key.txt'),'utf8')).trim());}catch{console.error('Start the Rust backend first: npm run dev:backend');process.exitCode=1;}
