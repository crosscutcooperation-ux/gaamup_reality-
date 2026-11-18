/** Match the residence pages: reveal on entry, reset on exit in either direction. */
export function observeCompanyMotion(root,Observer=IntersectionObserver){
 const selectors='.phero .crumb,.phero h1,.phero .lead,.split>*,.sec-head>*,.portrait,.leader>div:not(.portrait),.team-heading,.directors article,.pillar,.cta__in>*,.contact-layout>*,.office-band .wrap>*,.ftr__top>*,.ftr__bot';
 const targets=[...root.querySelectorAll(selectors)];
 const observer=new Observer(entries=>{
  for(const entry of entries){
   entry.target.style.setProperty('--company-exit-y',entry.boundingClientRect.top<0?'-40px':'40px');
   entry.target.classList.toggle('company-in-view',entry.isIntersecting&&entry.intersectionRatio>=.08);
  }
 },{threshold:[0,.08],rootMargin:'0px 0px -2% 0px'});
 targets.forEach((target,index)=>{target.classList.add('company-reveal');target.style.setProperty('--company-delay',`${index%3*65}ms`);observer.observe(target);});
 root.classList.add('company-motion-ready');
 return ()=>{observer.disconnect();root.classList.remove('company-motion-ready');targets.forEach(target=>target.classList.remove('company-reveal','company-in-view'));};
}
