"""Inspect the real exported scan and train at the runtime route coordinates."""
import bpy,json,math
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/nature-landscape.glb'))
data=json.loads((ROOT/'output/blender/scan-railway-scene.json').read_text())
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
def world(matrix):return C@Matrix([matrix[i::4] for i in range(4)])@C.inverted()
def point(p):return (p[0],-p[2],p[1])
def material(name,color,metal=0,rough=.8):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough;return m
steel=material('Rail steel',(.30,.34,.32),.8,.3);ballast=material('Crushed stone ballast',(.22,.20,.16));concrete=material('Sleeper concrete',(.52,.50,.43))
cube_meshes={}
def cube(name,size,location,mat,parent=None):
 key=(*size,mat.name)
 if key not in cube_meshes:
  mesh=bpy.data.meshes.new(name);vertices=[(x*size[0]/2,y*size[1]/2,z*size[2]/2) for x,y,z in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]];mesh.from_pydata(vertices,[],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]);mesh.materials.append(mat);mesh.update();cube_meshes[key]=mesh
 o=bpy.data.objects.new(name,cube_meshes[key]);bpy.context.collection.objects.link(o);o.location=location;o.parent=parent;return o
for track in data['tracks']:
 vertices=[]
 for sample in track['points']:
  p=sample['point'];n=sample['normal']
  for side in [-1,1]:vertices.append(point((p[0]+n[0]*side*.775,p[1]+.015,p[2]+n[2]*side*.775)))
 faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(track['points'])-1)]
 mesh=bpy.data.meshes.new('Continuous ballast bed');mesh.from_pydata(vertices,[],faces);mesh.update();o=bpy.data.objects.new('Continuous ballast bed',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(ballast)
 for side in [-.3,.3]:
  curve=bpy.data.curves.new('Continuous steel rail','CURVE');curve.dimensions='3D';curve.bevel_depth=.032;curve.bevel_resolution=2;spline=curve.splines.new('POLY');spline.points.add(len(track['points'])-1)
  for v,s in zip(spline.points,track['points']):
   p=s['point'];n=s['normal'];v.co=(*point((p[0]+side*n[0],p[1]+.13,p[2]+side*n[2])),1)
  o=bpy.data.objects.new('Steel rail',curve);bpy.context.collection.objects.link(o);o.data.materials.append(steel)
 for matrix in track['sleepers']:
  o=cube('Rail sleeper',(.13,1.03,.075),(0,0,0),concrete);o.matrix_world=world(matrix)
before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/mumbai-ac-local.glb'));imported=set(bpy.context.scene.objects)-before
cab=next(o for o in imported if o.name.startswith('AC_Driving_Cab'));coach=next(o for o in imported if o.name.startswith('AC_Local_Coach'))
def duplicate(source,parent=None):
 copy=source.copy();copy.data=source.data;bpy.context.collection.objects.link(copy);copy.parent=parent
 for child in source.children:duplicate(child,copy)
 return copy
for car in data['cars']:
 root=duplicate(cab if car['cab'] else coach);root.matrix_world=world(car['matrix'])
 if car['rear']:root.matrix_world=root.matrix_world@Matrix.Rotation(math.pi,4,'Z')
for o in imported:bpy.data.objects.remove(o,do_unlink=True)
for station in data['stations']:
 root=bpy.data.objects.new('Station '+str(station['index']+1),None);bpy.context.collection.objects.link(root);root.matrix_world=world(station['matrix']);cube('Station platform',(5,1.6,.18),(0,0,.065),concrete,root)
scene=bpy.context.scene;scene.world.use_nodes=True;nodes=scene.world.node_tree.nodes;links=scene.world.node_tree.links
env=nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(ROOT/'public/scenes/sai-world-dreams/assets/environment.hdr'));links.new(env.outputs['Color'],nodes.get('Background').inputs['Color']);nodes.get('Background').inputs['Strength'].default_value=.6
bpy.ops.object.light_add(type='AREA',location=(-70,-100,180));bpy.context.object.data.energy=160000;bpy.context.object.data.size=130
bpy.ops.object.camera_add(location=point(data['camera']['position']));camera=bpy.context.object;target=Vector((0,0,8));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=32;camera.data.lens=16/math.tan(math.radians(44)/2);scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True;scene.render.resolution_x=1680;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.render.filepath=str(ROOT/'output/blender/scan-railway-preview.png');bpy.ops.render.render(write_still=True)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/railway-landscape-preview.blend'))
