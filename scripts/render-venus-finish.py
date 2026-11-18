import bpy, math, bmesh
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[1];OUT=R/'output/venus-landscape';OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(R/'public/scenes/venus-skky-city/assets/venus-skky-city-web.glb'))
site=list(bpy.context.scene.objects);windows=[]
for o in site:
 if o.type!='MESH':continue
 role=o.name.split('.')[0].split('_')[0]
 if role=='lawn':
  bm=bmesh.new();bm.from_mesh(o.data);faces=[f for f in bm.faces if all((o.matrix_world@v.co).z<-.1 for v in f.verts)];bmesh.ops.delete(bm,geom=faces,context='FACES');bm.to_mesh(o.data);bm.free()
 for slot in o.material_slots:
  if not slot.material:continue
  m=slot.material.copy();slot.material=m;m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');n=m.node_tree.nodes;l=m.node_tree.links
  colors={'ivory':(.8,.75,.65,1),'sand':(.36,.29,.23,1),'glass':(.12,.23,.32,1),'dark':(.035,.05,.065,1),'lawn':(.16,.24,.08,1),'road':(.04,.05,.05,1)}
  if role in colors:p.inputs['Base Color'].default_value=colors[role]
  if role=='glass':p.inputs['Metallic'].default_value=.62;p.inputs['Roughness'].default_value=.2;p.inputs['Emission Color'].default_value=(1,.67,.32,1);windows.append(p)
  elif role in ['ivory','sand','lawn','path','road']:
   noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=45 if role!='lawn' else 5;noise.inputs['Detail'].default_value=3;bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.04;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],p.inputs['Normal'])
bpy.ops.import_scene.gltf(filepath=str(R/'public/scenes/venus-skky-city/assets/venus-surroundings.glb'))
for o in bpy.context.selected_objects:
 if o.type=='MESH':
  for m in o.data.materials:
   if m and 'satellite' in m.name.lower():p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=1
world=bpy.data.worlds.new('Sky lighting');world.use_nodes=True;bpy.context.scene.world=world;bg=world.node_tree.nodes['Background'];bg.inputs['Color'].default_value=(.35,.52,.75,1);bg.inputs['Strength'].default_value=.5
bpy.ops.object.light_add(type='SUN',location=(-160,-195,205));sun=bpy.context.object;sun.data.energy=2.3;sun.data.angle=math.radians(2);sun.rotation_euler=(Vector((0,25,0))-sun.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(-187.27,28.55,60.21));camera=bpy.context.object;camera.rotation_euler=(Vector((4,28,55))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=24;camera.data.lens=24/(2*math.tan(math.radians(55)/2));bpy.context.scene.camera=camera
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
try:
 pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='METAL';pref.get_devices()
 for d in pref.devices:d.use=d.type=='METAL'
 scene.cycles.device='GPU'
except:pass
scene.render.resolution_x=1200;scene.render.resolution_y=454;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'day-review.png');bpy.ops.render.render(write_still=True)
bg.inputs['Color'].default_value=(.07,.12,.24,1);bg.inputs['Strength'].default_value=.17;sun.data.energy=.24;sun.data.color=(.55,.7,1)
for p in windows:p.inputs['Emission Strength'].default_value=.65
for x,z in [(-45,24),(30,24),(-30,-56),(20,-44),(0,-2)]:
 bpy.ops.object.light_add(type='AREA',location=(x,-z,12));light=bpy.context.object;light.data.energy=1200;light.data.color=(1,.68,.34);light.data.shape='DISK';light.data.size=12
scene.render.filepath=str(OUT/'night-review.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'venus-finish-review.blend'))
