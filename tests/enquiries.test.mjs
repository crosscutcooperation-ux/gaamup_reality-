import test from 'node:test';import assert from 'node:assert/strict';
import {validateEnquiry,allowedOrigin,verifyTurnstile} from '../lib/enquiry-validation.js';
const valid={name:'Test Buyer',phone:'+91 98765 43210',email:'buyer@example.com',message:'Please tell me about Elements.',project:'Codename Elements',type:'Home buyer',consent:true,requestId:'00112233-4455-4677-8899-aabbccddeeff',website:''};
test('enquiry boundary requires valid contact details, explicit consent and bounded input',()=>{
 assert.equal(validateEnquiry(valid).project,'Codename Elements');
 for(const change of [{consent:false},{phone:'123'},{email:'a@example.com\r\nBcc: victim@example.com'},{name:'A'},{message:'x'.repeat(2001)},{website:'spam'},{requestId:'no'}])assert.throws(()=>validateEnquiry({...valid,...change}));
});
test('cross-site form posts are rejected independently of request Host',()=>{
 for(const origin of ['https://attacker.example','null',null])assert.equal(allowedOrigin(new Request('https://gaamupproperties.com/api/enquiries',{headers:origin?{Origin:origin}:{}}),true),false);
 assert.equal(allowedOrigin(new Request('https://gaamupproperties.com/api/enquiries',{headers:{Origin:'https://gaamupproperties.com'}}),true),true);
});
test('Turnstile requires successful verification for this hostname and action',async()=>{
 for(const result of [{success:false},{success:true,hostname:'attacker.example',action:'enquiry'},{success:true,hostname:'gaamupproperties.com',action:'login'}])assert.equal(await verifyTurnstile('token',{secret:'test',fetcher:async()=>Response.json(result)}),false);
 assert.equal(await verifyTurnstile('token',{secret:'test',fetcher:async()=>Response.json({success:true,hostname:'gaamupproperties.com',action:'enquiry'})}),true);
 assert.equal(await verifyTurnstile('token',{}),false);
});
