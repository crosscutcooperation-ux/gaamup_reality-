"""Mumbai AC local EMU: silver/sky-blue body, sealed glazing and sliding doors."""
import bpy,math,sys
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/models';OUT.mkdir(exist_ok=True,parents=True)
SOURCE=ROOT/'models';SOURCE.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Reuse the existing wheel-contact geometry and primitive helpers.
helpers=(ROOT/'scripts/build-blue-train.py').read_text()
exec(helpers[helpers.index('def empty('):helpers.index('def make_coach(')])
# Use the existing photographic enamel source for real wear patterns, converted
# to stainless/aluminium and the AC local's blue livery rather than flat paint.
photo=bpy.data.images.load(str(ROOT/'models/textures/oxford-blue-enamel-v2.png'))
photo.scale(2048,1024);w,h=photo.size
pixels=np.array(photo.pixels[:],dtype=np.float32).reshape(h,w,4)
luma=pixels[:,:,:3].mean(axis=2);wear=luma-luma.mean()
x=np.linspace(0,1,w)[None,:];y=np.linspace(0,1,h)[:,None]
rng=np.random.default_rng(2017)
brushing=rng.normal(0,.011,(h,1))+np.sin(y*6000)*.008
runoff=(np.sin(x*151)+np.sin(x*347))*.006*np.exp(-y*3)
# Fine seams, rain runs and brake dust are mapped continuously along each car.
panel=np.exp(-((np.mod(x*9,1)-.03)/.007)**2)*.018
dust=np.exp(-y*11)*(.055+.025*np.sin(x*51)**2)
def texture(name,base,strength):
    rgba=np.ones((h,w,4),dtype=np.float32)
    for c in range(3):rgba[:,:,c]=np.clip(base[c]+wear*strength+brushing+runoff-panel-dust*[1,.92,.7][c],0,1)
    image=bpy.data.images.new(name,width=w,height=h);image.pixels.foreach_set(rgba.ravel());image.pack();return image
silver=texture('Photographic brushed stainless with panel wear',(.59,.63,.65),.85)
blue=texture('Photographic AC sky blue enamel and sill weathering',(.075,.34,.53),.85)
roofmap=texture('Photographic aluminium roof service wear',(.43,.46,.47),.95)
rough=np.ones((h,w,4),dtype=np.float32)
rough[:,:,:3]=np.clip(.35+np.abs(wear[:,:,None])*1.8+dust[:,:,None]*2+rng.normal(0,.012,(h,w,1)),.26,.8)
roughness=bpy.data.images.new('Photographic stainless roughness',width=w,height=h);roughness.colorspace_settings.name='Non-Color';roughness.pixels.foreach_set(rough.ravel());roughness.pack()
height=wear*.09+brushing*.15;dy,dx=np.gradient(height)
norm=np.dstack((-dx*4,-dy*4,np.ones_like(height)));norm/=np.linalg.norm(norm,axis=2,keepdims=True)
normalpixels=np.ones((h,w,4),dtype=np.float32);normalpixels[:,:,:3]=norm*.5+.5
normal=bpy.data.images.new('Photographic surface micro normal',width=w,height=h);normal.colorspace_settings.name='Non-Color';normal.pixels.foreach_set(normalpixels.ravel());normal.pack()
bpy.data.images.remove(photo)
def material(name,color,metal=.0,rough=.5,image=None):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
    if image:
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;m.node_tree.links.new(node.outputs['Color'],bs.inputs['Base Color'])
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=roughness;m.node_tree.links.new(node.outputs['Color'],bs.inputs['Roughness'])
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=normal;n=m.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.5;m.node_tree.links.new(node.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],bs.inputs['Normal'])
    return m
