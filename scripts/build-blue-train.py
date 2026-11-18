"""Headless Blender source for the old blue Indian passenger train.
Run: Blender --background --python scripts/build-blue-train.py
"""
import bpy, math, os, random, sys
import numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/models'; OUT.mkdir(exist_ok=True,parents=True)
SOURCE=ROOT/'models'; SOURCE.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(70)
# Texture images are embedded in the GLB, not remote or unexportable procedural nodes.
def paint_image(name,color):
    w,h=1024,512;rng=np.random.default_rng(708)
    y=np.linspace(0,1,h)[:,None];x=np.linspace(0,1,w)[None,:]
    grain=rng.normal(0,.012,(h,w));streak=np.sin(x*340)*.008+np.sin(x*122)*.012
    dust=np.exp(-y*8)*.14;variation=grain+streak-dust
    pixels=np.ones((h,w,4),dtype=np.float32)
    for c in range(3):pixels[:,:,c]=np.clip(color[c]+variation+np.exp(-y*12)*[.07,.038,.005][c],0,1)
    image=bpy.data.images.new(name,width=w,height=h);image.pixels.foreach_set(pixels.ravel());image.pack();return image
blue_texture=bpy.data.images.load(str(ROOT/'models/textures/oxford-blue-enamel-v2.png'));blue_texture.name='Photographic weathered Oxford blue enamel';blue_texture.pack()
# Derive a matching pale-blue band while preserving photographic chips and streaks.
w,h=blue_texture.size
source=np.array(blue_texture.pixels[:],dtype=np.float32).reshape(h,w,4)
light=source.copy();luma=source[:,:,:3].mean(axis=2)
for c,target in enumerate([.43,.60,.70]):light[:,:,c]=np.clip(target+(luma-luma.mean())*.85,0,1)
light_texture=bpy.data.images.new('Photographic faded pale blue enamel',width=w,height=h);light_texture.pixels.foreach_set(light.ravel());light_texture.pack()
roof_texture=paint_image('Weathered galvanized roof',(.34,.36,.35))
# Exportable PBR maps: microscopic enamel, chips and variable surface sheen.
rng=np.random.default_rng(913)
height=luma*.07+rng.normal(0,.0015,(h,w))
dy,dx=np.gradient(height);norm=np.dstack((-dx*2,-dy*2,np.ones_like(height)));norm/=np.linalg.norm(norm,axis=2,keepdims=True)
rgba=np.ones((h,w,4),dtype=np.float32);rgba[:,:,:3]=norm*.5+.5
normal=bpy.data.images.new('Enamel micro normal',width=w,height=h);normal.colorspace_settings.name='Non-Color';normal.pixels.foreach_set(rgba.ravel());normal.pack()
rough=np.ones((h,w,4),dtype=np.float32);rough[:,:,:3]=np.clip(.48+(luma-luma.mean())[:,:,None]*.7+rng.normal(0,.022,(h,w,1)),.34,.77)
roughness=bpy.data.images.new('Enamel varying roughness',width=w,height=h);roughness.colorspace_settings.name='Non-Color';roughness.pixels.foreach_set(rough.ravel());roughness.pack()
def mat(name,color,metal=.2,rough=.55,image=None):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
    if image:
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;m.node_tree.links.new(node.outputs['Color'],bs.inputs['Base Color'])
    if image:
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=roughness;m.node_tree.links.new(node.outputs['Color'],bs.inputs['Roughness'])
        tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=normal
        n=m.node_tree.nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.22
        m.node_tree.links.new(tex.outputs['Color'],n.inputs['Color']);m.node_tree.links.new(n.outputs['Normal'],bs.inputs['Normal'])
    return m
BLUE=mat('Blue painted steel',(.055,.18,.34),.12,.54,blue_texture)
LIGHT=mat('Pale blue band',(.36,.55,.68),.10,.51,light_texture)
ROOF=mat('Weathered roof',(.42,.44,.43),.6,.61,roof_texture)
DARK=mat('Oily iron and rubber',(.035,.042,.043),.42,.7)
STEEL=mat('Worn exposed steel',(.38,.42,.43),.8,.4)
GLASS=mat('Dark window glass',(.025,.065,.085),.45,.12)
CREAM=mat('Aged cream lettering',(.88,.83,.57),.05,.65)
RED=mat('Tail lamp red',(.55,.03,.018),.15,.5)
LAMP=mat('Headlamp glass',(.92,.85,.65),.15,.2)
parents=[]
def empty(name,pos=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=pos;o.parent=parent;return o

def box(name,size,pos,material,parent,bevel=.008):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0));o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.parent=parent;o.location=pos;o.data.materials.append(material)
    if bevel:
        mod=o.modifiers.new('Soft rolled edges','BEVEL');mod.width=bevel;mod.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    return o

