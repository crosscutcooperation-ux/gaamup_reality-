"""Import supplied complete apartment GLBs into the existing Rust asset library."""
from pathlib import Path
import json,hashlib,shutil,sqlite3,struct
ROOT=Path(__file__).resolve().parents[1];SOURCE=Path('/Users/robin/Documents/ChatGPT/backend program/venus-skky-city-apartments');DEST=ROOT/'backend/data/scene-assets/venus-apartments';DEST.mkdir(parents=True,exist_ok=True)
source=json.loads((SOURCE/'source/apartment-manifest.json').read_text());mapping={'Aristo':'aristo','La-Vista':'lavista','Tower-C':'C','Tower-F':'F','Vivanta-A':'A'}
index={'schemaVersion':1,'projectId':'venus-skky-city','units':{},'alternatives':[],'provenance':{'sourceFolder':source['sourceFolder'],'units':'metres','upAxis':'Y','note':'Complete furnished apartment GLBs supplied by the user. Source dimensions and furnishings remain approximate.'}}
connection=sqlite3.connect(ROOT/'backend/data/properties.sqlite3');mismatches=[]
for a in source['apartments']:
 folder=Path(a['file']).parts[1];building=mapping[folder];alternative=a.get('alternative',False);unit_id=building+'-'+(str(a['unit']).zfill(2) if not alternative else 'jodi');asset_id='venus-apartment-'+unit_id
 src=SOURCE/a['file'];data=src.read_bytes();assert data[:4]==b'glTF';assert len(data)==struct.unpack_from('<I',data,8)[0];digest=hashlib.sha256(data).hexdigest();assert digest==a['sha256'];gltf=json.loads(data[20:20+struct.unpack_from('<I',data,12)[0]]);assert not set(gltf.get('extensionsRequired',[]))&{'KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'}
 dest=DEST/(unit_id+'.glb');shutil.copy2(src,dest);url='/scene-assets/venus-apartments/'+dest.name
 record={'id':asset_id,'projectId':'venus-skky-city','kind':'unit','name':a['label'],'url':url,'bytes':len(data),'sha256':digest,'mediaType':'model/gltf-binary','buildingId':'venus-'+building,'floorId':'','unitId':unit_id,'metadata':{'bedrooms':a['bedrooms'],'source':a['source'],'sourcePDFPage':a.get('sourcePDFPage'),'alternative':alternative,'prototype':a['prototype'],'furnished':True,'upAxis':'Y','units':'metres','mirror':a['mirror'],'rotation':a['rotation']}}
 connection.execute('INSERT OR REPLACE INTO project_assets(id,project_id,document) VALUES(?,?,?)',(asset_id,'venus-skky-city',json.dumps(record)))
 info={'id':unit_id,'url':url,'building':building,'flat':a['unit'],'bedrooms':a['bedrooms'],'sha256':digest,'bytes':len(data),'label':a['label']}
 if alternative:index['alternatives'].append(info)
 else:
  index['units'][unit_id]=info
  layout=json.loads((ROOT/'public/scenes/venus-skky-city/assets/plans'/f'{building}.json').read_text());old=next(u for u in layout['units'] if u['id']==unit_id)
  if old['beds']!=a['bedrooms']:mismatches.append((unit_id,old['beds'],a['bedrooms']))
connection.commit();connection.close();assert len(index['units'])==61
out=ROOT/'public/scenes/venus-skky-city/assets/apartments';out.mkdir(exist_ok=True);(out/'index.json').write_text(json.dumps(index,indent=2)+'\n');print('Imported',len(index['units']),'numbered apartments and',len(index['alternatives']),'Jodi alternatives. Bedroom mismatches:',mismatches)
