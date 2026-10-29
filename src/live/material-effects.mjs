// Keep color artwork separate from the silhouette used for material geometry.
export const materialEffectIds=new Set(['metal-chrome','metal-glass','metal-holo','metal-forge','metal-anodized','metal-guilloche','metal-crystal','fluid-goldfill']);
export function inkMaskPixels(rgba){
 const result=new Uint8ClampedArray(rgba.length);
 for(let i=0;i<rgba.length;i+=4){const brightness=Math.max(rgba[i],rgba[i+1],rgba[i+2])/255;let t=Math.max(0,Math.min(1,(brightness-.12)/.26));t=t*t*(3-2*t);result[i]=result[i+1]=result[i+2]=255;result[i+3]=Math.round(rgba[i+3]*t);}
 return result;
}
export function materialDefaults(effect){
 if(!materialEffectIds.has(effect.id))return {};
 const available=new Set(effect.params.map(p=>p.name));
 return Object.fromEntries(Object.entries({uTint:[.74,.46,.95,1],uDepth:.025,uBevel:.006,uRoughness:.28,uFresnel:1.1}).filter(([name])=>available.has(name)));
}
export function materialShader(effect,source){
 if(!materialEffectIds.has(effect.id))return source;
 source=source.replace('uniform vec2 RENDERSIZE;','uniform vec2 RENDERSIZE;uniform sampler2D geometryImage;');
 source=source.replace('return keyed(imgClamp(uv)) * inb.x * inb.y;', 'return samplePlate(geometryImage,uv).a * inb.x * inb.y;');
 source=source.replace('return vec4(c.rgb, keyed(c) * inb.x * inb.y);','return vec4(c.rgb, samplePlate(geometryImage,uv).a * inb.x * inb.y);');
 if(effect.id==='metal-crystal')source=source.replace('float mask = max(', 'shard *= 1.0-smoothstep(0.85,1.0,uCrystal);\n  float mask = max(');
 source=source.replace(/void\s+main\s*\(\s*\)/,'void materialMain()');
 const readable=effect.id==='metal-crystal'?'0.38*smoothstep(0.8,1.0,uCrystal)':effect.id==='metal-forge'?'0.26':effect.id==='metal-guilloche'?'0.22':'0.14';
 return source+`\nvoid main(){materialMain();vec4 original=samplePlate(inputImage,isf_FragNormCoord);float ink=samplePlate(geometryImage,isf_FragNormCoord).a;float mixAmount=${readable}*ink;vec4 effect=gl_FragColor;vec4 pm=mix(vec4(effect.rgb*effect.a,effect.a),vec4(original.rgb*ink,ink),mixAmount);gl_FragColor=vec4(pm.rgb/max(pm.a,.0001),pm.a);}\n`;
}
