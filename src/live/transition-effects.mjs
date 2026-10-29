export const finishingEffectIds=new Set(['sting-flash-wipe','sting-iris','sting-portal','sting-laser','sting-slam','flora-watercolor','flora-circuit','metal-pillars']);
export function transitionDefaults(effect){
 if(effect.category==='sting')return {uDuration:1.6,uShake:.18,uShutter:90};
 if(effect.id==='metal-pillars')return {uCell:.008,uDepth:.035,uOrbit:.16,uBevel:.004,uRoughness:.28,uFresnel:.85,uTint:[.68,.4,.92,1]};
 return {};
}
export function transitionShader(effect,source){
 const sting=effect.category==='sting',pillars=effect.id==='metal-pillars';
 if(!sting&&!pillars)return source;
 source=source.replace('uniform vec2 RENDERSIZE;','uniform vec2 RENDERSIZE;uniform sampler2D geometryImage;uniform float brandArtwork;')
 .replace('return keyed(imgClamp(uv)) * inb.x * inb.y;','return samplePlate(geometryImage,uv).a * inb.x * inb.y;')
 .replace('return vec4(c.rgb, keyed(c) * inb.x * inb.y);','return vec4(c.rgb, samplePlate(geometryImage,uv).a * inb.x * inb.y);');
 if(effect.id==='sting-portal')source=source.replace('logoField(q, 0.1)','logoField(q, 0.025)').replace('1.0 - 0.8 * shade','1.0 - 0.18 * shade');
 if(effect.id==='sting-laser')source=source.replace('hitFlash(t, hit, uDuration) * 2.0 + hitEnv(t, hit, uDuration) * 0.6','hitFlash(t, hit, uDuration) * .55 + hitEnv(t, hit, uDuration) * .16').replace('uTint.rgb, 0.6 * b','uTint.rgb, 0.18 * b').replace('float alpha = max(neon, halo * drawn * on * 0.6);','col*=mix(1.,.22,smoothstep(hit,hit+.06,t));float alpha = max(neon, halo * drawn * on * 0.6);');
 if(effect.id==='sting-slam')source=source.replace('barMask *= 1.0 - 0.45 * b;','barMask *= 1.0-smoothstep(.12,.3,b);').replace('e *= step(hit, t) * (1.0 - b)','e *= step(hit, t) * (1.0-smoothstep(.12,.3,b))');
 if(pillars)source=source.replace('float lvlMax = max(uBass, max(uMid, uHigh)) * aud;','float lvlMax = .6*(1.-exp(-max(max(uBass,max(uMid,uHigh))*aud*1.25,0.)));').replace('float lvl = plBand(length(cc) / 0.8) * aud * (0.75 + 0.5 * hash11(cell.x * 1.37 + 0.5));','float lvl = .6*(1.-exp(-max(plBand(length(cc)/.8)*aud*(.75+.5*hash11(cell.x*1.37+.5)),0.)));');
 source=source.replace(/void\s+main\s*\(\s*\)/,'void transitionMain()');
 return source+`
 vec4 transitionBlend(vec4 a,vec4 b,float t){vec4 pm=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),t);return vec4(pm.rgb/max(pm.a,.0001),pm.a);}
 void main(){
  vec4 original=samplePlate(inputImage,isf_FragNormCoord);
  ${sting?`float phase=stingerClock();if(phase<=.0001||phase>=.9999){gl_FragColor=vec4(0.);return;}float b=clamp((phase-uHitPoint)/max(1.-uHitPoint,.0001),0.,1.);float hold=smoothstep(.2,.28,b)*(1.-smoothstep(.55,.62,b))*brandArtwork;`:`if(uDepth<=.0001){gl_FragColor=original;return;}float hold=smoothstep(.72,.84,fract(TIME/5.));`}
  if(hold>.9999){gl_FragColor=original;return;}
  transitionMain();
  ${pillars?'gl_FragColor=transitionBlend(gl_FragColor,original,(.18+.16*clamp(max(uBass,max(uMid,uHigh))*uAudioReact,0.,1.))*original.a);':''}
  gl_FragColor=transitionBlend(gl_FragColor,original,hold);
 }
 `;
}
