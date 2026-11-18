"""Recover the supplied repository's complete plan assets and verify Git hashes."""
from pathlib import Path
import concurrent.futures,hashlib,json,subprocess,time,urllib.request,os
repo=Path(__file__).resolve().parents[2]/'New-SAI-WORLD-REPO'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
tree=json.load(urllib.request.urlopen(urllib.request.Request(f'https://api.github.com/repos/crosscutcooperation-ux/New-SAI-WORLD-REPO/git/trees/{commit}?recursive=1',headers={'User-Agent':'Aero-project-sync'}),timeout=60))['tree']
files=[entry for entry in tree if entry['type']=='blob' and entry['path'].startswith('dist/assets/plans/')]
def recover(entry):
    relative=entry['path'];target=repo/relative
    for attempt in range(5):
        try:
            if target.exists():body=target.read_bytes()
            else:
                # curl uses the host network resolver consistently for large batches.
                temporary=target.with_suffix(target.suffix+'.download');temporary.parent.mkdir(parents=True,exist_ok=True)
                subprocess.run(['curl','--fail','--silent','--show-error','--retry','3','--retry-all-errors','--max-time','120','--output',str(temporary),f'https://raw.githubusercontent.com/crosscutcooperation-ux/New-SAI-WORLD-REPO/{commit}/{relative}'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,check=True)
                body=temporary.read_bytes();temporary.unlink()

            digest=hashlib.sha1(b'blob '+str(len(body)).encode()+b'\0'+body).hexdigest()
            if digest!=entry['sha']:
                if target.exists():target.unlink()
                raise ValueError('Git hash mismatch: '+relative)
            target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(body)
            result=subprocess.run(['git','hash-object','-w','--stdin'],input=body,cwd=repo,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
            if result.stdout.decode().strip()!=entry['sha']:raise ValueError('Git object mismatch')
            return len(body)
        except Exception:
            if attempt==4:raise
            time.sleep(attempt+1)
print(f'Recovering {len(files)} plan/unit assets from {commit[:7]}',flush=True)
size=0;fail=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    futures={executor.submit(recover,entry):entry for entry in files}
    for number,future in enumerate(concurrent.futures.as_completed(futures),1):
        try:size+=future.result()
        except Exception as error:fail.append(futures[future]['path']);print('FAILED',futures[future]['path'],str(error),flush=True)
        if number%50==0:print(f'{number}/{len(files)} files · {size/1024**2:.1f} MB verified',flush=True)
if fail:raise SystemExit('Missing assets: '+', '.join(fail))
subprocess.run(['git','update-index','--no-skip-worktree','-z','--stdin'],input=b'\0'.join(entry['path'].encode() for entry in files)+b'\0',cwd=repo,check=True)
print('ALL_PLAN_ASSETS_RECOVERED',flush=True)