def rod(name,a,b,r,material,parent,vertices=10):
    delta=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=delta.length)
    o=bpy.context.object;o.name=name;o.parent=parent;o.location=(Vector(a)+Vector(b))/2;o.rotation_mode='QUATERNION';o.rotation_quaternion=delta.to_track_quat('Z','Y');o.data.materials.append(material)
    for p in o.data.polygons:p.use_smooth=True
    return o

def plane(name,a,b,low,high,side,material,parent,depth=.438):
    verts=[(a,side*depth,low),(b,side*depth,low),(b,side*depth,high),(a,side*depth,high)]
    faces=[(0,1,2,3)] if side<0 else [(3,2,1,0)]
    m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();m.uv_layers.new(name='Paint UV')
    for polygon in m.polygons:
        for loop in polygon.loop_indices:
            v=m.vertices[m.loops[loop].vertex_index].co;m.uv_layers.active.data[loop].uv=((v.x-a)/max(b-a,.001),(v.z-low)/max(high-low,.001))
    o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(material);return o

def text(name,body,pos,size,side,parent):
    curve=bpy.data.curves.new(name,'FONT');curve.body=body;curve.size=size;curve.align_x='CENTER';curve.extrude=.0005
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.parent=parent;o.location=pos
    o.rotation_euler=(math.pi/2,0,0) if side<0 else (math.pi/2,0,math.pi)
    o.data.materials.append(CREAM);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)

def roof(length,parent):
    v=[];faces=[];steps=32
    for i in range(steps+1):
        angle=i/steps*math.pi;y=math.cos(angle)*.438;z=1.49+math.sin(angle)*.17;v.extend([(-length/2,y,z),(length/2,y,z)])
    for i in range(steps):a=2*i;faces.append((a,a+1,a+3,a+2))
    m=bpy.data.meshes.new('Curved roof');m.from_pydata(v,[],faces);m.update();m.uv_layers.new(name='Roof UV')
    for polygon in m.polygons:
        polygon.use_smooth=True
        for loop in polygon.loop_indices:
            vertex=m.vertices[m.loops[loop].vertex_index].co;m.uv_layers.active.data[loop].uv=(vertex.x/length+.5,(vertex.y/.876+.5))
    o=bpy.data.objects.new('Curved_Roof',m);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(ROOF)
    # End plates close the roof without an overlapping body shell.
    for sign in [-1,1]:
        vertices=[(sign*length/2,-.438,.43),(sign*length/2,.438,.43)]
        for i in range(steps+1):angle=i/steps*math.pi;vertices.append((sign*length/2,math.cos(angle)*.438,1.49+math.sin(angle)*.17))
        mesh=bpy.data.meshes.new('Coach end');mesh.from_pydata(vertices,[],[tuple(range(len(vertices)))][::sign]);mesh.update();ob=bpy.data.objects.new('End_Plate',mesh);bpy.context.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(BLUE)

def rolling_gear(length,parent):
    for side,x in [('Rear',-length*.32),('Front',length*.32)]:
        bogie=empty('Bogie_'+side,(x,0,0),parent)
        box('Bogie_Frame',(.87,.46,.13),(0,0,.31),DARK,bogie)
        for ax in [-.25,.25]:
            rod('Axle',(ax,-.34,.302),(ax,.34,.302),.025,STEEL,bogie)
            for sign in [-1,1]:
                wheel=rod('Wheel_'+side+('_L' if sign<0 else '_R')+str(ax),(ax,sign*.3-.0375,.302),(ax,sign*.3+.0375,.302),.14,DARK,bogie,32)
                # The wheel pivot remains at its axle center for runtime rotation.
                rod('Wheel_Flange',(ax,sign*.275-.012,.302),(ax,sign*.275+.012,.302),.148,STEEL,bogie,24)
                box('Axle_Box',(.11,.11,.1),(ax,sign*.365,.302),DARK,bogie,.018)
        for y in [-.25,.25]:
            for x in [-.13,.13]:
                points=[]
                for i in range(65):a=i/64*math.pi*9;points.append((x+math.cos(a)*.035,y+math.sin(a)*.035,.33+i/64*.09))
                for a,b in zip(points,points[1:]):rod('Spring',a,b,.005,STEEL,bogie,6)
        for y in [-.3,.3]:rod('Brake_Rigging',(-.36,y,.22),(.36,y,.22),.014,DARK,bogie)
    box('Underframe',(length-.2,.61,.12),(0,0,.36),DARK,parent)
    for x in [-.8,.8]:box('Battery_Box',(.54,.52,.14),(x,0,.255),DARK,parent)
    for sign in [-1,1]:box('Coupler',(.26,.14,.1),(sign*(length/2+.13),0,.45),DARK,parent)

