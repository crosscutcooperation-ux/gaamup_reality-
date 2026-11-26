import {towerSpecs,project} from './project-data.js';
export const units=[{id:'1bhk-428',name:'1 BHK · 428 sq.ft.',page:22},{id:'1bhk-377',name:'1 BHK · 377 sq.ft.',page:22},{id:'2bhk-528',name:'2 BHK · 528 sq.ft.',page:23},{id:'jodi-856',name:'Jodi flat · 856 sq.ft.',page:23}].map(u=>({...u,render:`assets/plans/${u.id}-furnished-v2.webp`}));
export const typicalRenders=Object.fromEntries(['athena','iris','nova'].map(id=>[id,`assets/plans/${id}-typical-furnished.webp`]));
export function hasTypicalPlan(id,floor){return !!towerSpecs.find(t=>t.id===id)?.plan&&project.floorRanges.some(([a,b])=>floor>=a&&floor<=b);}
