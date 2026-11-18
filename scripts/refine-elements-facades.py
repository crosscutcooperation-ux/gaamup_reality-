"""Import the supplied Elements GLB, refine surface finishes, and export a web GLB."""
import struct
import sys
import tempfile
import zlib
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

SOURCE, OUTPUT = (Path(arg).resolve() for arg in sys.argv[sys.argv.index('--') + 1:])
OUTPUT.mkdir(parents=True, exist_ok=True)
SIZE = 512
rng = np.random.default_rng(703)
y, x = np.indices((SIZE, SIZE), dtype=np.float32) / SIZE


def noise(cells):
    """Make seamless, smoothly interpolated variation at the requested scale."""
    grid = rng.normal(0, 1, (cells, cells))
    u, v = x * cells, y * cells
    i, j = u.astype(int), v.astype(int)
    a, b = u - i, v - j
    a, b = a * a * (3 - 2 * a), b * b * (3 - 2 * b)
    return ((1 - a) * (1 - b) * grid[j, i] + a * (1 - b) * grid[j, (i + 1) % cells]
            + (1 - a) * b * grid[(j + 1) % cells, i] + a * b * grid[(j + 1) % cells, (i + 1) % cells])


def seam(coordinate, width):
    distance = np.abs((coordinate + .5) % 1 - .5)
    return np.exp(-np.square(distance / width))


def png(path, pixels):
    pixels = np.rint(np.clip(pixels, 0, 1) * 255).astype(np.uint8)
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    height, width, _ = pixels.shape
    rows = b''.join(b'\0' + row.tobytes() for row in pixels)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
                     + chunk(b'IDAT', zlib.compress(rows, 7)) + chunk(b'IEND', b''))


def color(rgb, detail):
    return np.asarray(rgb)[None, None, :] * (1 + detail[:, :, None])


aggregate = noise(12)*.012 + noise(47)*.019 + noise(106)*.022
clouding = noise(3)*.025 + noise(7)*.030
runoff = np.sin(2 * np.pi * (17*x + .13*noise(5))) * noise(4)*.012
joint = np.maximum(seam(y, .008), seam(2*x, .012) * .8)
base = clouding + aggregate + runoff

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source_objects = tuple(bpy.context.scene.objects)

with tempfile.TemporaryDirectory() as directory:
    scratch = Path(directory)

    def set_albedo(labels, filename, pixels):
        path = scratch / filename
        png(path, pixels)
        image = bpy.data.images.load(str(path))
        image.pack()
        for label in labels:
            material = bpy.data.materials[label]
            tree = material.node_tree
            shader = tree.nodes.get('Principled BSDF')
            texture = tree.nodes.new('ShaderNodeTexImage')
            texture.name = filename.removesuffix('.png')
            texture.image = image
            texture.location = (-500, 300)
            tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
            shader.inputs['Base Color'].default_value = (1, 1, 1, 1)

    set_albedo(['stone-ivory', 'Raised cream facade lines', 'Perforated rooftop lattice'],
               'Warm precast stone.png', color((.86, .82, .75), base - joint*.095))
    set_albedo(['Masonry front', 'Solid centre spine and terrace return'],
               'Slate facade coating.png', color((.23, .28, .34), base*1.5 - joint*.13))
    set_albedo(['Warm grey render'], 'Mineral facade render.png',
               color((.70, .68, .64), base - joint*.074))
    set_albedo(['Glazing front'], 'Tinted window glass.png',
               color((.40, .49, .54), noise(5)*.11 + noise(13)*.046))
    set_albedo(['Deck'], 'Roof deck boards.png',
               color((.48, .38, .28), noise(5)*.10 + runoff*1.8 - seam(x*15, .065)*.26))

glass = bpy.data.materials['Glazing front'].node_tree.nodes.get('Principled BSDF')
# The dense facade uses a reflective opaque glazing finish for stable real-time orbiting.
glass.inputs['Transmission Weight'].default_value = 0
glass.inputs['Metallic'].default_value = .34
glass.inputs['Roughness'].default_value = .24
glass.inputs['Coat Weight'].default_value = .24
glass.inputs['Coat Roughness'].default_value = .20

grout = np.maximum(seam(y*4, .075), seam(x*3 + np.floor(y*4)*.5, .065))
blocks = noise(9)*.072 + noise(25)*.025 + aggregate
png(OUTPUT / 'elements-podium-pavers.png', color((.67,.63,.56), blocks - grout*.27))
height = blocks*.003 - grout*.017
dx = (np.roll(height, 1, axis=1) - np.roll(height, -1, axis=1)) * 20
dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 20
normal = np.stack((dx, dy, np.ones_like(dx)), axis=-1)
normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
png(OUTPUT / 'elements-podium-normal.png', .5 + .5 * normal)

# Keep the source tower roots, names, geometry, and UVs intact for selection.
bpy.ops.object.select_all(action='DESELECT')
for obj in source_objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT / 'elements-towers-refined.glb'), export_format='GLB',
    use_selection=True, export_extras=True, export_tangents=True,
    export_image_format='AUTO', export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6, export_draco_position_quantization=16,
    export_draco_normal_quantization=12, export_draco_texcoord_quantization=14,
)

# Arrange the editable scene for review. The exported roots remain tower-local.
bpy.data.objects['T1'].location = (20, -25, 0)
bpy.data.objects['T1'].rotation_euler.z = -np.pi / 2
bpy.data.objects['T2'].location = (-9, 30, 0)
scene = bpy.context.scene
world = bpy.data.worlds.new('Overcast blue skylight')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.38,.51,.68,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .55
scene.world = world
sun = bpy.data.lights.new('Warm directional daylight', 'SUN')
sun.angle = .1
sun.energy = 2.4
sun.color = (1,.93,.84)
sun_obj = bpy.data.objects.new(sun.name, sun)
scene.collection.objects.link(sun_obj)
sun_obj.rotation_euler = Vector((.50,.65,-.65)).to_track_quat('-Z','Y').to_euler()
camera = bpy.data.cameras.new('Facade review')
camera.lens = 40
camera_obj = bpy.data.objects.new(camera.name, camera)
scene.collection.objects.link(camera_obj)
scene.camera = camera_obj
camera_obj.location = (-100,-160,60)
camera_obj.rotation_euler = (Vector((0,0,42))-camera_obj.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine = 'CYCLES'
scene.cycles.samples = 10
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 800
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / 'elements-towers-refined.blend'))
scene.render.filepath = str(OUTPUT / 'elements-facade-review.png')
bpy.ops.render.render(write_still=True)
camera.lens = 58
camera_obj.location = (-58, -12, 51)
camera_obj.rotation_euler = (Vector((19,-24,47))-camera_obj.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath = str(OUTPUT / 'elements-detail-review.png')
bpy.ops.render.render(write_still=True)
