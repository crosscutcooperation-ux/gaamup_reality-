import {towerSpecs} from './model.js';
export const BUILDINGS=towerSpecs.map((t,i)=>({...t,sceneId:t.id,number:i+1}));
export function resolvePlan(id,floor){const b=BUILDINGS.find(x=>x.id===id);return {available:!!b?.plan&&floor>=2&&floor<=b.floors,verified:['A','C','F','lavista'].includes(id)};}
