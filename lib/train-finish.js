import * as THREE from 'three';

/** Subtle painted-metal grain and bilingual signage, generated locally. */
export function createTrainFinish(){
  const size=256,data=new Uint8Array(size*size*4);let seed=9081;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const offset=(y*size+x)*4,value=Math.round(158+random()*22+Math.sin(y*.8)*5);
    data[offset]=data[offset+1]=data[offset+2]=value;data[offset+3]=255;
  }
  const grain=new THREE.DataTexture(data,size,size);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;
  grain.magFilter=THREE.LinearFilter;grain.minFilter=THREE.LinearMipmapLinearFilter;grain.generateMipmaps=true;grain.needsUpdate=true;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
  const context=canvas.getContext('2d');context.fillStyle='#f1e8d3';context.fillRect(0,0,1024,128);
  context.fillStyle='#633044';context.textAlign='center';context.textBaseline='middle';
  context.font='500 40px Arial, sans-serif';context.fillText('भारतीय रेल  /  INDIAN RAILWAYS',512,42);
  context.font='26px Arial, sans-serif';context.fillText('मुंबई उपनगरीय  •  MUMBAI SUBURBAN',512,94);
  const nameplate=new THREE.CanvasTexture(canvas);nameplate.colorSpace=THREE.SRGBColorSpace;nameplate.anisotropy=4;
  return {grain,nameplate};
}

/** Soft outdoor reflections give steel and glass a natural sky/ground response. */
export function createOutdoorReflections(renderer){
  const sky=new THREE.Scene();
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(10,32,16),new THREE.ShaderMaterial({
    side:THREE.BackSide,
    vertexShader:'varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`varying vec3 direction;
      void main(){vec3 d=normalize(direction);
        vec3 color=mix(vec3(.16,.19,.13),vec3(.72,.76,.75),smoothstep(-.4,.12,d.y));
        color=mix(color,vec3(.36,.53,.69),smoothstep(.1,1.,d.y));
        color+=vec3(3.,2.7,2.2)*pow(max(dot(d,normalize(vec3(-35.,65.,30.))),0.),400.);
        gl_FragColor=vec4(color,1.);
      }`,
  }));
  sky.add(sphere);const generator=new THREE.PMREMGenerator(renderer);
  const environment=generator.fromScene(sky,.04);generator.dispose();sphere.geometry.dispose();sphere.material.dispose();
  return environment;
}
