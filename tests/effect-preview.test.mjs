import test from 'node:test';import assert from 'node:assert/strict';
import {logoEnvelope,logoTreatment,EFFECT_DURATION} from '../src/live/effect-preview.mjs';
import {stingers} from '../src/live/stingers.mjs';
const ids=['glitch-pixelsort','fluid-soapfilm','metal-acrylic','flora-engrave','glitch-ledwall','glitch-halftone','fluid-ash','fluid-shockwave'];
test('five-second cues have full-artwork holds at both ends',()=>{assert.equal(EFFECT_DURATION,5);for(const t of [0,.2,.35,4.35,4.8,5])assert.equal(logoEnvelope(t),0);assert.equal(logoEnvelope(2),1);for(let t=0;t<=5;t+=.025)assert.ok(logoEnvelope(t)>=0&&logoEnvelope(t)<=1);});
test('logo cues respect authored parameter bounds and stay finite across the cycle',()=>{for(const id of ids){const effect=stingers.find(e=>e.id===id);assert.ok(effect);for(let t=0;t<=5;t+=.025){const values=logoTreatment(id,t);for(const p of effect.params){const v=values[p.name];if(typeof v!=='number')continue;assert.ok(Number.isFinite(v),id+' '+p.name);if(p.min!=null)assert.ok(v>=p.min-1e-8,id+' '+p.name);if(p.max!=null)assert.ok(v<=p.max+1e-8,id+' '+p.name);}}}});
test('forming treatments return to resolved artwork for final hold',()=>{assert.equal(logoTreatment('metal-acrylic',4.5).uSettle,1);assert.equal(logoTreatment('flora-engrave',4.5).uGrowth,100);assert.equal(logoTreatment('glitch-ledwall',4.5).uResolve,1);assert.equal(logoTreatment('fluid-ash',4.5).uDissolve,0);});

test('beat-driven logo cues advance stable indices instead of repeating a frozen seed',()=>{for(const [id,expected] of [['glitch-pixelsort',[7,8]],['glitch-halftone',[0,6]]]){for(const [i,t] of [.6,2.6].entries()){const v=logoTreatment(id,t);assert.ok(v.uBeat>.0005);assert.equal(Math.floor(v.TIME/v.uGlitchFreq-v.uBeat+.5),expected[i]);}}});
