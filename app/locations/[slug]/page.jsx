import {notFound} from 'next/navigation';
import {cities,getCity} from '../../../lib/catalog.js';
import CatalogPage from '../../../components/CatalogPage.jsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const dynamicParams = false;
export function generateStaticParams(){return cities.map(({slug})=>({slug}));}
export async function generateMetadata({params}){
  const {slug}=await params;
  return {title:`Projects in ${getCity(slug)?.name||'your city'}`};
}
export default async function DestinationPage({params,searchParams}){
  const {slug}=await params;
  const city=getCity(slug);
  if(!city)notFound();
  return <CatalogPage city={city} query={await searchParams}/>;
}
