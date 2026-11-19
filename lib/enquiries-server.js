import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import nodemailer from 'nodemailer';
let db,transport;
export function enquiryStore(){
 if(db)return db;
 const directory=process.env.AERO_DATA_DIR||join(process.cwd(),'.data');mkdirSync(directory,{recursive:true,mode:0o700});
 const path=join(directory,'enquiries.sqlite3');db=new DatabaseSync(path);chmodSync(path,0o600);
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;
 CREATE TABLE IF NOT EXISTS enquiries (id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, project TEXT NOT NULL, audience TEXT NOT NULL, source TEXT NOT NULL, created_at INTEGER NOT NULL, delivery TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, retry_at INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS enquiry_limits (ip TEXT NOT NULL, at INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS enquiry_limits_at ON enquiry_limits(at);
 CREATE INDEX IF NOT EXISTS enquiries_delivery ON enquiries(delivery,retry_at);`);
 return db;
}
export function isEnquiryAdmin(request){
 let key=process.env.AERO_ADMIN_KEY;
 try{key ||= readFileSync(join(process.env.AERO_DATA_DIR||'.data','admin-key.txt'),'utf8').trim();}catch{}
 const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!key||!supplied)return false;
 const digest=s=>createHash('sha256').update(s).digest();return timingSafeEqual(digest(key),digest(supplied));
}
export function rateLimited(ip,now=Date.now()){
 const store=enquiryStore();
 const hash=createHmac('sha256',process.env.ENQUIRY_IP_SALT||'local-development-only').update(ip).digest('hex');
 store.exec('BEGIN IMMEDIATE');try{
 store.prepare('DELETE FROM enquiry_limits WHERE at < ?').run(now-3600000);
 const count=store.prepare('SELECT count(*) AS total FROM enquiry_limits WHERE ip = ? AND at > ?').get(hash,now-900000).total;
 const total=store.prepare('SELECT count(*) AS total FROM enquiry_limits').get().total;
 if(count>=5||total>=150){store.exec('COMMIT');return true;}
 store.prepare('INSERT INTO enquiry_limits(ip,at) VALUES(?,?)').run(hash,now);store.exec('COMMIT');return false;
 }catch(error){store.exec('ROLLBACK');throw error;}
}
export function saveEnquiry(data){
 const store=enquiryStore(),fingerprint=createHash('sha256').update(JSON.stringify(data)).digest('hex');
 const existing=store.prepare('SELECT id,fingerprint,delivery FROM enquiries WHERE id=?').get(data.requestId);
 if(existing){if(existing.fingerprint!==fingerprint)throw Error('This form was already submitted. Please start a new enquiry.');return existing;}
 store.prepare('INSERT INTO enquiries(id,fingerprint,name,phone,email,message,project,audience,source,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(data.requestId,fingerprint,data.name,data.phone,data.email,data.message,data.project,data.type,data.source,Date.now());
 return {id:data.requestId,delivery:'pending'};
}
export async function deliverEnquiry(id){
 const store=enquiryStore(),now=Date.now();
 const claim=store.prepare("UPDATE enquiries SET delivery='sending',attempts=attempts+1,retry_at=? WHERE id=? AND delivery IN ('pending','retry','sending') AND retry_at<=? AND attempts<5").run(now+300000,id,now);
 if(!claim.changes)return;
 const row=store.prepare('SELECT * FROM enquiries WHERE id=?').get(id);
 try{
  if(!process.env.SMTP_PASSWORD)throw Error('Mail configuration pending');
  transport ||= nodemailer.createTransport({host:process.env.SMTP_HOST||'smtp.gmail.com',port:465,secure:true,pool:true,maxConnections:2,connectionTimeout:8000,greetingTimeout:8000,socketTimeout:12000,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});
  await transport.sendMail({from:{name:'Gaamup Reality enquiries',address:process.env.SMTP_USER},to:process.env.ENQUIRY_RECIPIENT,replyTo:row.email,subject:`Website enquiry${row.project?' · '+row.project:''}`,messageId:`<gaamup-${row.id}@panvibes.com>`,text:`New website enquiry\n\nName: ${row.name}\nPhone: ${row.phone}\nEmail: ${row.email}\nInterested in: ${row.project||'Help choosing a project'}\nI am a: ${row.audience}\n\n${row.message}\n\nReference: ${row.id}\nSubmitted: ${new Date(row.created_at).toISOString()}\nContact consent: accepted\nSource: ${row.source}`});
  store.prepare("UPDATE enquiries SET delivery='sent',retry_at=0 WHERE id=?").run(id);
 }catch{
  store.prepare("UPDATE enquiries SET delivery=?,retry_at=? WHERE id=?").run(row.attempts>=5?'failed':'retry',now+Math.min(3600000,60000*2**row.attempts),id);
  console.error(JSON.stringify({event:'enquiry_delivery_deferred',reference:id}));
 }
}
export async function retryEnquiries(){
 const store=enquiryStore();
 // Contact details have a bounded retention; throttling identifiers expire hourly.
 store.prepare('DELETE FROM enquiries WHERE created_at < ?').run(Date.now()-180*86400000);
 for(const row of store.prepare("SELECT id FROM enquiries WHERE delivery IN ('pending','retry','sending') AND retry_at<=? AND attempts<5 LIMIT 10").all(Date.now()))await deliverEnquiry(row.id);
}
