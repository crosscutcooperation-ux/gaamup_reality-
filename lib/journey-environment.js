import * as T from 'three';
import {LANDSCAPE_ASSETS} from './landscape-assets.js';
import {Sky} from 'three/addons/objects/Sky.js';

export const JOURNEY_SCENERY={
  ground:LANDSCAPE_ASSETS.ground,
  clouds:LANDSCAPE_ASSETS.clouds,
  relief:LANDSCAPE_ASSETS.relief,
};

export function createSurroundingGeometry({axis,heights}){
  const n=axis.length,positions=[],uv=[],indices=[];
  if(n<2||heights.length!==n*n)throw new Error('Invalid surrounding terrain heights.');
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
    positions.push(axis[x],heights[z*n+x],axis[z]);
    uv.push(axis[x]/460+.5,axis[z]/(460/3)+.5);
  }
  for(let z=0;z<n-1;z++)for(let x=0;x<n-1;x++){
    const a=z*n+x,b=a+n;indices.push(a,b,a+1,a+1,b,b+1);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

/** World-space scenery: it stays with the train landscape during camera travel. */
export function createJourneyEnvironment({groundTexture,cloudTexture,relief}){
  const group=new T.Group();group.name='Woodland surroundings, daylight sky and drifting clouds';
  groundTexture.colorSpace=T.SRGBColorSpace;
  groundTexture.wrapS=groundTexture.wrapT=T.MirroredRepeatWrapping;
  const ground=new T.Mesh(createSurroundingGeometry(relief),new T.MeshStandardMaterial({map:groundTexture,color:0xc4c9b4,roughness:1,envMapIntensity:.2}));
  ground.name='Generated woodland on continuous surrounding terrain';ground.receiveShadow=true;group.add(ground);
  const sky=new Sky();sky.name='Daylight atmospheric sky';sky.scale.setScalar(12000);
  const uniforms=sky.material.uniforms;
  uniforms.turbidity.value=3;uniforms.rayleigh.value=1.8;uniforms.mieCoefficient.value=.003;uniforms.mieDirectionalG.value=.78;
  uniforms.sunPosition.value.set(-.4,.7,.3);sky.material.fog=false;group.add(sky);
  cloudTexture.colorSpace=T.SRGBColorSpace;
  const clouds=[];
  // Layered cloud banks remain in world space as the viewpoint descends.
  const placements=[[-115,74,-20,76],[-8,84,-104,68],[110,68,30,82],[-75,110,110,100],[105,122,-145,110],[-230,68,-235,150],[220,82,-230,165],[-270,95,145,190],[275,100,150,175],[20,135,-310,210],[-155,100,190,140],[165,97,170,125],[-125,135,-190,155],[135,145,-240,170],[-350,120,-90,210],[350,130,-70,230],[-300,130,270,220],[310,145,290,235]];
  for(let i=0;i<placements.length;i++){
    const [x,y,z,width]=placements[i];
    const material=new T.SpriteMaterial({map:cloudTexture,transparent:true,opacity:i<5?.48:.76,rotation:Math.sin(i*2.7)*.045,depthWrite:false,fog:false,toneMapped:false});
    const cloud=new T.Sprite(material);cloud.name='Drifting photographic cumulus';cloud.position.set(x,y,z);cloud.scale.set(width,width/3,1);
    cloud.visible=false;cloud.userData={origin:cloud.position.clone(),opacity:material.opacity,phase:i*1.7};
    group.add(cloud);clouds.push(cloud);
  }
  // The camera travels through these soft layers, rather than fading them away
  // before contact. No layer follows the camera or obscures the train-side hold.
  const flightClouds=[.39,.45,.52,.59].map((progress,index)=>{
    const material=new T.SpriteMaterial({map:cloudTexture,transparent:true,opacity:.58-index*.05,rotation:index%2?.07:-.04,depthWrite:false,fog:false,toneMapped:false});
    const cloud=new T.Sprite(material);cloud.name='Camera-crossing cumulus layer';const width=70-index*10;cloud.scale.set(width,width/3,1);cloud.visible=false;
    cloud.userData={origin:new T.Vector3(),opacity:material.opacity,phase:index,progress,flight:true};group.add(cloud);clouds.push(cloud);return cloud;
  });
  return {group,clouds,ground,sky,flightClouds,
    beginFlight(flight){for(const cloud of clouds)cloud.visible=true;for(const cloud of flightClouds){cloud.userData.origin.copy(flight.sample(cloud.userData.progress*(flight.approachFraction??1)).position);cloud.position.copy(cloud.userData.origin);cloud.visible=true;}},
    resetFlight(){for(const cloud of clouds)cloud.visible=false;},
    update(time,camera,{reduced=false}={}){
      for(const cloud of clouds){
        const {origin,phase,opacity,flight}=cloud.userData;
        cloud.position.x=origin.x+(reduced||flight?0:Math.sin(time*.018+phase)*15);
        cloud.position.z=origin.z+(reduced||flight?0:Math.sin(time*.012+phase)*9);
        const distance=cloud.position.distanceTo(camera.position);
        cloud.material.opacity=opacity*T.MathUtils.smoothstep(distance,flight?.35:3,flight?1.8:18);
      }
    },
  };
}
