/** Install the supplied facade library at the existing, selectable tower transforms. */
export function replaceFacades(site,library){
  const originals=[];site.traverse(o=>{if(o.userData.kind==='tower')originals.push(o);});
  const replacements=originals.map(old=>{let source;library.traverse(o=>{if(o.userData.id===old.userData.id)source=o;});if(!source)throw Error('Missing supplied facade: '+old.userData.id);return {old,source};});
  for(const {old,source} of replacements){
    source.position.copy(old.position);source.quaternion.copy(old.quaternion);source.scale.copy(old.scale);
    source.userData={...old.userData,...source.userData,kind:'tower',towerId:old.userData.id,name:old.userData.name};source.name=old.name;
    source.traverse(o=>{if(!o.isMesh)return;o.userData.sourceName=o.name;const name=String((Array.isArray(o.material)?o.material[0]:o.material)?.name||'').toLowerCase();o.name=/glaz|glass/.test(name)?'glass':/aluminium|metal/.test(name)?'rail':/dark/.test(name)?'dark':/sand/.test(name)?'sand':/ivory|masonry/.test(name)?'ivory':o.name;});
    old.parent.add(source);old.removeFromParent();old.traverse(o=>o.geometry?.dispose());
  }
  site.updateMatrixWorld(true);return replacements.map(r=>r.source);
}
