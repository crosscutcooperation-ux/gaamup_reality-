'use client';
import {useEffect,useId,useRef,useState} from 'react';
let challengeScript;
function loadChallenge(){
 if(window.turnstile)return Promise.resolve(window.turnstile);
 return challengeScript ||= new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>resolve(window.turnstile);script.onerror=()=>{challengeScript=null;reject(Error('Verification could not load. Please retry.'));};document.head.append(script);});
}
export default function EnquiryForm({project='',source='contact'}){
 const prefix=useId(),challenge=useRef(null),widget=useRef(null),form=useRef(null),requestId=useRef('');
 const [config,setConfig]=useState(null),[token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{requestId.current=crypto.randomUUID();const abort=new AbortController();fetch('/api/enquiries/config',{signal:abort.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setConfig).catch(()=>{if(!abort.signal.aborted)setError('The form could not connect. Please retry or call us.');});return()=>abort.abort();},[revision]);
 useEffect(()=>{if(!config?.siteKey||success)return;let stopped=false;loadChallenge().then(api=>{if(stopped)return;widget.current=api.render(challenge.current,{sitekey:config.siteKey,action:'enquiry',theme:'light',size:'flexible',callback:setToken,'expired-callback':()=>setToken(''),'error-callback':()=>{setToken('');setError('Verification could not load. Please retry.');}});}).catch(e=>setError(e.message));return()=>{stopped=true;if(widget.current!=null)window.turnstile?.remove(widget.current);widget.current=null;};},[config,revision,success]);
 async function submit(event){
  event.preventDefault();setBusy(true);setError('');const values=Object.fromEntries(new FormData(form.current));
  try{
   const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,consent:values.consent==='on',requestId:requestId.current,turnstileToken:token,source}),signal:AbortSignal.timeout(30000)});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Please try again.');
   setSuccess(data.message);form.current.reset();requestId.current=crypto.randomUUID();
  }catch(error){setError(error.name==='TimeoutError'?'The connection timed out. Retry to check this enquiry; it will not be saved twice.':error.message);}
  finally{setBusy(false);setToken('');if(widget.current!=null)window.turnstile?.reset(widget.current);}
 }
 if(success)return <div className="enquiry-success" role="status"><span className="eyebrow">THANK YOU</span><h3>A conversation starts here.</h3><p>{success}</p><button type="button" className="solid-button" onClick={()=>setSuccess('')}>Send another enquiry</button></div>;
 const field=(name,label,type='text',extra={})=><div className="enquiry-field"><label htmlFor={`${prefix}-${name}`}>{label}</label><input id={`${prefix}-${name}`} name={name} type={type} required {...extra}/></div>;
 return <form className="enquiry-form" ref={form} onSubmit={submit}>
  <label className="enquiry-field">I am a<select name="type" defaultValue="Home buyer"><option>Home buyer</option><option>Developer</option><option>Other</option></select></label>
  <label className="enquiry-field">Project<select name="project" defaultValue={project}><option value="">Help me choose</option><option>Sai World Dreams</option><option>Venus Skky City</option><option>Codename Elements</option></select></label>
  {field('name','Full name','text',{autoComplete:'name',minLength:2,maxLength:100})}
  {field('phone','Phone','tel',{autoComplete:'tel',pattern:'[+0-9 ()-]{7,20}',maxLength:20,placeholder:'+91'})}
  <div className="enquiry-wide">{field('email','Email','email',{autoComplete:'email',maxLength:150})}</div>
  <label className="enquiry-field enquiry-wide">Tell us about your plans<textarea name="message" required rows="3" maxLength={2000} defaultValue={project?`I would like to know more about ${project}.`:''}/></label>
  <div className="enquiry-trap" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
  <label className="enquiry-consent enquiry-wide"><input type="checkbox" name="consent" required/><span>I agree to be contacted by Gaamup Reality about this enquiry. My details are saved securely for follow-up.</span></label>
  {!config&&!error&&<p className="enquiry-wide enquiry-verification" role="status"><span className="loading-spinner" aria-hidden="true"/>Preparing the secure form…</p>}
  <div ref={challenge} className="enquiry-wide"/>
  {config?.siteKey&&!token&&!error&&<p className="enquiry-wide enquiry-verification">Complete the verification above to send your enquiry.</p>}
  <div className="enquiry-wide enquiry-submit"><button className="solid-button" disabled={busy||!config||Boolean(config.siteKey&&!token)}>{busy&&<span className="loading-spinner" aria-hidden="true"/>}{busy?'Sending…':'Send enquiry ↗'}</button><span>Or call <a href="tel:+918655481884">+91 86554 81884</a></span></div>
  {error&&<p className="enquiry-wide enquiry-error" role="alert">{error} <button type="button" onClick={()=>{setError('');setRevision(n=>n+1);}}>Retry connection</button></p>}
 </form>;
}
