/** Bound the GPU buffer on high-DPI phones and large desktop screens. */
export function mapRenderQuality({width,height,pixelRatio=1,memory=8,cores=8}){
 const compact=memory<=4||cores<=4||width<600;
 const budget=compact?1_000_000:1_800_000;
 return {pixelRatio:Math.min(pixelRatio,compact?1.25:1.5,Math.sqrt(budget/Math.max(1,width*height))),shadowSize:1024};
}
/** Let input and scrolling run between scene setup stages. */
export async function yieldToBrowser(){
 if(globalThis.scheduler?.yield)await globalThis.scheduler.yield();
 else await new Promise(resolve=>setTimeout(resolve,0));
}
