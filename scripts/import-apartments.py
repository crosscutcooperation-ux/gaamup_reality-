"""Import the validated complete apartments without modifying their source library."""
import hashlib,json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
SOURCE=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT.parent.parent/'backend program/sai-world-dreams-apartments'
DEST=ROOT/'public/scenes/sai-world-dreams/assets/apartments'
manifest=json.loads((SOURCE/'source/apartment-manifest.json').read_text())
entries={}
for apartment in manifest['apartments']:
    src=SOURCE/apartment['file']
    digest=hashlib.sha256(src.read_bytes()).hexdigest()
    if digest!=apartment['sha256']:raise ValueError('Source checksum mismatch: '+str(src))
    tower=apartment['towerName'].lower();configuration=apartment['configuration']
    relative=Path(tower)/configuration/(apartment['unit']+'.glb')
    dst=DEST/relative;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
    entries[f"{tower}:{configuration}:{apartment['unit']}"]={
        'url':'assets/apartments/'+relative.as_posix(),'tower':tower,'configuration':configuration,
        'unit':apartment['unit'],'bedrooms':apartment['bedrooms'],'bytes':src.stat().st_size,
        'sha256':digest,'sourcePage':apartment['sourceFloorPage']}
index={'version':1,'scope':'Complete furnished apartments, one model per numbered plan configuration.',
       'units':'metres','upAxis':'Y','source':'SWD Plans.pdf / backend-program validated apartment library',
       'limitations':manifest['limitations'],'sharedReferences':{'orchard':'spring'},'apartments':entries}
(DEST/'index.json').write_text(json.dumps(index,indent=2)+'\n')
print(f'Imported {len(entries)} complete furnished apartments with verified checksums.')
