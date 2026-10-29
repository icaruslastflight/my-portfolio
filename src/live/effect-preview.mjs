// Five-second logo cues include clear artwork at both ends.
export const EFFECT_DURATION=5;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export function logoEnvelope(seconds){
 const t=Number.isFinite(seconds)?seconds:0;
 return ease((t-.35)/.3)*(1-ease((t-3.95)/.4));
}
export function logoTreatment(id,seconds){
 const t=Math.max(0,Number.isFinite(seconds)?seconds:0);
 const phase=clamp((t-.35)/4);
 const pulse=phase===0||phase===1?0:Math.sin(Math.PI*phase)**2;
 const common={hoverMix:logoEnvelope(t),readability:.08};
 const cue=Math.max(0,t-.35),second=cue>=2,beat=Math.max(.001,(cue%2)/2);
 const pixelIndex=second?8:7,halftoneIndex=second?6:0;
 const looks={
  'glitch-pixelsort':{TIME:(pixelIndex+beat)*.484,uGlitch:.5,uGlitchFreq:.484,uScanDensity:560,uChannelOffset:.004,uBeat:beat},
  'fluid-soapfilm':{uGravityWell:.1,uBounce:.1,uTurbScale:1.5,uLifespan:5.5},
  'metal-acrylic':{uSettle:1-.38*pulse,uDepth:.009,uLayers:1,uFresnel:.85},
  'flora-engrave':{hoverMix:common.hoverMix*.68,readability:.14,uGrowth:100-42*pulse,uLineDensity:10,uSporeCount:35,uVineThickness:.8,uTint:[.7,1,.4,1]},
  'glitch-ledwall':{uResolve:1-.48*pulse,uBloom:.16,uGlitch:.12,uScanDensity:620},
  'glitch-halftone':{TIME:(halftoneIndex+beat)*.484,uGlitch:.4*common.hoverMix,uGlitchFreq:.484,uScanDensity:780,uChannelOffset:.002,uBeat:beat},
  'fluid-ash':{hoverMix:common.hoverMix*.75,readability:.18,uDissolve:.4*pulse,uLifespan:1.2,uBounce:.12,uGravityWell:.15},
  'fluid-shockwave':{uBeat:clamp((t-.35)/3.65),uBounce:.1,uGravityWell:.2,uTurbScale:2.2}
 };
 return {...common,...looks[id]};
}
export function hoverShader(effect,isLogo,isfProgram){
 let source=isfProgram(effect);
 if(isLogo){
  // Geometry ignores the dark ink backing; the original RGBA remains the beauty plate.
  source=source.replace('return keyed(imgClamp(uv)) * inb.x * inb.y;',
   'vec4 geom=imgClamp(uv); return geom.a*smoothstep(0.04,0.18,max(geom.r,max(geom.g,geom.b)))*inb.x*inb.y;');
 }
 if(isLogo&&effect.id==='fluid-soapfilm')source=source.replace('vec4 lg = logoRGBA(p);','vec4 lg = logoRGBA(p); lg.a=logoP(p);');
 source=source.replace(/void\s+main\s*\(\s*\)/,'void hoverEffectMain()');
 return source+`
uniform float hoverMix,readability,materialGain;
vec4 blendArtwork(vec4 a,vec4 b,float t){
 vec4 pm=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),t);
 return vec4(pm.rgb/max(pm.a,.0001),pm.a);
}
void main(){
 hoverEffectMain();vec4 original=samplePlate(inputImage,isf_FragNormCoord);
 gl_FragColor.rgb=clamp(gl_FragColor.rgb*materialGain,0.,1.);
 vec4 treatment=blendArtwork(gl_FragColor,original,readability*original.a);
 gl_FragColor=blendArtwork(original,treatment,hoverMix);
}`;
}
