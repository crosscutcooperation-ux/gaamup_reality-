import bpy,json
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parent.parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/models/nature-landscape.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];bpy.context.view_layer.update()
for o in meshes:o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4);o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();bpy.context.view_layer.update()
bvh=BVHTree.FromObject(bpy.context.object,bpy.context.evaluated_depsgraph_get())
checks=json.loads((ROOT/'output/blender/scan-ground-checks.json').read_text());errors=[];misses=0;failures=[]
for check in checks:
 x,y,z=check['point'];hit,normal,index,distance=bvh.ray_cast(Vector((x,-z,100)),Vector((0,0,-1)),200)
 if hit is None:misses+=1;failures.append({'point':check['point'],'miss':True});continue
 errors.append(hit.z-(y-.04))
 if abs(errors[-1])>.01:failures.append({'point':check['point'],'error':errors[-1]})
result={'checks':len(checks),'misses':misses,'maximumGroundError':max(map(abs,errors)),'minimumGroundError':min(errors),'maximumSignedGroundError':max(errors),'tolerance':.04,'passed':misses==0 and max(map(abs,errors))<.04,'scope':'Raycasts against the actual exported GLB under both rails of both tracks.'}
(ROOT/'public/assets/landscape/grounding-validation.json').write_text(json.dumps(result,indent=2)+'\n');print('GROUNDING',result,flush=True);print('FAILURES',failures[:30],flush=True)
if not result['passed']:raise RuntimeError('The exported scan does not support the track bed.')