SILVER=material('Brushed stainless silver',(.67,.70,.71),.68,.4,silver)
BLUE=material('Mumbai AC local sky blue',(.12,.43,.64),.20,.4,blue)
ROOF=material('Roof aluminium',(.48,.52,.53),.6,.5,roofmap)
DARK=material('Graphite rubber and underframe',(.025,.032,.037),.25,.64)
STEEL=material('Polished wheel steel',(.35,.4,.43),.85,.3)
GLASS=material('Sealed smoked panoramic glass',(.018,.047,.062),.65,.14)
# Embedded subtle glazing residue breaks uniform black window panes at close range.
glassrough=np.ones((h,w,4),dtype=np.float32);glassrough[:,:,:3]=np.clip(.10+np.abs(wear[:,:,None])*.6+np.sin(x*65)[:,:,None]**8*.035,.08,.3)
glassmap=bpy.data.images.new('Glazing watermarks roughness',width=w,height=h);glassmap.colorspace_settings.name='Non-Color';glassmap.pixels.foreach_set(glassrough.ravel());glassmap.pack()
node=GLASS.node_tree.nodes.new('ShaderNodeTexImage');node.image=glassmap;GLASS.node_tree.links.new(node.outputs['Color'],GLASS.node_tree.nodes.get('Principled BSDF').inputs['Roughness'])
CREAM=material('Local train lettering',(.89,.94,.95),.08,.5)
PURPLE=material('AC local purple waist accent',(.22,.13,.34),.12,.5)
LED=material('Amber destination display',(.95,.42,.015),0,.5)
bs=LED.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.23,.003,1);bs.inputs['Emission Strength'].default_value=1.6
LAMP=material('White LED lamp',(.9,.94,1),.1,.2)
bs=LAMP.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(.75,.85,1,1);bs.inputs['Emission Strength'].default_value=.5
parents=[]
def make_car(cab=False):
    length=5.8;root=empty('AC_Driving_Cab' if cab else 'AC_Local_Coach',(0,0 if cab else 2,0));parents.append(root)
    # A fully closed metal skin avoids gaps during the close trackside pass.
    body=box('AC_Stainless_Body',(length,.876,.83),(0,0,.845),SILVER,root,.038)
    box('AC_Dark_Underframe',(length-.08,.82,.095),(0,0,.435),DARK,root,.012)
    box('AC_Curved_Roof',(length-.035,.875,.16),(0,0,1.285),ROOF,root,.075)
    # Three paired, flush sliding-door openings per side, as on the AC local.
    doorcenters=[-1.9,0,1.9] if not cab else [-1.9,-.15,1.65]
    for side in [-1,1]:
        for z in [.49,.54,.59,.64,.69]:rod('AC_Lower_Panel_Press_Line',(-2.8,side*.444,z),(2.8,side*.444,z),.0035,BLUE,root,6)
        plane('AC_Blue_Lower_Livery',-length/2+.04,length/2-.04,.45,.75,side,BLUE,root,depth=.441)
        plane('AC_Purple_Pinstripe',-length/2+.04,length/2-.04,.744,.761,side,PURPLE,root,depth=.443)
        for center in doorcenters:
            box('AC_Flush_Door_Reveal',(.56,.02,.75),(center,side*.447,.855),DARK,root,.013)
            for sign in [-1,1]:
                x=center+sign*.135
                box('AC_Paired_Sliding_Door',(.261,.02,.727),(x,side*.458,.855),SILVER,root,.009)
                box('AC_Door_Tinted_Glass',(.14,.018,.31),(x,side*.473,.995),GLASS,root,.02)
                box('AC_Door_Blue_Panel',(.252,.006,.19),(x,side*.471,.605),BLUE,root,.003)
            box('AC_Door_Threshold',(.58,.09,.023),(center,side*.467,.452),STEEL,root,.005)
            for sign in [-1,1]:box('AC_Door_Warning_Stripe',(.012,.006,.58),(center+sign*.254,side*.475,.82),CREAM,root,.002)
        segments=[(-2.83,-2.23),(-1.57,-.33),(.33,1.57),(2.23,2.83)] if not cab else [(-2.82,-2.23),(-1.57,-.48),(.18,1.32),(2.0,2.42)]
        for a,b in segments:
            width=b-a;count=2 if width>.8 else 1
            for n in range(count):
                cell=width/count;x=a+(n+.5)*cell
                box('AC_Black_Window_Gasket',(cell-.06,.022,.355),(x,side*.448,1.015),DARK,root,.026)
                box('AC_Sealed_Tinted_Window',(cell-.09,.014,.326),(x,side*.464,1.015),GLASS,root,.026)
        rod('AC_Rain_Gutter',(-2.85,side*.447,1.24),(2.85,side*.447,1.24),.008,ROOF,root)
        text('AC_Railway_Name','MUMBAI AC LOCAL',(.80,side*.446,.79),.045,side,root)
        text('AC_Car_Number','7058' if cab else '7059',(-1.04,side*.446,.59),.055,side,root)
        text('AC_Air_Conditioned','AIR CONDITIONED',(.86,side*.447,1.205),.038,side,root)
    # Two rooftop HVAC packages, grilles, conduits and roof service seams.
    for x in [-1.25,1.25]:
        box('AC_HVAC_Unit',(1.0,.63,.125),(x,0,1.40),ROOF,root,.035)
        for n in range(12):box('AC_HVAC_Vent',(.018,.45,.009),(x-.40+n*.073,0,1.466),DARK,root,.002)
    for y in [-.19,.19]:rod('AC_Roof_Conduit',(-2.6,y,1.37),(2.6,y,1.37),.012,ROOF,root)
    rolling_gear(length,root)
    if cab:
        # Rounded blue driving end and broad two-part windscreen, rather than a locomotive hood.
        box('AC_Rounded_Cab_Fascia',(.17,.895,.83),(2.87,0,.845),BLUE,root,.07)
        box('AC_Cab_Glazing_Mask',(.014,.77,.38),(2.966,0,1.037),DARK,root,.04)
        for y in [-.194,.194]:
            box('AC_Front_Windscreen',(.018,.35,.285),(2.98,y,1.048),GLASS,root,.026)
            rod('AC_Windscreen_Wiper',(2.995,y-.10,.975),(2.995,y+.075,1.14),.006,DARK,root)
        box('AC_Destination_Display',(.019,.58,.087),(2.991,0,1.28),DARK,root,.009)
        # LED dots remain real geometry and stay legible during the approach.
        for y in np.linspace(-.23,.23,28):
            for z in [1.26,1.28,1.30]:box('AC_LED_Dots',(.006,.007,.008),(3.003,float(y),z),LED,root,.001)
        for y in [-.315,.315]:
            box('AC_LED_Headlight',(.028,.09,.056),(2.974,y,.745),LAMP,root,.018)
            box('AC_Marker_Light',(.022,.055,.025),(2.968,y,1.245),LAMP,root,.009)
        box('AC_Centre_Coupler',(.24,.16,.09),(3.04,0,.45),DARK,root,.02)
        # Slim pantograph on the driving motor car, with a transverse contact strip.
        for y in [-.13,.13]:
            rod('AC_Pantograph',(-.45,y,1.40),(-.10,y,1.69),.009,DARK,root)
            rod('AC_Pantograph',(.25,y,1.40),(-.10,y,1.69),.009,DARK,root)
            rod('AC_Pantograph',(-.10,y,1.69),(.20,y,1.9),.009,STEEL,root)
        box('AC_Pantograph_Contact',(.11,.52,.022),(.20,0,1.91),DARK,root,.004)
    # Panel fasteners, recessed service panels, door handles and rubber gangway.
    for side in [-1,1]:
        for x in np.linspace(-2.75,2.75,31):
            for z in [.48,1.22]:box('AC_Recessed_Rivet',(.008,.006,.008),(float(x),side*.445,z),STEEL,root,.002)
        for center in doorcenters:
            for sign in [-1,1]:rod('AC_Door_Grip',(center+sign*.045,side*.484,.78),(center+sign*.045,side*.484,.87),.005,STEEL,root)
        for x in [-2.45,-.9,.9,2.5]:
            box('AC_Sill_Service_Hatch',(.32,.008,.12),(x,side*.447,.525),BLUE,root,.008)
    for end in [-1,1]:
        if cab and end==1:continue
        for n in range(7):box('AC_Rubber_Gangway_Folds',(.025,.61,.68),(end*(2.90+n*.012),0,.87),DARK,root,.014)
    # Shared world-scale UVs keep metal grain and dust continuous across doors.
    for object in root.children:
        if object.type!='MESH' or not object.active_material or not object.active_material.use_nodes:continue
        if not any(n.type=='TEX_IMAGE' for n in object.active_material.node_tree.nodes):continue
        uv=object.data.uv_layers.active or object.data.uv_layers.new(name='Continuous body UV')
        for polygon in object.data.polygons:
            for loop in polygon.loop_indices:
                v=object.data.vertices[object.data.loops[loop].vertex_index].co+object.location
                uv.data[loop].uv=((v.x+2.9)/5.8,(v.z-.43)/1.08)
    return root