def make_coach():
    length=5.8;root=empty('ICF_Coach',(0,3,0));parents.append(root);roof(length,root)
    for side in [-1,1]:
        # Two narrow end doors, with pale-blue window band between them.
        door_bounds=[(-2.59,-2.05),(2.05,2.59)]
        for a,b in [(-2.9,-2.59),(-2.05,2.05),(2.59,2.9)]:
            plane('Lower_Blue_Body',a,b,.43,.79,side,BLUE,root)
            plane('Upper_Blue_Body',a,b,1.30,1.49,side,BLUE,root)
            count=max(1,round((b-a)/.48))
            for i in range(count):
                x=a+(b-a)*i/count;end=a+(b-a)*(i+1)/count;left=x+.055;right=end-.055
                plane('Window_Pillar',x,left,.79,1.3,side,LIGHT,root);plane('Window_Pillar',right,end,.79,1.3,side,LIGHT,root)
                plane('Window_Sill',left,right,.79,.9,side,LIGHT,root);plane('Window_Header',left,right,1.24,1.3,side,LIGHT,root)
                plane('Recessed_Window',left,right,.9,1.24,side,GLASS,root,depth=.43)
                # The narrow steel frame also fills the shallow window reveal.
                for low,high in [(.896,.911),(1.229,1.244)]:box('Window_Gasket',(right-left,.018,high-low),((left+right)/2,side*.436,(low+high)/2),DARK,root,.002)
                for xx in [left,right]:box('Window_Gasket',(.014,.018,.34),(xx,side*.436,1.07),DARK,root,.002)
                for z in [.96,1.015,1.07,1.125,1.18]:rod('Safety_Bar',(left,side*.45,z),(right,side*.45,z),.006,STEEL,root)
            for z in [.48,.53]:rod('Body_Beading',(a,side*.441,z),(b,side*.441,z),.005,BLUE,root)
        for a,b in door_bounds:
            plane('Door',a,b,.43,1.49,side,BLUE,root)
            box('Door_Window',(.23,.024,.3),((a+b)/2,side*.455,1.11),GLASS,root,.02)
            for x in [a+.03,b-.03]:rod('Grab_Rail',(x,side*.477,.66),(x,side*.477,1.22),.009,CREAM,root)
            for z in [.28,.36,.42]:box('Door_Step',(b-a,.13,.025),((a+b)/2,side*.47,z),DARK,root,.005)
        # Hinges, latch plates, rivets and rain gutters catch real light at close range.
        for a,b in door_bounds:
            for z in [.61,.94,1.37]:box('Door_Hinge',(.035,.022,.065),(a+.055,side*.46,z),STEEL,root,.004)
            box('Door_Latch_Plate',(.05,.02,.09),(b-.1,side*.46,.94),STEEL,root,.004)
            rod('Door_Latch',(b-.1,side*.48,.94),(b-.17,side*.48,.94),.009,STEEL,root)
        rod('Rain_Gutter',(-length/2,side*.448,1.475),(length/2,side*.448,1.475),.012,ROOF,root)
        for x in np.linspace(-2.83,2.83,42):
            for z in [.46,1.45]:rod('Body_Rivet',(float(x),side*.44,z),(float(x),side*.446,z),.0055,STEEL,root,8)
        for end in [-1,1]:
            box('Gangway_Bellows',(.055,.56,.78),(end*(length/2+.025),0,.91),DARK,root,.025)
        text('Railway_Lettering','INDIAN RAILWAYS',(0,side*.449,1.365),.085,side,root)
        text('Coach_Class','SLEEPER',(-1.4,side*.449,1.365),.06,side,root)
        text('Coach_Number','09736',(1.45,side*.449,1.365),.06,side,root)
    box('Floor',(length,.85,.035),(0,0,.43),DARK,root)
    for x in [-2,-1,0,1,2]:
        box('Roof_Vent',(.24,.42,.075),(x,0,1.686),ROOF,root,.025)
        for j in range(5):box('Vent_Slat',(.015,.31,.009),(x-.08+j*.04,0,1.728),DARK,root,.001)
    rolling_gear(length,root)
    return root

