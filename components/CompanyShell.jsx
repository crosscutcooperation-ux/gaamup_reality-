'use client';

import {useEffect, useRef} from 'react';
import {observeCompanyMotion} from '../public/company/motion.js';

export default function CompanyShell({children}) {
  const page = useRef(null);

  useEffect(() => {
    const root = page.current;
    const stopMotion = observeCompanyMotion(root);
    return stopMotion;
  }, []);

  return <div className="company-page" ref={page}>{children}</div>;
}