cab=make_car(True);coach=make_car(False)
def batch(parent):
    groups={}
    for ob in list(parent.children):
        if ob.type=='EMPTY':batch(ob)
        elif ob.type=='MESH' and not ob.name.startswith('Wheel_'):groups.setdefault(ob.active_material.name,[]).append(ob)
    for key,objects in groups.items():
        if len(objects)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for ob in objects:ob.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='AC_Details_'+key.replace(' ','_')
for root in parents:batch(root)
bpy.ops.export_scene.gltf(filepath=str(OUT/'mumbai-ac-local.glb'),export_format='GLB',export_yup=True,export_apply=True,export_texcoords=True,export_normals=True,export_materials='EXPORT')
# Keep a packed, editable source with daylight and a camera as well as web geometry.
scene=bpy.context.scene;scene.world.use_nodes=True
nodes=scene.world.node_tree.nodes;links=scene.world.node_tree.links
hdr=nodes.new('ShaderNodeTexEnvironment');hdr.image=bpy.data.images.load(str(ROOT/'public/scenes/sai-world-dreams/assets/environment.hdr'));hdr.image.pack();links.new(hdr.outputs['Color'],nodes.get('Background').inputs['Color']);nodes.get('Background').inputs['Strength'].default_value=.5
bpy.ops.object.camera_add(location=(8,-10,4));camera=bpy.context.object;camera.rotation_euler=(Vector((0,1,.9))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=10;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(0,-4,7));bpy.context.object.data.energy=1200;bpy.context.object.data.size=7
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'mumbai-ac-local.blend'))
if '--skip-preview' not in sys.argv:
    box('Preview_Ground',(200,200,.04),(0,0,.13),material('Preview floor',(.24,.26,.25),0,.9),None,0)
    scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=True;scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
    scene.render.filepath=str(ROOT/'output/blender/mumbai-ac-local-preview.png');bpy.ops.render.render(write_still=True)
print('MUMBAI_AC_LOCAL_READY',OUT/'mumbai-ac-local.glb')