def make_engine():
    length=4.7;root=empty('Blue_Locomotive');parents.append(root)
    box('Locomotive_Body',(length,.87,1.08),(0,0,.99),BLUE,root,.055)
    box('Locomotive_Roof',(length-.1,.84,.13),(0,0,1.56),ROOF,root,.06)
    for side in [-1,1]:
        box('Pale_Blue_Loco_Band',(length-.04,.012,.2),(0,side*.439,.88),LIGHT,root,.003)
        for x in [-1.65,1.65]:box('Cab_Side_Window',(.55,.026,.3),(x,side*.449,1.29),GLASS,root,.035)
        for x in np.linspace(-.95,.95,20):box('Engine_Louvre',(.028,.018,.4),(float(x),side*.449,1.24),DARK,root,.003)
        text('Engine_Number','22736',(0,side*.463,.94),.08,side,root)
        for x in [-2.05,2.05]:rod('Cab_Grab_Rail',(x,side*.48,.58),(x,side*.48,1.17),.009,CREAM,root)
    for end in [-1,1]:
        for y in [-.21,.21]:
            box('Front_Windscreen',(.025,.32,.28),(end*(length/2+.006),y,1.29),GLASS,root,.025)
            rod('Wiper',(end*(length/2+.026),y-.08,1.2),(end*(length/2+.026),y+.04,1.39),.008,DARK,root)
            rod('Headlight',(end*(length/2+.01),y,.82),(end*(length/2+.045),y,.82),.052,LAMP,root,24)
        box('Front_Blue_Band',(.02,.8,.15),(end*(length/2+.007),0,.95),LIGHT,root,.005)
        box('Buffer_Beam',(.14,.83,.12),(end*(length/2+.04),0,.57),DARK,root,.01)
    for x in [-.9,.9]:
        for y in [-.18,.18]:rod('Insulator',(x,y,1.61),(x,y,1.76),.045,RED,root)
        for y in [-.12,.12]:
            rod('Pantograph_Arm',(x-.35,y,1.76),(x,y,1.99),.012,DARK,root)
            rod('Pantograph_Arm',(x+.35,y,1.76),(x,y,1.99),.012,DARK,root)
            rod('Pantograph_Arm',(x,y,1.99),(x-.3,y,2.16),.011,STEEL,root)
            rod('Pantograph_Arm',(x,y,1.99),(x+.3,y,2.16),.011,STEEL,root)
        box('Pantograph_Contact',(.68,.4,.025),(x,0,2.17),DARK,root,.003)
    rolling_gear(length,root);return root
engine=make_engine();coach=make_coach()
# Correct the overly tall toy-like body, retaining rail/wheel contact and pivots.
for root in parents:
    for ob in root.children_recursive:
        if ob.type!='MESH' or ob.parent.name.startswith('Bogie_'):continue
        matrix=ob.matrix_world.copy();inverse=matrix.inverted()
        for vertex in ob.data.vertices:
            world=matrix@vertex.co
            if world.z>.43:world.z=.43+(world.z-.43)*.78
            vertex.co=inverse@world

# Join static geometry by material while leaving wheel pivots and bogie groups editable.
def batch(parent):
    groups={}
    for ob in list(parent.children):
        if ob.type=='EMPTY':batch(ob)
        elif ob.type=='MESH' and not ob.name.startswith('Wheel_'):
            key=ob.active_material.name if ob.active_material else 'none';groups.setdefault(key,[]).append(ob)
    for key,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for ob in objects:ob.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='Details_'+key.replace(' ','_')
for p in parents:batch(p)
# Pack original textures into the editable Blender source and export self-contained GLB.
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'indian-blue-train.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'indian-blue-train.glb'),export_format='GLB',export_yup=True,export_apply=True,export_extras=False,export_texcoords=True,export_normals=True,export_materials='EXPORT')
if '--skip-preview' in sys.argv:
    print('BLUE_TRAIN_READY',OUT/'indian-blue-train.glb')
    sys.exit(0)
# A real Blender render for checking shape, paint and geometry without browser automation.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.use_nodes=True
world_nodes=scene.world.node_tree.nodes;world_links=scene.world.node_tree.links
hdr=world_nodes.new('ShaderNodeTexEnvironment');hdr.image=bpy.data.images.load(str(ROOT/'public/scenes/sai-world-dreams/assets/environment.hdr'));hdr.image.pack()
world_links.new(hdr.outputs['Color'],world_nodes.get('Background').inputs['Color']);world_nodes.get('Background').inputs['Strength'].default_value=.45
bpy.ops.object.camera_add(location=(8,-11,4.3));camera=bpy.context.object;camera.rotation_euler=(Vector((0,1.5,1))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=11;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(1,-4,8));bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=8
bpy.ops.object.light_add(type='AREA',location=(-4,4,6));bpy.context.object.data.energy=1000;bpy.context.object.data.size=6
box('Preview_Ground',(200,200,.04),(0,0,.13),mat('Preview ground',(.2,.22,.2),0,.95),None,.0)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'indian-blue-train.blend'))
scene.render.filepath=str(ROOT/'output/blender/blue-train-preview.png');bpy.ops.render.render(write_still=True)
print('BLUE_TRAIN_READY',OUT/'indian-blue-train.glb')
