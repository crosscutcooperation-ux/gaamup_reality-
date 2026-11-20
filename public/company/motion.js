/** Word entrances preserve the original text nodes so cleanup restores React's DOM. */
export function observeCompanyMotion(root,Observer=IntersectionObserver,schedule=globalThis.requestAnimationFrame||((cb)=>cb())){
 let active=true;
 const selectors='.phero .crumb,.phero h1,.phero .lead,.sec h2,.sec h3,.sec p,.contact-list>div,.enquiry-panel,.panel,.portrait,.director-photo,.founder-principles,.office-band .wrap>*,.cta__act';
 const targets=[...root.querySelectorAll(selectors)],restorations=[],counts=new Map();
 for(const block of targets.filter(el=>el.matches('h1,h2,h3,p'))){
  const walker=root.ownerDocument.createTreeWalker(block,4),nodes=[];while(walker.nextNode())if(walker.currentNode.data.trim())nodes.push(walker.currentNode);
  for(const original of nodes){
   const group=root.ownerDocument.createElement('span');group.className='company-word-group';
   for(const token of original.data.match(/\s+|\S+/g)||[]){
    if(!token.trim()){group.append(token);continue;}
    const mask=root.ownerDocument.createElement('span'),word=root.ownerDocument.createElement('span');mask.className='company-word-mask';word.className='company-word';word.textContent=token;
    const index=counts.get(block)||0;word.style.setProperty('--word-delay',`${Math.min(index*38,320)}ms`);counts.set(block,index+1);mask.append(word);group.append(mask);
   }
   original.replaceWith(group);restorations.push([group,original]);
  }
 }
 const observer=new Observer(entries=>{for(const entry of entries){entry.target.style.setProperty('--company-exit-y',entry.boundingClientRect.top<0?'-20px':'20px');entry.target.classList.toggle('company-in-view',entry.isIntersecting&&entry.intersectionRatio>=.05);}},{threshold:[0,.05],rootMargin:'0px 0px -2% 0px'});
 targets.forEach((target,index)=>{target.classList.add('company-reveal');target.style.setProperty('--company-delay',`${Math.min(index%3*50,100)}ms`);});
 root.classList.add('company-motion-ready');
 schedule(()=>schedule(()=>{if(active)targets.forEach(target=>observer.observe(target));}));
 return ()=>{active=false;observer.disconnect();root.classList.remove('company-motion-ready');targets.forEach(t=>t.classList.remove('company-reveal','company-in-view'));for(const [group,original] of restorations)group.replaceWith(original);};
}
