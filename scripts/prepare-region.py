"""Reduce downloaded OSM map extracts into an offline, attributed scene database."""
import json,xml.etree.ElementTree as ET,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
nodes={};ways={}
for file in (ROOT/'output/imports/region').glob('*.osm'):
    source=ET.parse(file).getroot()
    for n in source.findall('node'):nodes[n.attrib['id']]=[float(n.attrib['lon']),float(n.attrib['lat'])]
    for way in source.findall('way'):ways[way.attrib['id']]=way
buildings=[];roads=[];water=[]
def numeric(value,fallback):
    try:return float(str(value).split(';')[0].replace(' m',''))
    except (ValueError,TypeError):return fallback
for id,way in ways.items():
    tags={tag.attrib['k']:tag.attrib['v'] for tag in way.findall('tag')}
    points=[nodes[n.attrib['ref']] for n in way.findall('nd') if n.attrib['ref'] in nodes]
    if len(points)<2:continue
    points=[[round(x,6),round(y,6)] for x,y in points]
    if not any(72.96<x<73.19 and 19.10<y<19.30 for x,y in points):continue
    if tags.get('building') and len(points)>3 and points[0]==points[-1]:
        levels=numeric(tags.get('building:levels'),3)
        height=numeric(tags.get('height'),levels*3.1)
        buildings.append({'id':id,'points':points,'height':round(max(3,min(height,160)),1),'heightKnown':bool(tags.get('height') or tags.get('building:levels'))})
    elif tags.get('highway') in ['motorway','trunk','primary','secondary','tertiary','residential','unclassified']:
        roads.append({'id':id,'kind':tags['highway'],'points':points})
    elif tags.get('natural')=='water' or tags.get('waterway') in ['river','riverbank','tidal_channel']:
        water.append({'id':id,'closed':points[0]==points[-1],'points':points})
out={'source':'OpenStreetMap contributors','license':'ODbL 1.0','licenseUrl':'https://www.openstreetmap.org/copyright','bounds':[72.96,19.10,73.19,19.30],'buildings':buildings,'roads':roads,'water':water,'note':'Original coordinates and tags from public OSM API extracts. Heights inferred from three storeys when no height/levels tag is present. Sparse map coverage is not filled with fictional buildings.'}
(ROOT/'public/assets/region/architecture.json').write_text(json.dumps(out,separators=(',',':')))
print('OSM scene:',len(buildings),'footprints,',len(roads),'road segments,',len(water),'water features')
