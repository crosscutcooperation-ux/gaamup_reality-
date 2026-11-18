"""Prepare the user-downloaded scan without changing its source file."""
import bpy,json,math,sys,hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parent.parent
source=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path('/Users/robin/Downloads/photogrammetry__3d_scan_nature_landscape.glb')
out=ROOT/'output/blender';out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(source))
bpy.context.view_layer.update()
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
objects=[(o,o.matrix_world.copy()) for o in meshes]
corners=[world@Vector(p) for o,world in objects for p in o.bound_box]
lower=Vector([min(p[i] for p in corners) for i in range(3)]);upper=Vector([max(p[i] for p in corners) for i in range(3)])
center=(lower+upper)/2;scale=260/max(upper.x-lower.x,upper.y-lower.y)
normalise=Matrix.Scale(scale,4)@Matrix.Translation(Vector((-center.x,-center.y,-lower.z)))
for o,world in objects:
    o.parent=None;o.matrix_world=Matrix.Identity(4);o.data.transform(normalise@world);o.data.update()
bpy.context.view_layer.update()
for o in list(bpy.context.scene.objects):
    if o.type=='EMPTY':bpy.data.objects.remove(o,do_unlink=True)
corners=[o.matrix_world@Vector(p) for o in meshes for p in o.bound_box]
lo=Vector([min(p[i] for p in corners) for i in range(3)]);hi=Vector([max(p[i] for p in corners) for i in range(3)])
# Some imported chunks carry conservative bounding boxes. Frame the real vertices.
positions=[]
for o in meshes:
    values=np.empty(len(o.data.vertices)*3,dtype=np.float32);o.data.vertices.foreach_get('co',values);positions.append(values.reshape(-1,3))
actual=np.concatenate(positions);lo=Vector(actual.min(axis=0));hi=Vector(actual.max(axis=0));c=(lo+hi)/2
correction_scale=260/max(hi.x-lo.x,hi.y-lo.y)
correction=Matrix.Scale(correction_scale,4)@Matrix.Translation(Vector((-c.x,-c.y,-lo.z)))
for o in meshes:o.data.transform(correction);o.data.update()
bpy.context.view_layer.update()
lo=(lo-Vector((c.x,c.y,lo.z)))*correction_scale;hi=(hi-Vector((c.x,c.y,actual[:,2].min())))*correction_scale
scale*=correction_scale
metadata={'source':str(source),'originalSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'originalBytes':source.stat().st_size,'scale':scale,'boundsBlender':{'min':list(lo),'max':list(hi)},'boundsYUp':{'min':[lo.x,lo.z,-hi.y],'max':[hi.x,hi.z,-lo.y]},'meshCount':len(meshes),'triangleCount':sum(len(o.data.loop_triangles) for o in meshes)}
(out/'scan-inspection.json').write_text(json.dumps(metadata,indent=2));print('SCAN_BOUNDS',metadata,flush=True)
scene=bpy.context.scene;scene.world.use_nodes=True;nodes=scene.world.node_tree.nodes;links=scene.world.node_tree.links
env=nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(ROOT/'public/scenes/sai-world-dreams/assets/environment.hdr'));links.new(env.outputs['Color'],nodes.get('Background').inputs['Color']);nodes.get('Background').inputs['Strength'].default_value=.65
bpy.ops.object.light_add(type='AREA',location=(-90,-100,180));bpy.context.object.data.energy=150000;bpy.context.object.data.size=130
bpy.ops.object.camera_add(location=(0,0,300));camera=bpy.context.object;camera.rotation_euler=(0,0,0);camera.data.type='ORTHO';camera.data.ortho_scale=280;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=True;scene.render.resolution_x=1400;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.render.filepath=str(out/'scan-top-inspection.png');bpy.ops.render.render(write_still=True)
camera.location=(100,-180,175);camera.rotation_euler=(Vector((0,0,10))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=280
scene.render.filepath=str(out/'scan-oblique-inspection.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/nature-landscape.blend'))
