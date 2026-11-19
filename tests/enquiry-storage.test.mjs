import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const directory=await mkdtemp(join(tmpdir(),'gaamup-enquiry-'));process.env.AERO_DATA_DIR=directory;process.env.AERO_ADMIN_KEY='test-only-admin';
const {enquiryStore,saveEnquiry,rateLimited,isEnquiryAdmin}=await import('../lib/enquiries-server.js');
const data={name:'Buyer Test',phone:'9876543210',email:'test@example.com',message:'Test enquiry',project:'Elements',type:'Home buyer',requestId:'00112233-4455-4677-8899-aabbccddeeff',source:'test'};
test('saved enquiries are durable, idempotent, and reject changed payloads under the same identifier',()=>{
 assert.equal(saveEnquiry(data).id,data.requestId);assert.equal(saveEnquiry(data).id,data.requestId);
 assert.equal(enquiryStore().prepare('SELECT count(*) AS count FROM enquiries').get().count,1);
 assert.throws(()=>saveEnquiry({...data,name:'Other Buyer'}));
});
test('persistent throttling isolates addresses and expires after 15 minutes',()=>{
 const now=Date.now();for(let i=0;i<5;i++)assert.equal(rateLimited('test-address',now),false);assert.equal(rateLimited('test-address',now),true);assert.equal(rateLimited('other-address',now),false);assert.equal(rateLimited('test-address',now+900001),false);
});
test('visitor requests cannot read saved contact details',()=>{
 assert.equal(isEnquiryAdmin(new Request('http://localhost')),false);assert.equal(isEnquiryAdmin(new Request('http://localhost',{headers:{Authorization:'Bearer wrong'}})),false);assert.equal(isEnquiryAdmin(new Request('http://localhost',{headers:{Authorization:'Bearer test-only-admin'}})),true);
});
test.after(async()=>{enquiryStore().close();await rm(directory,{recursive:true,force:true});});
