export function pendingDestination(event,location){
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return null;
 const link=event.target?.closest?.('a[href]');
 if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return null;
 const url=new URL(link.href,location.href);
 if(url.origin!==location.origin||url.pathname===location.pathname)return null;
 return url.pathname;
}
