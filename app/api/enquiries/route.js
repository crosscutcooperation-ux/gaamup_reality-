import {allowedOrigin,validateEnquiry,verifyTurnstile} from '../../../lib/enquiry-validation.js';
import {enquiryStore,isEnquiryAdmin,rateLimited,saveEnquiry,deliverEnquiry} from '../../../lib/enquiries-server.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function GET(request){
 if(!isEnquiryAdmin(request))return reply({error:'Authentication required.'},401);
 const enquiries=enquiryStore().prepare('SELECT id,name,phone,email,message,project,audience,source,created_at,delivery,attempts FROM enquiries ORDER BY created_at DESC LIMIT 200').all();
 return reply({enquiries});
}
export async function POST(request){
 if(!allowedOrigin(request))return reply({error:'Please submit this form from our website.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required.'},415);
 try{
  if(rateLimited(request.headers.get('x-real-ip')||'local'))return new Response(JSON.stringify({error:'Please wait 15 minutes before sending another enquiry.'}),{status:429,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Retry-After':'900'}});
  if(!request.body)return reply({error:'Please complete the form.'},400);
  let size=0;const parts=[];for await(const chunk of request.body){size+=chunk.byteLength;if(size>12000)return reply({error:'Your message is too long.'},413);parts.push(chunk);}
  let raw;try{raw=JSON.parse(Buffer.concat(parts).toString());}catch{return reply({error:'Please check your form.'},400);}
  let data;try{data=validateEnquiry(raw);}catch(error){return reply({error:error.message},400);}
  if(process.env.TURNSTILE_SECRET_KEY&&!await verifyTurnstile(raw.turnstileToken,{secret:process.env.TURNSTILE_SECRET_KEY}))return reply({error:'Verification expired. Please try again.'},422);
  const saved=saveEnquiry(data);if(saved.delivery!=='sent')await deliverEnquiry(saved.id);
  return reply({reference:saved.id,message:'Your enquiry has been saved. Our team will contact you shortly.'},201);
 }catch{console.error(JSON.stringify({event:'enquiry_request_failed'}));return reply({error:'We could not save your enquiry. Please try again, or call +91 86554 81884.'},503);}
}
