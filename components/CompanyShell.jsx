'use client';

import {useEffect, useRef} from 'react';
import {usePathname} from 'next/navigation';
import {observeCompanyMotion} from '../public/company/motion.js';

export default function CompanyShell({children,once=false}) {
  const page = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = page.current;
    const stopMotion = observeCompanyMotion(root,undefined,undefined,{once});
    return stopMotion;
  }, [pathname,once]);

  return <div className="company-page" ref={page}>{children}</div>;
}
