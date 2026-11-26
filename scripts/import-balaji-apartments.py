"""Register the supplied apartment GLBs without changing their geometry or textures."""
from pathlib import Path
import hashlib, json, shutil, sqlite3, struct, sys

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1])
data=root/'backend/data'
target=data/'scene-assets/balaji-apartments'
target.mkdir(parents=True,exist_ok=True)
manifest=json.loads((source/'source/apartment-manifest.json').read_text())
index={'units':{},'alternatives':[],'note':'Supplied furnished reference models. Typical floor ranges only; furnishings and dimensions approximate.'}
connection=sqlite3.connect(data/'properties.sqlite3')
for item in manifest['apartments']:
    src=source/item['file'];content=src.read_bytes()
    assert content[:4]==b'glTF' and len(content)==struct.unpack_from('<I',content,8)[0]
    assert hashlib.sha256(content).hexdigest()==item['sha256'],item['id']
    key=item['building'].lower()+'-'+str(item['unit']).zfill(2)
    name=item['id']+'.glb';dest=target/name
    if not dest.exists() or hashlib.sha256(dest.read_bytes()).hexdigest()!=item['sha256']:shutil.copy2(src,dest)
    entry={'id':item['id'],'url':'/scene-assets/balaji-apartments/'+name,'building':item['building'],'flat':item['unit'],'bedrooms':item['bedrooms'],'sha256':item['sha256'],'bytes':len(content),'label':item['label'],'areaSqFt':item['areaSqFt'],'floors':item.get('floors',''),'sourcePDFPage':item['sourcePDFPage']}
    if item.get('alternative'):index['alternatives'].append(entry)
    else:index['units'][key]=entry
    record={**entry,'projectId':'balaji-classica','kind':'unit','name':item['label'],'mediaType':'model/gltf-binary','buildingId':item['building'].upper(),'floorId':'','unitId':key,'metadata':{'sourcePDFPage':item['sourcePDFPage'],'bedrooms':item['bedrooms'],'alternative':item.get('alternative',False),'furnished':True,'units':'metres','upAxis':'Y'}}
    connection.execute('INSERT OR IGNORE INTO project_assets(id,project_id,document) VALUES(?,?,?)',(item['id'],'balaji-classica',json.dumps(record)))
assert len(index['units'])==40 and len(index['alternatives'])==1
connection.commit();connection.close()
out=root/'public/scenes/balaji-classica/assets/apartments/index.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(index,indent=2)+'\n')
print('Imported 40 numbered apartments and one unassigned Jodi reference.')
