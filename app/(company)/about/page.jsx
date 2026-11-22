import {CONTACT_PHONES,WHATSAPP_URL} from '../../../lib/contact.js';
import CompanyShell from '../../../components/CompanyShell.jsx';

export const metadata = {
  title: 'About us',
  description: 'Meet the people, purpose and values behind Gaamup reality.',
};

export default function AboutPage() {
  return (
    <CompanyShell once>
      <main id="destination">
      <section className="phero"><div className="wrap"><p className="crumb"><a href="/">Home</a> &nbsp;/&nbsp; About us</p><h1>A few words about <em>our company.</em></h1><p className="lead">A personal approach to real estate. Bringing people, property and possibility together, with trust at the heart of every conversation.</p></div><span className="phero__num" aria-hidden="true">01</span></section>


      <section className="sec"><div className="wrap split"><div className="panel"><img src="/company/assets/residences.webp" alt="Illustrative landscaped residential community" className="panel__image" /><div className="panel__cap"><small>Our story</small>Better beginnings. Lasting relationships.</div></div><div><p className="eyebrow">The Gaamup reality story</p><h2>Built around <em>people.</em></h2><p className="lead company-story-lead">A home is more than an address. It is where the next chapter of your life begins.</p><p>At Gaamup reality, our approach starts with listening: to the home you imagine, the neighbourhood you want to be part of, and the things that matter to your family.</p><p>For homebuyers and developers alike, we believe lasting relationships begin with clear conversations, thoughtful guidance and a commitment to doing things with care.</p></div></div></section>


      <section className="sec tint" id="leadership"><div className="wrap"><div className="sec-head"><div><p className="eyebrow">Our founder</p><h2>A vision grounded <em>in trust.</em></h2></div><p className="lead">The people behind Gaamup reality. A shared belief in integrity, responsibility and long-term relationships.</p></div><div className="leader"><div className="portrait"><img src="/company/assets/prakash.webp" alt="Prakash Mewada, founder" width="640" height="800" /><span className="portrait__tag">Our founder</span></div><div><p className="eyebrow">Leadership</p><h3 className="leader__name">Prakash Mewada</h3><p className="leader__role">Founder</p><p className="lead">An entrepreneurial spirit. A belief in building things that last.</p><p>Prakash Mewada brings experience across construction, manufacturing and supply-chain operations. His work with PanVibes Exim and Gaamup Infra reflects a focus on quality, discipline and dependable relationships.</p><p>His approach to leadership puts integrity, mentorship and long-term thinking first. These principles shape the way we work with people and the care we bring to every new opportunity.</p><div className="founder-principles"><span>Integrity</span><span>Ownership</span><span>Purpose</span></div></div></div><div className="team-heading"><p className="eyebrow">Our directors</p><h2>Moving forward. <em>Together.</em></h2></div><div className="directors"><article><div className="director-photo"><img src="/company/assets/prathamesh.webp" alt="Prathamesh Patil" width="500" height="625" /></div><div className="director-caption"><div><h3>Prathamesh Patil</h3><p>Director</p></div><span aria-hidden="true">01</span></div></article><article><div className="director-photo"><img src="/company/assets/bhavesh.webp" alt="Bhavesh Patil" width="500" height="625" /></div><div className="director-caption"><div><h3>Bhavesh Patil</h3><p>Director</p></div><span aria-hidden="true">02</span></div></article></div></div></section>


      <section className="sec dark" id="values"><div className="wrap"><div className="sec-head"><div><p className="eyebrow">What guides us</p><h2>Our core <em>values.</em></h2></div><p className="lead">The principles behind our decisions, our relationships and the way we show up for every client.</p></div><div className="pillars"><div className="pillar"><p className="pillar__word"><em>01</em>Honesty</p><p>Clear information, open conversations and a straightforward approach. Trust begins with the details.</p></div><div className="pillar"><p className="pillar__word"><em>02</em>Professionalism</p><p>Careful preparation, considered advice and respect for your time, from the first conversation to the next step.</p></div><div className="pillar"><p className="pillar__word"><em>03</em>Care</p><p>Every requirement has a person behind it. We listen closely and treat your plans with the attention they deserve.</p></div></div></div></section>


      <section className="sec cta"><div className="wrap cta__in"><div><p className="eyebrow">Get in touch</p><h2>Let’s build what’s <em>next, together.</em></h2><p className="lead company-cta-lead">A home you are considering or a partnership you have in mind. Let’s start with a conversation.</p></div><div className="cta__act"><a className="btn btn--gold" href="/contact">Start a conversation <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg></a>{CONTACT_PHONES.map(phone=><a key={phone.href} className="btn btn--ghost" href={phone.href}>Call {phone.label}</a>)}</div></div></section>
      </main>

      <a className="wa" href={WHATSAPP_URL} target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.6-4.6A9 9 0 1 1 21 11.5Z" /><path d="M8 7c0 5 4 9 9 9l1-3-3-1-1 1c-2-1-3-2-4-4l1-1-1-2Z" /></svg></a>
    </CompanyShell>
  );
}
