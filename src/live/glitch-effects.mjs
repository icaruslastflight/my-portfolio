// Brand treatments stay on the artwork; the source shaders keep their distinct disruption.
export const glitchEffectIds=new Set(['glitch-datamosh','glitch-rgb','glitch-crt','glitch-vhs','glitch-static','glitch-beatcut','glitch-ledwall','glitch-slicestagger']);
export function glitchDefaults(effect){
 if(!glitchEffectIds.has(effect.id))return {};
 const values={uGlitch:.42,uGlitchFreq:.5,uChannelOffset:.005,uScanDensity:620,...(effect.id==='glitch-crt'?{uVeil:0}:{}),...(effect.id==='glitch-ledwall'?{uBloom:.2}:{}),...(effect.id==='glitch-beatcut'?{uGlitch:.48}:{} )};
 return Object.fromEntries(Object.entries(values).filter(([key])=>effect.params.some(p=>p.name===key)));
}
export function glitchShader(effect,source){
 if(!glitchEffectIds.has(effect.id))return source;
 source=source.replace('uniform vec2 RENDERSIZE;','uniform vec2 RENDERSIZE;uniform sampler2D geometryImage;')
 .replace('return keyed(imgClamp(uv)) * inb.x * inb.y;','return samplePlate(geometryImage,uv).a * inb.x * inb.y;')
 .replace(/float keyed\(vec4 c\)\s*\{[^}]*\}/,'float keyed(vec4 c){return c.a*smoothstep(.12,.38,max(c.r,max(c.g,c.b)));}');
 if(effect.id==='glitch-beatcut')source=source.replace('* 0.7;','* 0.12;').replace('pz / 1.45','pz / 1.08').replace('q.x = abs(q.x) * (h.z < 0.5 ? -1.0 : 1.0)','q.x += (h.z-.5)*.08').replace('q.y = -q.y','q.y += (h.z-.5)*.05').replace('* 0.04;','* 0.018;').replace('vec2 pz = p / zoom;','zoom=min(zoom,1.08);vec2 pz = p / zoom;');
 if(effect.id==='glitch-rgb')source=source.replace('float amtRest = uChannelOffset','float amtRest = min(uChannelOffset,.018)').replace('uChannelOffset * 1.6);','min(uChannelOffset,.018) * 1.6);');
 if(effect.id==='glitch-crt')source=source.replace('* 0.35 * uGlitch * ph','* 0.08 * uGlitch * ph');
 if(effect.id==='glitch-static')source=source.replace('mix(0.08, 1.0, near)','near').replace('through, 0.6 * uGlitch * burst','through, 0.4 * uGlitch * burst');
 if(effect.id==='glitch-slicestagger')source=source.replace('0.19 * (0.35 + 0.65 * uGlitch)','0.12 * (0.35 + 0.65 * uGlitch)');
 source=source.replace(/void\s+main\s*\(\s*\)/,'void glitchMain()');
 const progress=effect.id==='glitch-ledwall'?'uResolve':effect.id==='glitch-slicestagger'?'uStagger':null;
 const hold=progress?`step(.9999,${progress})`:'smoothstep(.72,.84,fract(TIME/5.))';
 const contained=['glitch-crt','glitch-vhs','glitch-static'].includes(effect.id);
 const floor=effect.id==='glitch-static'?'.18':effect.id==='glitch-datamosh'?'.12':'.08';
 return source+`
 vec4 glitchBlend(vec4 a,vec4 b,float t){vec4 pm=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),t);return vec4(pm.rgb/max(pm.a,.0001),pm.a);}
 void main(){
  vec4 original=samplePlate(inputImage,isf_FragNormCoord);float hold=${hold};
  if(hold>.9999){gl_FragColor=original;return;}
  glitchMain();
  ${contained?`vec2 q=isf_FragNormCoord;float support=samplePlate(geometryImage,q).a;for(int i=0;i<8;i++){float a=float(i)*.785398;support=max(support,samplePlate(geometryImage,q+vec2(cos(a),sin(a))*vec2(RENDERSIZE.y/RENDERSIZE.x,1.)*.024).a);}gl_FragColor.a*=support;`:''}
  ${progress?'':`gl_FragColor=glitchBlend(gl_FragColor,original,${floor}*original.a);`}
  gl_FragColor=glitchBlend(gl_FragColor,original,hold);
 }
 `;
}
