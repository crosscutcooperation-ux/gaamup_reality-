import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getProject} from '../../../lib/projects.js';
import {getCity} from '../../../lib/catalog.js';
import ProjectViewer from '../../../components/ProjectViewer.jsx';
import ProjectPresentation from '../../../components/ProjectPresentation.jsx';
import ProjectPageMotion from '../../../components/ProjectPageMotion.jsx';
import ProjectDetails from '../../../components/ProjectDetails.jsx';
export const dynamic='force-dynamic';
export async function generateMetadata({params}){const {slug}=await params;const data=await getProject(slug);return {title:data?.project.name||'Project'};}
export default async function ProjectPage({params,searchParams}){
  const {slug}=await params;const data=await getProject(slug);if(!data)notFound();const query=await searchParams;const project=data.project;const city=getCity(query.city)||getCity(project.citySlugs?.[0]);
  return <ProjectPageMotion><div className="experience-heading"><Link className="experience-back" href={query.from==='catalog'||!city?'/locations':`/locations/${city.slug}`} prefetch={false}> Back to projects</Link><div><span className="eyebrow">{project.location}</span><h1>{project.name}</h1></div><span className="experience-marker">A NEW PERSPECTIVE </span></div><ProjectViewer project={project} assets={data.assets} initialAction={query.explore==='floors'?'floor-picker':''}/>{data.offline&&<p className="experience-note">Local preview · Start the Rust backend to manage this project.</p>}{['sai-world-dreams','venus-skky-city','elements-new-panvel'].includes(slug)&&<ProjectPresentation projectId={slug}/>}<ProjectDetails project={project}/></ProjectPageMotion>;
}
