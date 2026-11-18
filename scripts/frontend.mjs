import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),mode=process.argv[2]||'dev';
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),mode,'--hostname','127.0.0.1','--port',process.env.AERO_FRONTEND_PORT||'4173'],{stdio:'inherit',env:process.env});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>{process.exitCode=code||0;});
