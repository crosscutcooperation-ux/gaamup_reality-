import Link from 'next/link';

export default function Brand(){
  return <Link className="brand gaamup-brand" href="/" aria-label="Gaamup Properties home"><img src="/assets/brand/gaamup-mark.png?v=20261127" alt="" width="52" height="52"/><span className="gaamup-wordmark">Gaamup<span>Properties</span></span></Link>;
}
