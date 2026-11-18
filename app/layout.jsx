import './globals.css';
import SiteProvider from '../components/SiteProvider.jsx';
export const metadata={title:{default:'Gaamup reality — Your next address',template:'%s — Gaamup reality'},description:'A journey to your next address. Discover homes through the Gaamup railway.',icons:{icon:'/assets/brand/gaamup-mark.png'}};
export default function RootLayout({children}){
  return <html lang="en"><body><SiteProvider>{children}</SiteProvider></body></html>;
}
