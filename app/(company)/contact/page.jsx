import EnquiryForm from '../../../components/EnquiryForm.jsx';
import CompanyShell from '../../../components/CompanyShell.jsx';

export const metadata = {
  title: 'Contact us',
  description: 'Speak with Gaamup reality about your next home or a developer partnership.',
};

export default async function ContactPage({searchParams}) {
  const query=await searchParams;
  const project=['Sai World Dreams','Venus Skky City','Codename Elements'].includes(query?.project)?query.project:'';
  return (
    <CompanyShell>
      <main id="destination">
      <section className="phero"><div className="wrap"><p className="crumb"><a href="/">Home</a> &nbsp;/&nbsp; Contact us</p><h1>Let’s <em>talk.</em></h1><p className="lead">A developer partnership or a home you are considering — tell us a little about your plans. Every good relationship starts with a conversation.</p></div><span className="phero__num" aria-hidden="true">02</span></section>


      <section className="sec"><div className="wrap contact-layout"><div><p className="eyebrow">Reach us</p><h2>A conversation. <em>A new beginning.</em></h2><div className="contact-list"><div><small>Call</small><a href="tel:+918655481884">+91 86554 81884</a><em>Let’s talk about your plans.</em></div><div><small>WhatsApp</small><a href="https://wa.me/918655481884" target="_blank" rel="noopener">Chat with us ↗</a><em>A simple way to start a conversation.</em></div><div><small>Email</small><a href="mailto:enquiry@panvibes.com">enquiry@panvibes.com</a><em>For enquiries and partnerships.</em></div><div><small>Our office</small><p>Akshar Business Park, W-2106, Janta Market Road, Sector 25, Vashi, Navi Mumbai, Maharashtra 400703</p><em>Please contact us before visiting.</em><a className="office-map" href="https://www.google.com/maps/search/?api=1&query=Akshar%20Business%20Park%2C%20W-2106%2C%20Janta%20Market%20Road%2C%20Sector%2025%2C%20Vashi%2C%20Navi%20Mumbai%2C%20Maharashtra%20400703" target="_blank" rel="noopener">Get directions ↗</a></div></div></div><div className="enquiry-panel"><p className="eyebrow">Make the first move</p><h2>Tell us what’s <em>on your mind.</em></h2>
      <EnquiryForm key={project} project={project}/></div></div></section>
      <section className="office-band tint"><div className="wrap"><div><p className="eyebrow">Find us in Navi Mumbai</p><h2>Let’s connect <em>in person.</em></h2><p>Akshar Business Park, W-2106, Janta Market Road, Sector 25, Vashi, Navi Mumbai, Maharashtra 400703</p></div><a href="https://www.google.com/maps/search/?api=1&query=Akshar%20Business%20Park%2C%20W-2106%2C%20Janta%20Market%20Road%2C%20Sector%2025%2C%20Vashi%2C%20Navi%20Mumbai%2C%20Maharashtra%20400703" className="btn btn--ink" target="_blank" rel="noopener">Open in Google Maps <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" /></svg></a></div></section>
      </main>

      <a className="wa" href="https://wa.me/918655481884" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.6-4.6A9 9 0 1 1 21 11.5Z" /><path d="M8 7c0 5 4 9 9 9l1-3-3-1-1 1c-2-1-3-2-4-4l1-1-1-2Z" /></svg></a>
    </CompanyShell>
  );
}
