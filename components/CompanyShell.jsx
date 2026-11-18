'use client';

import {useEffect, useRef} from 'react';
import {observeCompanyMotion} from '../public/company/motion.js';

export default function CompanyShell({children}) {
  const page = useRef(null);

  useEffect(() => {
    const root = page.current;
    const stopMotion = observeCompanyMotion(root);
    const form = root.querySelector('#enquiry');
    if (!form) return stopMotion;

    const type = new URLSearchParams(window.location.search).get('type');
    for (const radio of form.querySelectorAll('[name=type]')) {
      if (radio.value === type) radio.checked = true;
    }

    function prepareEnquiry(event) {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const text = `Hello Panvibes,\n\nI am a ${data.type.toLowerCase()}.\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}\n\n${data.message}`;
      const isEmail = event.submitter?.value === 'email';
      if (isEmail) {
        const subject = encodeURIComponent('Panvibes — ' + data.type + ' enquiry');
        window.location.href = `mailto:omkar@panvibes.com?subject=${subject}&body=${encodeURIComponent(text)}`;
      } else {
        window.open(`https://wa.me/918655481884?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }
      root.querySelector('#form-status').textContent = `Your message is prepared. Please press Send in ${isEmail ? 'your email app' : 'WhatsApp'} to complete your enquiry.`;
    }

    form.addEventListener('submit', prepareEnquiry);
    return () => {
      form.removeEventListener('submit', prepareEnquiry);
      stopMotion();
    };
  }, []);

  return <div className="company-page" ref={page}>{children}</div>;
}
