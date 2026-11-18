"""Visual inspection of the new generated scenery at the runtime camera poses.

These are Blender inspection renders, not browser screenshots.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/nature-landscape.glb'))
scene=bpy.context.scene
mask=bpy.data.images.load(str(ROOT/'public/assets/landscape/scan-edge-mask.png'));mask.colorspace_settings.name='Non-Color'
for obj in scene.objects:
 if obj.type!='MESH' or len(obj.data.polygons)<100000:continue
 print('FEATHERING',obj.name,len(obj.data.polygons),flush=True)
 for slot in obj.material_slots:
  material=slot.material
  if material is None or not material.use_nodes:continue
  nodes=material.node_tree.nodes;links=material.node_tree.links;bsdf=next((node for node in nodes if node.type=='BSDF_PRINCIPLED'),None)
  if bsdf is None:continue
  coordinate=nodes.new('ShaderNodeNewGeometry');scale=nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(1/264,-1/220,0)
  offset=nodes.new('ShaderNodeVectorMath');offset.operation='ADD';offset.inputs[1].default_value=(.5,.5,0)
  texture=nodes.new('ShaderNodeTexImage');texture.image=mask
  links.new(coordinate.outputs['Position'],scale.inputs[0]);links.new(scale.outputs['Vector'],offset.inputs[0]);links.new(offset.outputs['Vector'],texture.inputs['Vector']);links.new(texture.outputs['Color'],bsdf.inputs['Alpha'])
data=json.loads((ROOT/'public/assets/landscape/surroundings-height.json').read_text())
axis=data['axis'];n=len(axis)
vertices=[(x,-z,data['heights'][zi*n+xi]) for zi,z in enumerate(axis) for xi,x in enumerate(axis)]
faces=[(zi*n+xi,(zi+1)*n+xi,(zi+1)*n+xi+1,zi*n+xi+1) for zi in range(n-1) for xi in range(n-1)]
mesh=bpy.data.meshes.new('Surrounding relief');mesh.from_pydata(vertices,[],faces);mesh.update()
uv=mesh.uv_layers.new()
for face in mesh.polygons:
 for loop in face.loop_indices:
  co=mesh.vertices[mesh.loops[loop].vertex_index].co
  uv.data[loop].uv=(co.x/460+.5,-co.y/(460/3)+.5)
ground=bpy.data.objects.new('Generated woodland surroundings',mesh);bpy.context.collection.objects.link(ground)
mat=bpy.data.materials.new('Generated woodland');mat.use_nodes=True;nodes=mat.node_tree.nodes;links=mat.node_tree.links
tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'public/assets/landscape/woodland-surroundings.webp'));tex.extension='MIRROR'
links.new(tex.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color']);nodes.get('Principled BSDF').inputs['Roughness'].default_value=1
mesh.materials.append(mat)
cloudmat=bpy.data.materials.new('Generated transparent cloud');cloudmat.use_nodes=True;nodes=cloudmat.node_tree.nodes;links=cloudmat.node_tree.links;nodes.clear()
out=nodes.new('ShaderNodeOutputMaterial');mix=nodes.new('ShaderNodeMixShader');transparent=nodes.new('ShaderNodeBsdfTransparent');emission=nodes.new('ShaderNodeEmission');tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'public/assets/landscape/journey-cloud-cumulus.webp'));mult=nodes.new('ShaderNodeMath');mult.operation='MULTIPLY';mult.inputs[1].default_value=.62
links.new(tex.outputs['Alpha'],mult.inputs[0]);links.new(mult.outputs[0],mix.inputs[0]);links.new(transparent.outputs[0],mix.inputs[1]);links.new(emission.outputs[0],mix.inputs[2]);links.new(tex.outputs['Color'],emission.inputs[0]);links.new(mix.outputs[0],out.inputs[0])
clouds=[]
import re
placements=json.loads(re.search(r'const placements=(\[.*?\]);',(ROOT/'lib/journey-environment.js').read_text()).group(1))
for x,y,z,width in placements:
 bpy.ops.mesh.primitive_plane_add(size=1,location=(x,-z,y));cloud=bpy.context.object;cloud.scale=(width,width/3,1);cloud.data.materials.append(cloudmat);clouds.append(cloud)
scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=True
scene.render.resolution_percentage=100
scene.camera.data.sensor_fit='VERTICAL';scene.camera.data.sensor_height=32;scene.camera.data.lens=16/math.tan(math.radians(44)/2)
scene.camera.data.clip_start=.2;scene.camera.data.clip_end=5000
for shot in json.loads((ROOT/'output/blender/atmosphere-shots.json').read_text()):
 def point(p):return Vector((p[0],-p[2],p[1]))
 camera=scene.camera;camera.location=point(shot['position']);camera.rotation_euler=(point(shot['target'])-camera.location).to_track_quat('-Z','Y').to_euler()
 for cloud in clouds:cloud.rotation_euler=(camera.location-cloud.location).to_track_quat('Z','Y').to_euler()
 scene.render.resolution_x=shot['width'];scene.render.resolution_y=shot['height'];scene.render.filepath=str(ROOT/('output/blender/journey-'+shot['name']+'.png'));bpy.ops.render.render(write_still=True)
