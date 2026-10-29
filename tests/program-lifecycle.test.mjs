import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer} from '../src/live/render.mjs';
import {stingers} from '../src/live/stingers.mjs';
function fixture({compile=true,link=true}={}){
 let id=0;const programs=new Set(),shaders=new Set(),deleted=[];
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,createProgram(){const p={id:++id};programs.add(p);return p;},createShader(){const s={id:++id};shaders.add(s);return s;},shaderSource(){},compileShader(){},getShaderParameter(){return compile;},getShaderInfoLog(){return 'compile failed';},attachShader(){},detachShader(){},linkProgram(){},getProgramParameter(){return link;},getProgramInfoLog(){return 'link failed';},deleteShader(s){shaders.delete(s);},deleteProgram(p){deleted.push(p);programs.delete(p);}};
 const renderer=Object.assign(Object.create(Renderer.prototype),{gl,programs:[],stingerPrograms:new Map(),maxStingerPrograms:2});return {renderer,programs,shaders,deleted};
}
test('linked programs release shader objects immediately',()=>{const f=fixture();f.renderer.program('void main(){}');assert.equal(f.shaders.size,0);assert.equal(f.programs.size,1);});
test('compile and link failures release partial resources',()=>{for(const options of [{compile:false},{link:false}]){const f=fixture(options);assert.throws(()=>f.renderer.program('bad'),/failed/);assert.equal(f.shaders.size,0);assert.equal(f.programs.size,0);assert.equal(f.renderer.programs.length,0);}});
test('effect browsing keeps two recent programs and recompiles an evicted effect',()=>{const f=fixture(),[a,b,c]=stingers;const pa=f.renderer.effectProgram(a);f.renderer.effectProgram(b);assert.equal(f.renderer.effectProgram(a),pa);f.renderer.effectProgram(c);assert.deepEqual([...f.renderer.stingerPrograms.keys()],[a.id,c.id]);const pb=f.renderer.effectProgram(b);assert.ok(pb);assert.equal(f.renderer.stingerPrograms.size,2);assert.equal(f.programs.size,2);assert.equal(f.renderer.programs.length,2);assert.equal(f.shaders.size,0);assert.equal(f.deleted.length,2);});
