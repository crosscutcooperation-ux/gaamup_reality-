import {allowedOrigin} from '../../../lib/enquiry-validation.js';
import {validateChat,CHAT_MAX_BODY} from '../../../lib/chat.js';
import {chatProjects,chatRateLimited,generateChatReply} from '../../../lib/chat-server.js';
import {getProjects} from '../../../lib/projects.js';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export async function POST(request){
 if(!allowedOrigin(request))return reply({error:'Please open the chat on our website.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON required.'},415);
 try{
  if(!request.body)return reply({error:'Please enter a message.'},400);
  const parts=[];let size=0;
  for await(const chunk of request.body){size+=chunk.byteLength;if(size>CHAT_MAX_BODY)return reply({error:'That conversation is too long. Start a new chat.'},413);parts.push(chunk);}
  let messages;try{messages=validateChat(JSON.parse(Buffer.concat(parts).toString()));}catch{return reply({error:'Please send a shorter message or start a new chat.'},400);}
  if(!process.env.GEMINI_API_KEY)return reply({error:'AI replies are temporarily unavailable. You can still browse projects or send an enquiry.'},503);
  if(chatRateLimited(request.headers.get('x-real-ip')||'local'))return reply({error:'Please wait a minute before sending another message.'},429,{'Retry-After':'60'});
  const {projects}=await getProjects();
  return reply(await generateChatReply(messages,chatProjects(projects),{signal:request.signal}));
 }catch(error){
  console.error(JSON.stringify({event:'chat_reply_failed',status:typeof error.status==='number'?error.status:0}));
  return reply({error:'I couldn’t reply just now. Please retry, or use Projects and Enquire below.'},error.status===429?429:503,error.status===429?{'Retry-After':'60'}:{});
 }
}
