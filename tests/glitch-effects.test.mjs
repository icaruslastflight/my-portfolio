import test from 'node:test';import assert from 'node:assert/strict';
import {glitchEffectIds,glitchDefaults} from '../src/live/glitch-effects.mjs';
import {stingers} from '../src/live/stingers.mjs';
test('eight glitch brand defaults respect authored control ranges',()=>{assert.equal(glitchEffectIds.size,8);for(const id of glitchEffectIds){const e=stingers.find(e=>e.id===id);assert.ok(e);for(const[name,value]of Object.entries(glitchDefaults(e))){const p=e.params.find(p=>p.name===name);assert.ok(p);assert.ok(Number.isFinite(value)&&value>=p.min&&value<=p.max,id+' '+name);}}});
test('user-favored pixel sort and halftone retain their authored controls',()=>{for(const id of ['glitch-pixelsort','glitch-halftone'])assert.deepEqual(glitchDefaults(stingers.find(e=>e.id===id)),{});});
