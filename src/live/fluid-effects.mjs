// Lab-only fluid refinements. Header treatments retain their own authored timelines.
export const fluidEffectIds=new Set(['fluid-vortex','fluid-mercury','fluid-magnet','fluid-ash','fluid-ember','fluid-cymatic','fluid-soapfilm','fluid-frost']);
export function fluidDefaults(effect){
 if(!fluidEffectIds.has(effect.id))return {};
 const shared={uBounce:.18,uDamping:.65,uGravityWell:.3};
 const looks={
 'fluid-vortex':{uLifespan:1.05,uBounce:.12,uDamping:.72},
 'fluid-mercury':{uMelt:.32,uTint:[.74,.46,.95,1]},
 'fluid-magnet':{uLifespan:2.8,uTint:[.64,.36,.92,1]},
 'fluid-cymatic':{uTint:[.8,.92,.72,1],uBounce:.2},
 'fluid-ember':{uTint:[1,.38,.09,1],uLifespan:1.25},
 'fluid-soapfilm':{uTint:[.55,.35,1,1],uTurbScale:1.5,uGravityWell:.1,uBounce:.1},
 'fluid-ash':{uTint:[.65,.4,.9,1],uLifespan:1.2},
 'fluid-frost':{uTint:[.76,.85,1,1],uFrost:.55}
 };
 return {...shared,...looks[effect.id]};
}
export function fluidShader(effect,source){
 if(!fluidEffectIds.has(effect.id))return source;
 source=source.replace('uniform vec2 RENDERSIZE;','uniform vec2 RENDERSIZE;uniform sampler2D geometryImage;')
 .replace('return keyed(imgClamp(uv)) * inb.x * inb.y;','return samplePlate(geometryImage,uv).a * inb.x * inb.y;')
 .replace('return vec4(c.rgb, keyed(c) * inb.x * inb.y);','return vec4(c.rgb, samplePlate(geometryImage,uv).a * inb.x * inb.y);');
 if(effect.id==='fluid-vortex')source=source.replace('col += acc * (1.0 - la * 0.85);','col += acc * (1.0 - la * 0.85) * .42;').replace('(0.6 + 1.0 * kick) * 1.3','(0.35 + 0.5 * kick) * .65').replace('(0.25 + 0.8 * kick)','(0.08 + 0.3 * kick)');
 if(effect.id==='fluid-mercury')source=source.replace('logoField(pb, 0.03)','logoField(pb, 0.008)').replace('logoField(pb, 0.06)','logoField(pb, 0.018)').replace('col *= 1.0 + 0.3 * uHigh * aud;','col *= 1.0 + 0.3 * uHigh * aud; col=mix(col,logoRGBA(pb).rgb,.24*la);');
 if(effect.id==='fluid-magnet')source=source.replace('float near = smoothstep(0.0, 0.06, F.x);','float near = smoothstep(0.015, 0.16, F.x);').replace('mix(0.15, 1.0, near * near)','mix(0.0, 1.0, near * near)').replace('float lock = smoothstep(0.75, 1.0, pulse);','float lock = smoothstep(0.48, 0.82, pulse);');
 if(effect.id==='fluid-cymatic')source=source.replace('mix(0.22, 0.4, thin)','mix(0.55, 0.75, thin)').replace('float m = (1.0 - smoothstep(sz * 0.7, sz * 1.1, length(f))) * exist;','sz=max(sz,.9/RENDERSIZE.y);float m = (1.0 - smoothstep(sz * 0.7, sz * 1.1, length(f))) * exist;');
 if(effect.id==='fluid-ember')source=source.replace('0.003 + 0.003 * fk','0.0018 + 0.0012 * fk').replace('0.95 - 0.7 * ageN','0.72 - 0.55 * ageN').replace('(1.6 + 0.6 * sin(t * 20.0 + h.y * 50.0))','(.65 + .2 * sin(t * 20.0 + h.y * 50.0))');
 if(effect.id==='fluid-soapfilm')source=source.replace('vec4 lg = logoRGBA(p);','vec4 lg = logoRGBA(p); lg.a=logoP(p);').replace('lg.rgb * 0.18 + filmL * (0.5 + 0.6 * luma)','lg.rgb * 0.42 + filmL * (0.3 + 0.4 * luma)').replace('sheen * 0.3','sheen * 0.16').replace('halo * (0.6 + 0.6 * kick)','halo * (0.25 + 0.3 * kick)');
 const endpoint=effect.id==='fluid-frost'?'uClear>=.9999':effect.id==='fluid-ash'?'uDissolve<=.0001':effect.id==='fluid-ember'?'uBurn<=.0001':null;
 const exit=effect.id==='fluid-ash'?'uDissolve':effect.id==='fluid-ember'?'uBurn':null;
 if(endpoint){source=source.replace(/void\s+main\s*\(\s*\)/,'void fluidMain()');source+='\nvoid main(){if('+endpoint+'){gl_FragColor=samplePlate(inputImage,isf_FragNormCoord);return;}fluidMain();'+(exit?'gl_FragColor.a*=1.-smoothstep(.94,1.,'+exit+');':'')+'}\n';}
 return source;
}
