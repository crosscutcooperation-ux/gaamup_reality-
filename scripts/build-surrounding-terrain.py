"""Extend the supplied scan's edge heights into illustrative surrounding terrain.

Does not edit the source GLB. Run with Blender --background --python.
"""
import bpy, json, math
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/nature-landscape.glb'))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.context.view_layer.update()
for obj in meshes:
    obj.data.transform(obj.matrix_world)
    obj.matrix_world = Matrix.Identity(4)
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()
bpy.context.view_layer.update()
bvh = BVHTree.FromObject(bpy.context.object, bpy.context.evaluated_depsgraph_get())

# Closely spaced beneath the scan, progressively wider towards the horizon.
positive = [round(i*3.1, 4) for i in range(51)]
positive += [round(155 + (i/40)**1.55*1445, 4) for i in range(1, 41)]
axis = [-v for v in reversed(positive[1:])] + positive
cache = {}
def edge_height(x, z):
    cx, cz = max(-124, min(124, x)), max(-101, min(101, z))
    key = (round(cx, 3), round(cz, 3))
    if key not in cache:
        for step in range(45):
            factor = 1-step*.022
            hit, _, _, _ = bvh.ray_cast(Vector((cx*factor, -cz*factor, 100)), Vector((0, 0, -1)), 200)
            if hit is not None:
                cache[key] = hit.z
                break
        else:
            raise RuntimeError('No terrain height at '+str(key))
    return cache[key]

heights = []
for z in axis:
    for x in axis:
        distance = math.hypot(max(0, abs(x)-124), max(0, abs(z)-101))
        blend = min(1, distance/190)
        blend = blend*blend*(3-2*blend)
        hills = 5 + 9*math.sin(x*.006)*math.cos(z*.007) + 4*math.sin(z*.017+x*.009)
        # A small vertical separation prevents coplanar flashing under the scan.
        heights.append((edge_height(x,z)-2)*(1-blend) + hills*blend)
# Canopies at a cut edge should not propagate as abrupt walls into the extension.
size=len(axis)
for _ in range(24):
    previous=heights
    heights=previous.copy()
    for zi in range(1,size-1):
        for xi in range(1,size-1):
            i=zi*size+xi
            heights[i]=previous[i]*.4+(previous[i-1]+previous[i+1]+previous[i-size]+previous[i+size])*.15
# Smoothing canopy heights must not lift the backing terrain through the graded
# railway. Keep a margin for the 3.1m grid triangles and both station platforms.
points=json.loads((ROOT/'lib/scan-route-data.json').read_text())['points'][::5]
xmin,xmax=min(p[0] for p in points)-14,max(p[0] for p in points)+14
zmin,zmax=min(p[2] for p in points)-14,max(p[2] for p in points)+14
for zi,z in enumerate(axis):
    for xi,x in enumerate(axis):
        if not (xmin<x<xmax and zmin<z<zmax):continue
        p=min(points,key=lambda p:(p[0]-x)**2+(p[2]-z)**2)
        distance=math.hypot(p[0]-x,p[2]-z)
        if distance>=14:continue
        blend=max(0,min(1,(14-distance)/4));blend=blend*blend*(3-2*blend)
        i=zi*size+xi
        heights[i]-=max(0,heights[i]-(p[1]-.35))*blend
heights=[round(h,4) for h in heights]
target = ROOT/'public/assets/landscape/surroundings-height.json'
target.write_text(json.dumps({'axis':axis, 'heights':heights, 'note':'Illustrative hills extended from supplied scan edge heights; not surveyed geography.'}, separators=(',', ':'))+'\n')
print('SURROUNDINGS', len(axis), 'by', len(axis), 'heights', min(heights), max(heights), flush=True)

# A world-projected feather follows the actual scan silhouette, including its
# irregular edges. This changes rendering only; source geometry is retained.
from collections import deque
resolution=384
mask=[]
for zi in range(resolution):
    z=-110+zi/(resolution-1)*220
    for xi in range(resolution):
        x=-132+xi/(resolution-1)*264
        hit,_,_,_=bvh.ray_cast(Vector((x,-z,100)),Vector((0,0,-1)),200)
        mask.append(hit is not None)
distance=[0 if not valid else 9999 for valid in mask]
queue=deque(i for i,valid in enumerate(mask) if not valid)
while queue:
    i=queue.popleft();zi,xi=divmod(i,resolution)
    for j in ([i-1] if xi else [])+([i+1] if xi<resolution-1 else [])+([i-resolution] if zi else [])+([i+resolution] if zi<resolution-1 else []):
        if distance[j]>distance[i]+1:
            distance[j]=distance[i]+1;queue.append(j)
rail_opacity=[0.0]*len(mask)
points=json.loads((ROOT/'lib/scan-route-data.json').read_text())['points']
for x,_,z in points[::5]:
    cx=(x+132)/264*(resolution-1);cz=(z+110)/220*(resolution-1)
    for zi in range(max(0,int(cz-17)),min(resolution,int(cz+18))):
        for xi in range(max(0,int(cx-14)),min(resolution,int(cx+15))):
            d=math.hypot((xi-cx)*264/(resolution-1),(zi-cz)*220/(resolution-1))
            value=max(0,min(1,(6-d)/3.2))
            i=zi*resolution+xi;rail_opacity[i]=max(rail_opacity[i],value)
image=bpy.data.images.new('Scan silhouette feather',width=resolution,height=resolution,alpha=False)
pixels=[]
for i,d in enumerate(distance):
    zi,xi=divmod(i,resolution)
    x=-132+xi/(resolution-1)*264;z=-110+zi/(resolution-1)*220
    # A broad feather conceals the abrupt photographed front-left path and
    # matches the user-marked scan cut to the surrounding woodland relief.
    corner=((x+102)/39)**2+((z-83)/32)**2
    corner_blend=max(0,min(1,(corner-.25)/1.4))
    edge=min(1,d/24);edge=edge*edge*(3-2*edge)
    value=max(min(edge,corner_blend),rail_opacity[i])
    pixels.extend((value,value,value,1))
image.pixels.foreach_set(pixels)
image.filepath_raw=str(ROOT/'public/assets/landscape/scan-edge-mask.png');image.file_format='PNG';image.save()
print('EDGE MASK',resolution,flush=True)
