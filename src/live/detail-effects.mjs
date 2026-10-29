export const detailEffectIds=new Set(['metal-acrylic','fluid-shockwave','glitch-pixelsort','glitch-halftone']);
export function detailDefaults(effect){
 const looks={
  'metal-acrylic':{uLayers:2,uDepth:.018,uOrbit:.18,uFresnel:.85,uBevel:.004},
  'fluid-shockwave':{uBounce:.18,uGravityWell:.3,uTurbScale:2.2},
  'glitch-pixelsort':{uGlitch:.55,uGlitchFreq:.484,uScanDensity:560,uChannelOffset:.004},
  'glitch-halftone':{uGlitch:.5,uGlitchFreq:.484,uScanDensity:620,uChannelOffset:.004}
 };
 return looks[effect.id]||{};
}
export function detailShader(effect,source){
 if(!detailEffectIds.has(effect.id))return source;
 source=source.replace('uniform vec2 RENDERSIZE;','uniform vec2 RENDERSIZE;uniform sampler2D geometryImage;')
 .replace('return keyed(imgClamp(uv)) * inb.x * inb.y;','return samplePlate(geometryImage,uv).a * inb.x * inb.y;')
 .replace('return vec4(c.rgb, keyed(c) * inb.x * inb.y);','return vec4(c.rgb, samplePlate(geometryImage,uv).a * inb.x * inb.y);')
 .replace(/float keyed\(vec4 c\)\s*\{[^}]*\}/,'float keyed(vec4 c){return c.a*smoothstep(.12,.38,max(c.r,max(c.g,c.b)));}')
 .replace(/void\s+main\s*\(\s*\)/,'void detailMain()');
 const hold=effect.id==='metal-acrylic'?'step(.9999,uSettle)':'smoothstep(.72,.84,fract(TIME/5.))';
 return source+`
 void main(){float hold=${hold};vec4 original=samplePlate(inputImage,isf_FragNormCoord);if(hold>.9999){gl_FragColor=original;return;}detailMain();vec4 pm=mix(vec4(gl_FragColor.rgb*gl_FragColor.a,gl_FragColor.a),vec4(original.rgb*original.a,original.a),hold);gl_FragColor=vec4(pm.rgb/max(pm.a,.0001),pm.a);}
 `;
}
