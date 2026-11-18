"""Inspect the exact runtime regional geometry exported for QA."""
import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'output/blender/regional-landscape-preview.glb'))
for object in bpy.context.scene.objects:
    if object.type!='MESH':continue
    if object.name not in ['Measured terrain relief','Mapped buildings — textured walls']:continue
    material=object.active_material;nodes=material.node_tree.nodes;links=material.node_tree.links;bs=nodes.get('Principled BSDF')
    image=nodes.new('ShaderNodeTexImage');image.image=bpy.data.images.load(str(root/('public/scenes/sai-world-dreams/assets/grass.jpg' if object.name=='Measured terrain relief' else 'public/assets/region/residential-facade.webp')))
    uv=nodes.new('ShaderNodeTexCoord')
    if object.name=='Measured terrain relief':
        scale=nodes.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(45,39,1);links.new(uv.outputs['UV'],scale.inputs[0]);links.new(scale.outputs['Vector'],image.inputs['Vector'])
    else:links.new(uv.outputs['UV'],image.inputs['Vector'])
    old=bs.inputs['Base Color'].links[0].from_socket if bs.inputs['Base Color'].is_linked else None
    mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1
    if old:links.new(old,mix.inputs[1])
    else:mix.inputs[1].default_value=bs.inputs['Base Color'].default_value
    links.new(image.outputs['Color'],mix.inputs[2]);links.new(mix.outputs[0],bs.inputs['Base Color'])
scene=bpy.context.scene;scene.world.use_nodes=True
nodes=scene.world.node_tree.nodes;links=scene.world.node_tree.links
hdr=nodes.new('ShaderNodeTexEnvironment');hdr.image=bpy.data.images.load(str(root/'public/scenes/sai-world-dreams/assets/environment.hdr'));links.new(hdr.outputs['Color'],nodes.get('Background').inputs['Color']);nodes.get('Background').inputs['Strength'].default_value=.35
bpy.ops.object.camera_add(location=(22,-135,140));camera=bpy.context.object;camera.rotation_euler=(Vector((10,-7,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=36;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(-80,-50,180));bpy.context.object.data.energy=380000;bpy.context.object.data.size=100
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1700;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.render.filepath=str(root/'output/blender/regional-landscape-preview.png');bpy.ops.render.render(write_still=True)
