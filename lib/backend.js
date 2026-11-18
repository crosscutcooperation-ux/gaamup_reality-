export async function getLiveCatalog(){
  const origin=process.env.AERO_BACKEND_URL||`http://127.0.0.1:${process.env.AERO_BACKEND_PORT||4000}`;
  const response=await fetch(`${origin}/api/catalog`,{cache:'no-store',signal:AbortSignal.timeout(4000)});
  if(!response.ok)throw new Error('The Rust property service is unavailable.');
  return response.json();
}
export function propertyImage(image){return image?.startsWith('/')?image:`/assets/${image}`;}
