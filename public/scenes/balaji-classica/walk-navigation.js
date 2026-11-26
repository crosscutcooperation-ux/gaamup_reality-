import {towerSpecs} from './project-data.js';
import {pointInFootprint} from './facade-shell.js';
export function canWalk(x,z){
 if(x< -71||x>80||z< -60||z>52)return false;
 if(x>17&&x<34&&z>-14&&z<-1)return false;
 if(x>5&&x<33&&z>1.5&&z<27)return false;
 return !towerSpecs.some(s=>pointInFootprint(x-s.x,z-s.z,s));
}
