"""Headless inspection of an imported complete apartment; no source edits."""
import bpy,sys,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
path=root/'public/scenes/sai-world-dreams/assets/apartments/castle/typical/01.glb'
bpy.ops.import_scene.gltf(filepath=str(path))
points=[obj.matrix_world@Vector(corner) for obj in bpy.context.scene.objects if obj.type=='MESH' for corner in obj.bound_box]
lower=Vector(tuple(min(p[i] for p in points) for i in range(3)));upper=Vector(tuple(max(p[i] for p in points) for i in range(3)))
center=(lower+upper)/2;span=max(upper-lower)
scene=bpy.context.scene;scene.world.use_nodes=True
environment=scene.world.node_tree.nodes.new('ShaderNodeTexEnvironment');environment.image=bpy.data.images.load(str(root/'public/scenes/sai-world-dreams/assets/environment.hdr'))
scene.world.node_tree.links.new(environment.outputs['Color'],scene.world.node_tree.nodes.get('Background').inputs['Color']);scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.28
bpy.ops.object.camera_add(location=center+Vector((.22,-1.5,2.1))*span)
camera=bpy.context.object;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=span*1.5;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=center+Vector((-1,-1,2))*span);bpy.context.object.data.energy=span*span*9;bpy.context.object.data.size=span*.8
bpy.ops.mesh.primitive_plane_add(size=span*200,location=(center.x,center.y,lower.z-.03));ground=bpy.context.object
material=bpy.data.materials.new('Preview background');material.diffuse_color=(.77,.79,.74,1);ground.data.materials.append(material)
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1400;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.1
scene.render.filepath=str(root/'output/blender/complete-apartment-preview.png');bpy.ops.render.render(write_still=True)
