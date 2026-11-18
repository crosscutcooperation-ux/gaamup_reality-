import CatalogPage from '../../components/CatalogPage.jsx';

export const dynamic = 'force-dynamic';
export const metadata = {title:'All properties'};

export default async function AllPropertiesPage({searchParams}) {
  return <CatalogPage query={await searchParams}/>;
}
