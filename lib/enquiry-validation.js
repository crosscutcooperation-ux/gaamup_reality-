export function validateEnquiry(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Please complete the enquiry form.');
 const clean=(key,max,required=true)=>{const v=value[key];if(typeof v!=='string'||v.length>max||(required&&!v.trim())||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw Error(`Please check your ${key}.`);if(key!=='message'&&/[\r\n]/.test(v))throw Error(`Please check your ${key}.`);return v.trim();};
 const name=clean('name',100),phone=clean('phone',20),email=clean('email',150),message=clean('message',2000),project=clean('project',150,false),type=clean('type',30);
 if(name.length<2||!/^\+?[0-9 ()-]{7,20}$/.test(phone)||phone.replace(/\D/g,'').length<7||!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)||/[\r\n]/.test(email))throw Error('Please check your name, phone and email.');
 if(!['Home buyer','Developer','Other'].includes(type)||value.consent!==true)throw Error('Please agree to be contacted about your enquiry.');
 if(!/^[0-9a-f-]{36}$/i.test(value.requestId||''))throw Error('Please refresh the form and try again.');
 if(value.website)throw Error('The enquiry could not be accepted.');
 return {name,phone,email,message,project,type,requestId:value.requestId.toLowerCase(),source:typeof value.source==='string'?value.source.slice(0,200):'website'};
}
export function allowedOrigin(request,production=process.env.NODE_ENV==='production'){
 const origin=request.headers.get('origin');
 const permitted=['https://gaamupproperties.com','https://www.gaamupproperties.com'];
 if(!production)permitted.push('http://localhost:4173','http://127.0.0.1:4173','http://localhost:3000');
 return permitted.includes(origin);
}
export async function verifyTurnstile(token,{secret,hosts=['gaamupproperties.com','www.gaamupproperties.com'],fetcher=fetch}={}){
 if(!secret||typeof token!=='string'||token.length>2048||!token)return false;
 const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret,response:token}),signal:AbortSignal.timeout(8000)});
 if(!response.ok)return false;
 const result=await response.json();return result.success===true&&hosts.includes(result.hostname)&&result.action==='enquiry';
}
