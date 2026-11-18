"""Grade a narrow rail corridor on the supplied scan and export a web GLB."""
import bpy,json,math,hashlib,struct
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
ROOT=Path(__file__).resolve().parent.parent
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'models/nature-landscape.blend'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in bpy.context.scene.objects:o.select_set(False)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();land=bpy.context.object;land.name='Laslo.S nature scan — graded rail corridor'
land.data.update();bpy.context.view_layer.update();bvh=BVHTree.FromObject(land,bpy.context.evaluated_depsgraph_get())
plan=json.loads((ROOT/'output/blender/scan-track-plan.json').read_text());samples=plan['samples']
heights=[]
for point in samples:
    hit,normal,index,distance=bvh.ray_cast(Vector((point['x'],-point['z'],100)),Vector((0,0,-1)),200)
    if hit is None:raise RuntimeError('Planned track leaves the scanned surface at '+str(point))
    heights.append(hit.z)
minimum=samples[0]['u'];span=samples[-1]['u']-minimum
for point in samples:point['u']=(point['u']-minimum)/span
u=np.array([p['u'] for p in samples]);height=np.array(heights)
# Fit the meadow grade, rejecting tree-canopy hits and endpoint oscillations.
ground=height<=np.percentile(height,65)
polynomial=np.poly1d(np.polyfit(u[ground],height[ground],3))
def grade(t):return float(polynomial(t))+.08
for p in samples:p['y']=grade(p['u'])
tree=KDTree(len(samples))
for i,p in enumerate(samples):tree.insert((p['x'],-p['z'],0),i)
tree.balance();edited=0;max_change=0
for vertex in land.data.vertices:
    co=vertex.co;point,index,distance=tree.find((co.x,co.y,0))
    if distance>=7:continue
    best=None
    for j in [max(0,index-1),min(index,len(samples)-2)]:
        a=samples[j];b=samples[j+1];dx=b['x']-a['x'];dy=-(b['z']-a['z']);length=dx*dx+dy*dy
        t=max(0,min(1,((co.x-a['x'])*dx+(co.y+a['z'])*dy)/length))
        d=math.hypot(co.x-a['x']-dx*t,co.y+a['z']-dy*t)
        if best is None or d<best[0]:best=(d,a['u']+(b['u']-a['u'])*t)
    distance,t=best
    if distance>=7:continue
    blend=1 if distance<=5.5 else max(0,min(1,(7-distance)/1.5));blend=blend*blend*(3-2*blend)
    target=grade(t)-.04;delta=(target-co.z)*blend;co.z+=delta;max_change=max(max_change,abs(delta));edited+=1
land.data.update()
# Collapse redundant scan detail for web use; retain texture seams and materials.
modifier=land.modifiers.new('Web geometry reduction','DECIMATE');modifier.ratio=.45;modifier.use_collapse_triangulate=True;modifier.delimit={'UV','MATERIAL'}
bpy.context.view_layer.objects.active=land;bpy.ops.object.modifier_apply(modifier=modifier.name)
land.data.calc_loop_triangles()
# A narrow graded earth formation fills small scan holes under the railway.
# It is confined to the two-track corridor, below the ballast, not a site plane.
vertices=[];faces=[]
for i,p in enumerate(samples):
    a=samples[max(0,i-1)];b=samples[min(len(samples)-1,i+1)]
    dx=b['x']-a['x'];dz=b['z']-a['z'];length=math.hypot(dx,dz)
    nx=-dz/length;nz=dx/length
    for side in [-3.0,1.1]:vertices.append((p['x']+nx*side,-p['z']-nz*side,p['y']-.038))
    if i:faces.append((2*i-2,2*i-1,2*i+1,2*i))
mesh=bpy.data.meshes.new('Graded railway earth formation');mesh.from_pydata(vertices,[],faces);mesh.update()
formation=bpy.data.objects.new('Ground contact beneath both railway lines',mesh);bpy.context.collection.objects.link(formation)
material=bpy.data.materials.new('Photographic woodland earth');material.use_nodes=True
bsdf=material.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=1
texture=material.node_tree.nodes.new('ShaderNodeTexImage');texture.image=bpy.data.images.load(str(ROOT/'public/assets/landscape/woodland-surroundings.webp'))
material.node_tree.links.new(texture.outputs['Color'],bsdf.inputs['Base Color']);mesh.materials.append(material)
uv=mesh.uv_layers.new()
for face in mesh.polygons:
    for loop in face.loop_indices:
        co=mesh.vertices[mesh.loops[loop].vertex_index].co
        uv.data[loop].uv=(co.x/460+.5,-co.y/(460/3)+.5)
formation.select_set(True);land.select_set(True)
out=ROOT/'public/models/nature-landscape.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True)
# Preserve creator/license provenance inside the delivered GLB as well as its manifest.
body=out.read_bytes();json_length=struct.unpack_from('<I',body,12)[0];document=json.loads(body[20:20+json_length])
document['asset']['extras']={'author':'Laslo.S (https://sketchfab.com/Laslo.S)','license':'CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/)','source':'https://sketchfab.com/3d-models/photogrammetry-3d-scan-nature-landscape-e0050374e75347929017942fe761670f','modifications':'Uniform scale, graded railway corridor, 45 percent geometry reduction.'}
encoded=json.dumps(document,separators=(',',':')).encode();encoded+=b' '*((-len(encoded))%4);binary=body[20+json_length:]
out.write_bytes(struct.pack('<III',0x46546c67,2,20+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+binary)
inspection=json.loads((ROOT/'output/blender/scan-inspection.json').read_text())
main=[{'x':p['x'],'y':p['y'],'z':p['z']} for p in samples]
route={'points':main,'fullSamples':samples,'stations':[.27,.5,.73],'extension':0,'profileCoefficients':list(map(float,polynomial)),'originalRouteLength':plan['length']+88}
assetdir=ROOT/'public/assets/landscape';assetdir.mkdir(parents=True,exist_ok=True)
(assetdir/'rail-profile.json').write_text(json.dumps(route,separators=(',',':')))
(ROOT/'lib/scan-route-data.json').write_text(json.dumps({'points':[[p['x'],p['y'],p['z']] for p in main],'stations':route['stations']},separators=(',',':')))
manifest={'schemaVersion':1,'upAxis':'Y','units':'Illustrative scene units; source uniformly scaled for presentation.','editableSource':'models/nature-landscape-web.blend','normalizationScale':inspection['scale'],'name':'Photogrammetry | 3D scan nature landscape','author':'Laslo.S','authorUrl':'https://sketchfab.com/Laslo.S','source':'https://sketchfab.com/3d-models/photogrammetry-3d-scan-nature-landscape-e0050374e75347929017942fe761670f','license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','url':'/models/nature-landscape.glb','bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'sourceSha256':inspection['originalSha256'],'bounds':inspection['boundsYUp'],'triangles':len(land.data.loop_triangles)+len(faces)*2,'modifications':['Recentered and uniformly scaled for the illustrative railway scene.','Narrow track corridor graded to the sampled surface; outer landscape and textures retained.','Geometry reduced to 45 percent, preserving UV/material seams.'],'grounding':{'editedVertices':edited,'maximumAdjustment':max_change,'sampleHeightRange':[min(heights),max(heights)]}}
(assetdir/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('SCAN_EXPORT',manifest,flush=True)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/nature-landscape-web.blend'))
