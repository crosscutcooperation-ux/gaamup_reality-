const selectors=[
  '.experience-heading','.colony-view','.experience-caption','.project-description',
  '.story-chapters','.story-index-head','.story-index-stage','.story-index-list li',
  '.story-index-foot','.story-cinema-copy','.story-cinema-top',
  '.story-residence-copy','.story-residence-image','.story-gallery header',
  '.story-gallery-track figure','.story-gallery-foot','.story-end>p','.story-end>a',
].join(',');

/** Reversible reveals: leaving the viewport resets the next entrance. */
export function observeProjectMotion(root,Observer=IntersectionObserver){
  const targets=[...root.querySelectorAll(selectors)];
  targets.forEach((target,index)=>{
    target.classList.add('page-reveal');
    target.style.setProperty('--page-delay',`${index%3*65}ms`);
  });
  const observer=new Observer(entries=>{
    for(const entry of entries){
      const visible=entry.isIntersecting&&entry.intersectionRatio>=.08;
      entry.target.style.setProperty('--page-exit-y',entry.boundingClientRect.top<0?'-40px':'40px');
      entry.target.classList.toggle('page-in-view',visible);
    }
  },{threshold:[0,.08],rootMargin:'0px 0px -2% 0px'});
  targets.forEach(target=>observer.observe(target));
  root.classList.add('project-motion-ready');
  return ()=>{
    observer.disconnect();root.classList.remove('project-motion-ready');
    targets.forEach(target=>target.classList.remove('page-reveal','page-in-view'));
  };
}
