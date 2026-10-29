import {extraCueParameter} from './cue-controls.mjs';
// Organic cues keep authored plant detail, then retire it for an exact artwork hold.
export const organicEffectIds=new Set(['flora-ivy','flora-moss','flora-bloom','flora-roots','flora-swarm','flora-lotus','flora-coral','flora-engrave','flora-watercolor','flora-circuit']);
export function organicDefaults(effect){return organicEffectIds.has(effect.id)?{uTint:[.94,1,.96,1],uSporeCount:0,uVineThickness:effect.id==='flora-swarm'?.65:.85,uWindFreq:.35}:{};}
export function growthParameter(effect){if(effect.id==='glitch-ledwall')return {name:'uResolve',min:0,max:1,label:'Resolve LEDs'};if(effect.id==='metal-acrylic')return {name:'uSettle',min:0,max:1,label:'Settle acrylic'};if(effect.id==='metal-crystal')return {name:'uCrystal',min:0,max:1,label:'Grow crystals'};if(organicEffectIds.has(effect.id))return {name:'uGrowth',min:0,max:100,label:'Grow logo'};return extraCueParameter(effect);}
export function growthCueValue(parameter,elapsed){const t=Math.max(0,Math.min(1,Number.isFinite(elapsed)?elapsed/5:0)),phase=t*t*(3-2*t);return parameter.min+(parameter.max-parameter.min)*phase;}
export function organicShader(effect,source){
 if(!organicEffectIds.has(effect.id))return source;
 source=source.replace('uniform vec2 RENDERSIZE;','uniform vec2 RENDERSIZE;uniform sampler2D geometryImage;');
 source=source.replace('return keyed(imgClamp(uv)) * inb.x * inb.y;','return samplePlate(geometryImage,uv).a * inb.x * inb.y;');
 source=source.replace(/void\s+main\s*\(\s*\)/,'void organicMain()');
 const floor=effect.id==='flora-bloom'?'.35':effect.id==='flora-swarm'?'.24':effect.id==='flora-ivy'?'.22':effect.id==='flora-moss'?'.2':effect.id==='flora-roots'||effect.id==='flora-engrave'?'.06':'.12';
 const support=effect.id==='flora-moss'?`float localMask=logoA(isf_FragNormCoord);localMask=max(localMask,logoA(isf_FragNormCoord+vec2(.006,0.)));localMask=max(localMask,logoA(isf_FragNormCoord-vec2(.006,0.)));localMask=max(localMask,logoA(isf_FragNormCoord+vec2(0.,.006)));localMask=max(localMask,logoA(isf_FragNormCoord-vec2(0.,.006)));gl_FragColor.a*=localMask;`:'';
 return source+`\nvec4 organicBlend(vec4 a,vec4 b,float t){vec4 pm=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),t);return vec4(pm.rgb/max(pm.a,.0001),pm.a);}\nvoid main(){float growth=clamp(uGrowth/100.,0.,1.);vec4 artwork=samplePlate(inputImage,isf_FragNormCoord);float resolved=smoothstep(.86,1.,growth);if(resolved>.9999){gl_FragColor=artwork;return;}organicMain();${support}vec4 treatment=organicBlend(gl_FragColor,artwork,${floor}*smoothstep(.12,.6,growth)*artwork.a);gl_FragColor=organicBlend(treatment,artwork,resolved);}\n`;
}
