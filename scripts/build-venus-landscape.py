"""Editable illustrative Dombivli terrain; retains a flat site clearance."""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];OUT=R/'public/scenes/venus-skky-city/assets';EDIT=R/'output/venus-landscape';EDIT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);random.seed(73)
# Blender Z-up -> glTF Y-up. Site coordinates are x,z; Blender y = -site z.
N=180;extent=4400;verts=[];faces=[];uvs=[]
for j in range(N+1):
 z=(j/N-.5)*extent
 for i in range(N+1):
  x=(i/N-.5)*extent;clearance=max(abs(x)/195,abs(z+25)/225);blend=min(1,max(0,(clearance-1)/1.6));blend=blend*blend*(3-2*blend)
  h=-.38+blend*(5+7*math.sin(x*.007)*math.cos(z*.006)+3*math.sin(x*.022+z*.011))
  verts.append((x,-z,h))
for j in range(N):
 for i in range(N):
  a=j*(N+1)+i;faces.append((a,a+N+1,a+N+2,a+1))
mesh=bpy.data.meshes.new('Undulating terrain with protected township footprint');mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new('Dombivli regional terrain — illustrative relief',mesh);bpy.context.collection.objects.link(obj)
uv=mesh.uv_layers.new(name='Satellite UV')
for p in mesh.polygons:
 p.use_smooth=True
 for k in p.loop_indices:
  x,y,h=verts[mesh.loops[k].vertex_index];uv.data[k].uv=(x/extent+.5,.5+y/extent)
mat=bpy.data.materials.new('Green regional satellite · EOX Sentinel-2');mat.use_nodes=True;n=mat.node_tree.nodes;links=mat.node_tree.links;p=n.get('Principled BSDF');p.inputs['Roughness'].default_value=1
tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(R/'public/scenes/sai-world-dreams/assets/dombivli-satellite-2016.jpg'));tex.image.pack();links.new(tex.outputs['Color'],p.inputs['Base Color']);obj.data.materials.append(mat)
# Trees stand beyond the site, preserving all supplied building and walk coordinates.
leaf=bpy.data.materials.new('Woodland canopy cutouts');leaf.use_nodes=True;leaf.surface_render_method='DITHERED';p=leaf.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.95;p.inputs['Base Color'].default_value=(.12,.23,.08,1)
t=leaf.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(R/'public/scenes/sai-world-dreams/assets/canopy-spray.webp'));t.image.pack();leaf.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color']);leaf.node_tree.links.new(t.outputs['Alpha'],p.inputs['Alpha'])
vs=[];fs=[];uvs=[]
for i in range(420):
 angle=random.random()*math.tau;radius=240+random.random()**1.5*1100;x=math.cos(angle)*radius;z=math.sin(angle)*radius-25
 if -215<x<200 and -250<z<215:continue
 clearance=max(abs(x)/195,abs(z+25)/225);blend=min(1,max(0,(clearance-1)/1.6));blend=blend*blend*(3-2*blend);h=-.38+blend*(5+7*math.sin(x*.007)*math.cos(z*.006)+3*math.sin(x*.022+z*.011));height=random.uniform(10,21);width=height*.9
 for angle in [random.random()*math.pi,random.random()*math.pi+math.pi/2]:
  dx=math.cos(angle)*width/2;dz=math.sin(angle)*width/2;k=len(vs);vs.extend([(x-dx,-(z-dz),h),(x+dx,-(z+dz),h),(x+dx,-(z+dz),h+height),(x-dx,-(z-dz),h+height)]);fs.append((k,k+1,k+2,k+3));uvs.extend([(0,0),(1,0),(1,1),(0,1)])
m=bpy.data.meshes.new('Woodland strips');m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new('Regional woodland silhouettes',m);bpy.context.collection.objects.link(o);m.materials.append(leaf);uv=m.uv_layers.new(name='Canopy UV')
for poly in m.polygons:
 for k in poly.loop_indices:uv.data[k].uv=uvs[m.loops[k].vertex_index]
world=bpy.data.worlds.new('Daylight review');bpy.context.scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.45,.63,.8,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4
bpy.ops.object.light_add(type='SUN',location=(-160,-195,205));bpy.context.object.data.energy=2.3;bpy.context.object.rotation_euler=(math.radians(28),math.radians(-35),math.radians(-25))
bpy.ops.object.camera_add(location=(-187,28,60));camera=bpy.context.object;camera.rotation_euler=(Vector((4,28,55))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=35;bpy.context.scene.camera=camera
bpy.ops.wm.save_as_mainfile(filepath=str(EDIT/'venus-surroundings.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'venus-surroundings.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_apply=True)
(EDIT/'manifest.json').write_text(json.dumps({'asset':'venus-surroundings.glb','source':'EOX Sentinel-2 cloudless 2016, CC BY 4.0','relief':'Illustrative, not measured','clearance':{'halfWidth':195,'halfDepth':225,'centerZ':-25},'editable':'venus-surroundings.blend'},indent=2))
print('VENUS_TERRAIN_EXPORTED',flush=True)
