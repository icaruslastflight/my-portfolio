import {organicShader} from './organic-effects.mjs';
import {inkMaskPixels,materialShader} from './material-effects.mjs';
import {generativeGLSL} from './generative.mjs';
import {stingers} from './stingers.mjs';
import {bitonicStages} from './model.mjs';
const vertex=`attribute vec2 pos;varying vec2 uv;void main(){uv=pos*.5+.5;gl_Position=vec4(pos,0.,1.);}`;
const common=`precision highp float;varying vec2 uv;uniform vec2 resolution;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}`;
const source=common+generativeGLSL+`uniform sampler2D media;
uniform float time,scene,zoom,rotation,hue,displacement,react,energy,beat,mirror,hasMedia,mixAmount,mediaAspect;
vec3 grade(vec3 c){float a=hue*.0174533;vec3 axis=normalize(vec3(1.));return c*cos(a)+cross(axis,c)*sin(a)+axis*dot(axis,c)*(1.-cos(a));}
void main(){
 float aspect=resolution.x/resolution.y;
 vec2 p=(uv-.5)*vec2(aspect,1.);p=rot(rotation*.0174533)*p/zoom;
 if(mirror>.5)p.x=abs(p.x);
 float drive=energy*react;
 p+=displacement*.07*vec2(sin(p.y*8.+time*.4),cos(p.x*6.-time*.3));
 vec3 col=vec3(.018,.029,.025);
 vec3 lime=vec3(.73,.95,.51),ice=vec3(.33,.68,.77),warm=vec3(.94,.64,.37);
 if(hasMedia<.5||mixAmount<.999){
  col=generate(p,time,scene,drive);
 }
 col=grade(col);
 if(hasMedia>.5){vec2 tc=p/vec2(aspect,1.)+.5;if(mediaAspect>aspect)tc.x=(tc.x-.5)*aspect/mediaAspect+.5;else tc.y=(tc.y-.5)*mediaAspect/aspect+.5;col=mix(col,grade(texture2D(media,clamp(tc,0.,1.)).rgb),mixAmount);}
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
`;
const sorting=common+`
uniform sampler2D image;uniform float k,j,threshold;
void main(){float x=floor(uv.x*resolution.x);float partner=x+(mod(floor(x/j),2.)<1.?j:-j);vec2 v=vec2((partner+.5)/resolution.x,uv.y);vec4 a=texture2D(image,uv),b=texture2D(image,v);float la=lum(a.rgb),lb=lum(b.rgb);bool low=x<partner;bool asc=mod(floor(x/k),2.)<1.;bool takeMin=low==asc;bool takeB=takeMin?lb<la:lb>la;gl_FragColor=(la>=threshold&&lb>=threshold&&takeB)?b:a;}`;
const composite=common+`
uniform sampler2D image,sorted,history;uniform float sortingAmount,artifacts,feedback,mosh,time,energy,react,burst;
void main(){
 float block=hash(floor(uv*vec2(32.,18.))+floor(time*1.5));vec2 v=uv;
 v.x+=(block-.5)*artifacts*.052;
 vec3 current=mix(texture2D(image,v).rgb,texture2D(sorted,v).rgb,sortingAmount);
 vec2 split=vec2(artifacts*.009,0.);current.r=mix(current.r,texture2D(image,v+split).r,artifacts);current.b=mix(current.b,texture2D(image,v-split).b,artifacts);
 float levels=mix(256.,9.,artifacts);current=mix(current,floor(current*levels)/levels,artifacts);
 vec2 echo=rot(.006*feedback)*(uv-.5)/(1.+feedback*.012)+.5;
 vec3 old=texture2D(history,clamp(echo,0.,1.)).rgb;
 vec2 cell=floor(uv*vec2(40.,24.));vec2 flow=vec2(sin(cell.y*.3+time*.25),cos(cell.x*.25-time*.19));float amount=max(mosh,burst*.92);
 vec3 smear=texture2D(history,clamp(uv-flow*(.002+amount*.019)*(1.+energy*react),0.,1.)).rgb;
 float change=abs(lum(current)-lum(old));vec3 result=mix(current,old,feedback*.91);
 float mask=smoothstep(.02,.25,change)+.22;result=mix(result,smear,clamp(amount*mask,0.,.94));
 gl_FragColor=vec4(clamp(result,0.,.92),1.);
}`;
const copy=common+`uniform sampler2D image,overlay;uniform float opacity;void main(){vec3 bg=texture2D(image,uv).rgb;vec4 fg=texture2D(overlay,uv);gl_FragColor=vec4(mix(bg,fg.rgb,fg.a*opacity),1.);}`;
export function isfProgram(effect){
 const source=effect.source, end=source.indexOf('*/')+2;
 const header=JSON.parse(source.slice(2,end-2));
 const types={image:'sampler2D',float:'float',bool:'bool',event:'bool',long:'int',color:'vec4',point2D:'vec2'};
 return 'precision highp float;varying vec2 uv;uniform vec2 RENDERSIZE;uniform float TIME,TIMEDELTA,logoScale;uniform int FRAMEINDEX,PASSINDEX;uniform vec4 DATE;'+header.INPUTS.map(p=>'uniform '+types[p.TYPE]+' '+p.NAME+';').join('\n')+
 '\n#define isf_FragNormCoord uv\nvec4 samplePlate(sampler2D tex,vec2 q){q=(q-.5)/logoScale+.5;vec4 c=texture2D(tex,clamp(q,0.,1.));c*=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);return c;}\n#define IMG_NORM_PIXEL(img,q) samplePlate(img,q)\n#define IMG_PIXEL(img,q) samplePlate(img,(q)/RENDERSIZE)\n'+source.slice(end);
}
/** Render graph: source -> optional 16-pixel bitonic sort -> temporal feedback -> output. */
export class Renderer {
 constructor(canvas,onFailure=()=>{},transparent=false){this.canvas=canvas;this.onFailure=onFailure;this.gl=canvas.getContext('webgl',{alpha:transparent,premultipliedAlpha:false,antialias:false,depth:false,powerPreference:'low-power',preserveDrawingBuffer:false});if(!this.gl)throw Error('WebGL unavailable');const g=this.gl;this.programs=[];this.stingerPrograms=new Map();this.shaders=[];this.targets=[];this.source=this.program(source);this.sort=this.program(sorting);this.composite=this.program(composite);this.copy=this.program(copy);this.buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),g.STATIC_DRAW);this.mediaTexture=this.texture();this.logoTexture=this.texture();this.geometryTexture=this.texture();this.emptyTexture=this.texture();this.logoAspect=920/220;this.hasLogo=false;this.media=null;this.mediaAspect=1;this.frames=0;this.draws=0;this.lost=false;this.onLost=e=>{e.preventDefault();this.lost=true;onFailure('Graphics context lost. Reload to restore the visual engine.');};canvas.addEventListener('webglcontextlost',this.onLost);this.resize();}
 program(fragment){const g=this.gl,p=g.createProgram();this.programs.push(p);for(const [type,code] of [[g.VERTEX_SHADER,vertex],[g.FRAGMENT_SHADER,fragment]]){const s=g.createShader(type);this.shaders.push(s);g.shaderSource(s,code);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));g.attachShader(p,s);}g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));return {p,uniforms:new Map()};}
 texture(){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));return t;}
 target(){const g=this.gl,t=this.texture(),f=g.createFramebuffer();g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,this.w,this.h,0,g.RGBA,g.UNSIGNED_BYTE,null);g.bindFramebuffer(g.FRAMEBUFFER,f);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,t,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer allocation failed');return {t,f};}
 resize(){const rect=this.canvas.getBoundingClientRect(),w=Math.max(256,Math.floor(Math.min(720,rect.width||640)/16)*16),h=Math.round(w*9/16);if(w===this.w)return;const g=this.gl;this.targets.forEach(t=>{g.deleteTexture(t.t);g.deleteFramebuffer(t.f);});this.w=w;this.h=h;this.canvas.width=w;this.canvas.height=h;this.targets=Array.from({length:6},()=>this.target());this.history=3;this.clear();}
 clear(){const g=this.gl;g.clearColor(0,0,0,1);this.targets.forEach(t=>{g.bindFramebuffer(g.FRAMEBUFFER,t.f);g.clear(g.COLOR_BUFFER_BIT);});g.bindFramebuffer(g.FRAMEBUFFER,null);}
 setLogo(url,onReady=()=>{}){const version=this.logoVersion=(this.logoVersion||0)+1;const img=new Image();img.onload=()=>{if(this.lost||version!==this.logoVersion)return;const plate=document.createElement('canvas');plate.width=1024;plate.height=576;const c=plate.getContext('2d');const probe=document.createElement('canvas');probe.width=img.naturalWidth;probe.height=img.naturalHeight;const ctx=probe.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,probe.width,probe.height).data;let x0=probe.width,y0=probe.height,x1=0,y1=0;for(let y=0;y<probe.height;y++)for(let x=0;x<probe.width;x++)if(pixels[(y*probe.width+x)*4+3]>10){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}const w=Math.max(1,x1-x0+1),h=Math.max(1,y1-y0+1),scale=Math.min(700/w,330/h);c.drawImage(img,x0,y0,w,h,(1024-w*scale)/2,(576-h*scale)/2,w*scale,h*scale);const g=this.gl;g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.logoTexture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,plate);const mask=c.getImageData(0,0,1024,576);mask.data.set(inkMaskPixels(mask.data));c.putImageData(mask,0,0);g.bindTexture(g.TEXTURE_2D,this.geometryTexture);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,plate);this.hasLogo=true;onReady();};img.onerror=()=>this.onFailure('The logo image could not load.');img.src=url;}
 setMedia(element){this.media=element;this.mediaAspect=element?(element.videoWidth||element.naturalWidth||1)/(element.videoHeight||element.naturalHeight||1):1;}
 draw(program,target,uniforms={},textures={}){const g=this.gl;g.bindFramebuffer(g.FRAMEBUFFER,target?.f||null);g.viewport(0,0,this.w,this.h);g.useProgram(program.p);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);const a=g.getAttribLocation(program.p,'pos');g.enableVertexAttribArray(a);g.vertexAttribPointer(a,2,g.FLOAT,false,0,0);const loc=name=>{if(!program.uniforms.has(name))program.uniforms.set(name,g.getUniformLocation(program.p,name));return program.uniforms.get(name);};g.uniform2f(loc('resolution'),this.w,this.h);g.uniform2f(loc('RENDERSIZE'),this.w,this.h);for(const [key,val] of Object.entries(uniforms)){if(Array.isArray(val))g['uniform'+val.length+'fv'](loc(key),val);else if(typeof val==='boolean'||program.ints?.has(key))g.uniform1i(loc(key),Number(val));else g.uniform1f(loc(key),val);}let unit=0;for(const [key,tex] of Object.entries(textures)){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);g.uniform1i(loc(key),unit++);}g.drawArrays(g.TRIANGLES,0,6);this.draws++;}
 render(state,time,audio,burst=0){if(this.lost)return;const g=this.gl;let ready=false;if(this.media){ready=this.media.tagName==='VIDEO'?this.media.readyState>=2:this.media.complete&&this.media.naturalWidth>0;if(ready){g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.mediaTexture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);try{g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,this.media);}catch{this.media=null;ready=false;this.onFailure('Media could not be sampled. Only local or same-origin media is supported.');}}}
 const energy=audio.bands[0],u={time:time*state.speed,scene:state.scene,zoom:state.zoom,rotation:state.rotation,hue:state.hue,displacement:state.displacement,react:state.react,energy,beat:audio.beat,mirror:state.mirror?1:0,hasMedia:ready?1:0,mixAmount:state.mix,mediaAspect:this.mediaAspect};
 this.draw(this.source,this.targets[0],u,{media:this.mediaTexture});let sorted=this.targets[0];if(state.sorting>.001){let index=1;for(const [k,j] of bitonicStages()){this.draw(this.sort,this.targets[index],{k,j,threshold:state.threshold},{image:sorted.t});sorted=this.targets[index];index=index===1?2:1;}}
 const write=this.history===3?4:3;this.draw(this.composite,this.targets[write],{time,energy,react:state.react,sortingAmount:state.sorting,artifacts:state.artifacts,feedback:state.feedback,mosh:state.mosh,burst},{image:this.targets[0].t,sorted:sorted.t,history:this.targets[this.history].t});if(state.logoOpacity>.001){const effect=stingers[state.logoEffect]||stingers[0];let program=this.stingerPrograms.get(effect.id);if(!program){program=this.program(organicShader(effect,materialShader(effect,isfProgram(effect))));program.ints=new Set(effect.params.filter(p=>p.type==='long').map(p=>p.name));this.stingerPrograms.set(effect.id,program);}const values={...Object.fromEntries(effect.params.map(p=>[p.name,p.default])),...(state.stingerValues||{})};Object.assign(values,{TIME:time,TIMEDELTA:1/30,uShutter:state.logoMotion||state.logoAnimating?(values.uShutter??0):0,logoScale:state.logoSize,uProgress:state.logoProgress,uLoop:Boolean(state.logoMotion),uBass:audio.bands[0],uMid:audio.bands[1],uHigh:audio.bands[2],uBeat:audio.beat%1});this.draw(program,this.targets[5],values,{inputImage:state.logoVisible&&this.hasLogo?this.logoTexture:this.emptyTexture,geometryImage:state.logoVisible&&this.hasLogo?this.geometryTexture:this.emptyTexture});}
 this.draw(this.copy,null,{opacity:state.logoOpacity},{image:this.targets[write].t,overlay:state.logoOpacity>.001?this.targets[5].t:this.emptyTexture});this.history=write;this.frames++;}
 destroy(){const g=this.gl;this.targets.forEach(t=>{g.deleteTexture(t.t);g.deleteFramebuffer(t.f);});g.deleteTexture(this.mediaTexture);g.deleteTexture(this.logoTexture);g.deleteTexture(this.geometryTexture);g.deleteTexture(this.emptyTexture);g.deleteBuffer(this.buffer);this.programs.forEach(p=>g.deleteProgram(p));this.shaders.forEach(s=>g.deleteShader(s));this.canvas.removeEventListener('webglcontextlost',this.onLost);}
}
