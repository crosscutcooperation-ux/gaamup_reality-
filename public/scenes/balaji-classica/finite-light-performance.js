import * as T from './vendor/three.module.js?v=shared-runtime-12';

// Skip the physical BRDF when a local light's attenuation is exactly zero.
// Illumination is unchanged inside its distance/cone range.
export function optimizeFiniteLights(){
  const chunk=T.ShaderChunk.lights_fragment_begin;
  if(chunk.includes('finiteLightRangeCull'))return;
  T.ShaderChunk.lights_fragment_begin=chunk.replace(
    /(get(?:Point|Spot)LightInfo\( [^;]+;)([\s\S]*?RE_Direct\( directLight,[^;]+;)/g,
    '$1\n// finiteLightRangeCull\nif ( directLight.visible ) {\n$2\n}'
  );
}
