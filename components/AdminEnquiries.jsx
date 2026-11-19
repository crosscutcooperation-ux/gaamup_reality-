'use client';
import {useState} from 'react';
export default function AdminEnquiries({request}){
 const [items,setItems]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){setBusy(true);setError('');try{const data=await request('/api/enquiries');setItems(data.enquiries);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="admin-enquiries"><h2>Website enquiries.</h2><p>Saved submissions and email delivery status. Contact details are retained for 180 days.</p><button className="solid-button" disabled={busy} onClick={load}>{busy?'Loading…':items?'Refresh enquiries':'View enquiries'}</button>{error&&<p role="alert">{error}</p>}{items?.length===0&&<p>No enquiries yet.</p>}{items?.map(item=><article key={item.id}><div><h3>{item.name}</h3><small>{new Date(item.created_at).toLocaleString()} · Email: {item.delivery}</small></div><p>{item.project||'Help choosing a project'} · {item.audience}</p><p><a href={`tel:${item.phone}`}>{item.phone}</a> · <a href={`mailto:${item.email}`}>{item.email}</a></p><p className="enquiry-message">{item.message}</p></article>)}</section>;
}
