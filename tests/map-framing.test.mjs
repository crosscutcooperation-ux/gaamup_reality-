import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {fitLockedMap} from '../lib/map-framing.js';
test('the locked landscape fits the complete screen on desktop, tablet and portrait phones',()=>{
  for(const aspect of [2.4,16/9,4/3,1,9/19.5]){
    const camera=new T.PerspectiveCamera(44,aspect,.2,650),bounds=new T.Box3(new T.Vector3(-140,-3,-121),new T.Vector3(140,26,121));
    const {distance,diagonal}=fitLockedMap(camera,bounds);
    assert.ok(camera.far>distance+diagonal);
    for(const x of [-140,140])for(const y of [-3,26])for(const z of [-121,121]){
      const p=new T.Vector3(x,y,z).project(camera);
      assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z> -1&&p.z<1,`${aspect}: all corners remain in view`);
    }
  }
});
