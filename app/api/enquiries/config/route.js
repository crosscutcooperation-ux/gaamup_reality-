export const dynamic='force-dynamic';
export function GET(){return Response.json({siteKey:process.env.TURNSTILE_SITE_KEY||''},{headers:{'Cache-Control':'no-store'}});}
