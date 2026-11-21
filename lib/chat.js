export const CHAT_GREETING='Hi! What are you looking for today — a new home, information about a project, or help with the website?';
export const CHAT_MAX_MESSAGE=1500;
export const CHAT_MAX_BODY=32768;

export function validateChat(value){
 if(!value||!Array.isArray(value.messages)||!value.messages.length||value.messages.length>23)throw Error('Please send a shorter conversation.');
 let total=0;
 const messages=value.messages.map((message,index)=>{
  const role=index%2?'assistant':'user';
  if(!message||message.role!==role||typeof message.content!=='string'||!message.content.trim()||message.content.length>(role==='user'?CHAT_MAX_MESSAGE:5000)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(message.content))throw Error('Please check your message.');
  total+=message.content.length;return {role,content:message.content.trim()};
 });
 if(messages.at(-1).role!=='user'||total>18000)throw Error('Please send a shorter conversation.');
 return messages;
}

export function chatRequestMessages(history,text){
 const messages=[...history.slice(-22).map(({role,content})=>({role,content})),{role:'user',content:text.trim()}];
 while(messages.length>1&&(JSON.stringify({messages}).length>13000||new TextEncoder().encode(JSON.stringify({messages})).byteLength>28000))messages.splice(0,2);
 return messages;
}
