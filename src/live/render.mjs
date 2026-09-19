import {bitonicStages} from './model.mjs';
const vertex=`attribute vec2 pos;varying vec2 uv;void main(){uv=pos*.5+.5;gl_Position=vec4(pos,0.,1.);}`;
const common=`precision highp float;varying vec2 uv;uniform vec2 resolution;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}`;
const source=common+`
uniform sampler2D media;uniform float time,scene,zoom,rotation,hue,displacement,react,energy,beat,mirror,hasMedia,mixAmount,mediaAspect;
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float map(vec3 p){
 if(scene<.5){vec2 cell=floor((p.xz+1.)/2.);float h=.55+hash(cell)*3.2;vec3 q=vec3(mod(p.x+1.,2.)-1.,p.y-h*.5,mod(p.z+1.,2.)-1.);return min(p.y,box(q,vec3(.65,h*.5,.64)));}
 if(scene<1.5){vec3 q=p;q.z=mod(q.z+1.6,3.2)-1.6;q.xy=rot(sin(p.z*.18+time*.13)*.3)*q.xy;float frame=length(vec2(abs(max(abs(q.x),abs(q.y))-1.65),q.z))-.09;return min(frame,p.y+2.2);}
 if(scene<2.5){float h=sin(p.x*1.05+time*.25)*.36+cos(p.z*.7)*.45+sin(p.x*2.+p.z*.4)*.10;return (p.y-h)*.65;}
 vec3 q=p-vec3(0.,.2,0.);q.xy=rot(time*.1)*q.xy;q.xz=rot(.5+time*.08)*q.xz;vec2 t=vec2(length(q.xz)-1.25,q.y);return min(length(t)-(.38+.05*sin(atan(q.z,q.x)*7.+time)),p.y+1.8);
}
vec3 palette(float x){return .5+.5*cos(6.28318*(vec3(.17,.07,.25)+x*.22+hue/360.));}
void main(){
 vec2 p=(uv-.5)*vec2(resolution.x/resolution.y,1.);p=rot(rotation*.0174533)*p/zoom;if(mirror>.5)p.x=abs(p.x);
 float pulse=exp(-fract(beat)*5.)*react;float d=displacement*(.18+energy*.22*react);p+=vec2(sin(p.y*10.+time*.7),cos(p.x*8.-time*.6))*d*.2;p*=1.-pulse*.025;
 vec3 ro,ta;
 if(scene<.5){ro=vec3(3.8+sin(time*.06)*1.8,4.8,time*.38+6.);ta=ro+vec3(-1.8,-2.4,-4.2);}
 else if(scene<1.5){ro=vec3(sin(time*.1)*.15,.05,-time*.6);ta=ro+vec3(0.,0.,-5.);}
 else if(scene<2.5){ro=vec3(1.,3.3,time*.38+4.);ta=ro+vec3(-.2,-1.5,-4.);}
 else{ro=vec3(3.7,2.5,4.5);ta=vec3(0.,.1,0.);}
 vec3 f=normalize(ta-ro),r=normalize(cross(f,vec3(0.,1.,0.))),up=cross(r,f),rd=normalize(f*1.65+r*p.x*2.+up*p.y*2.);
 float dist=0.,hit=0.;vec3 pt=ro;
 for(int i=0;i<88;i++){pt=ro+rd*dist;float s=map(pt);if(s<.009){hit=1.;break;}dist+=min(max(s,.005),scene<.5?.38:1.);if(dist>34.)break;}
 vec3 col=vec3(.034,.047,.041)+vec3(.026,.043,.038)*(1.-uv.y);
 if(hit>.5){vec2 e=vec2(.015,0.);vec3 n=normalize(vec3(map(pt+e.xyy)-map(pt-e.xyy),map(pt+e.yxy)-map(pt-e.yxy),map(pt+e.yyx)-map(pt-e.yyx)));float lighting=.28+max(0.,dot(n,normalize(vec3(-.6,1.,.3))))*.65;vec3 base=palette(hash(floor(pt.xz*.5)));
 float grid=0.;
 if(scene<.5){vec2 w=abs(fract(vec2(pt.x+pt.z,pt.y)*vec2(5.,4.))-.5);grid=(1.-smoothstep(.035,.075,min(w.x,w.y)))*(1.-abs(n.y));base=mix(vec3(.19,.25,.22),base,.28);col=base*lighting+palette(.0)*grid*.42;float topLine=1.-smoothstep(.03,.08,abs(map(pt+vec3(0.,.08,0.))));col+=topLine*vec3(.07,.11,.06);}
 else if(scene<1.5){col=palette(pt.z*.07)*lighting;col+=palette(.2)*pow(max(0.,1.-abs(dot(n,-rd))),3.)*.65;}
 else if(scene<2.5){vec2 g=abs(fract(pt.xz*1.3)-.5);grid=1.-smoothstep(.018,.04,min(g.x,g.y));col=vec3(.05,.10,.09)*lighting+palette(.1)*grid*.72;}
 else{float fres=pow(1.-max(0.,dot(n,-rd)),2.);col=mix(vec3(.16,.20,.19),palette(n.y*.8),.55)*lighting+fres*vec3(.5,.65,.47);float line=1.-smoothstep(.02,.055,abs(fract((pt.y+pt.x*.25)*12.)-.5));col+=line*.10;}
 col=mix(col,vec3(.035,.05,.045),1.-exp(-dist*.043));
 }
 if(hasMedia>.5){vec2 tc=p/vec2(resolution.x/resolution.y,1.)+.5;float aspect=resolution.x/resolution.y;if(mediaAspect>aspect)tc.x=(tc.x-.5)*aspect/mediaAspect+.5;else tc.y=(tc.y-.5)*mediaAspect/aspect+.5;vec3 m=texture2D(media,clamp(tc,0.,1.)).rgb;float angle=hue*.0174533;vec3 axis=normalize(vec3(1.));m=m*cos(angle)+cross(axis,m)*sin(angle)+axis*dot(axis,m)*(1.-cos(angle));col=mix(col,m,mixAmount);}
 col*=.82+.18*pow(max(0.,1.-length(uv-.5)),.6);gl_FragColor=vec4(clamp(col,0.,.91),1.);
}`;
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
const copy=common+`uniform sampler2D image;void main(){gl_FragColor=texture2D(image,uv);}`;
/** Render graph: source -> optional 16-pixel bitonic sort -> temporal feedback -> output. */
export class Renderer {
 constructor(canvas,onFailure=()=>{}){this.canvas=canvas;this.onFailure=onFailure;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power',preserveDrawingBuffer:false});if(!this.gl)throw Error('WebGL unavailable');const g=this.gl;this.programs=[];this.shaders=[];this.targets=[];this.source=this.program(source);this.sort=this.program(sorting);this.composite=this.program(composite);this.copy=this.program(copy);this.buffer=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),g.STATIC_DRAW);this.mediaTexture=this.texture();this.media=null;this.mediaAspect=1;this.frames=0;this.draws=0;this.lost=false;this.onLost=e=>{e.preventDefault();this.lost=true;onFailure('Graphics context lost. Reload to restore the visual engine.');};canvas.addEventListener('webglcontextlost',this.onLost);this.resize();}
 program(fragment){const g=this.gl,p=g.createProgram();this.programs.push(p);for(const [type,code] of [[g.VERTEX_SHADER,vertex],[g.FRAGMENT_SHADER,fragment]]){const s=g.createShader(type);this.shaders.push(s);g.shaderSource(s,code);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));g.attachShader(p,s);}g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));return {p,uniforms:new Map()};}
 texture(){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));return t;}
 target(){const g=this.gl,t=this.texture(),f=g.createFramebuffer();g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,this.w,this.h,0,g.RGBA,g.UNSIGNED_BYTE,null);g.bindFramebuffer(g.FRAMEBUFFER,f);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,t,0);if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw Error('Framebuffer allocation failed');return {t,f};}
 resize(){const rect=this.canvas.getBoundingClientRect(),w=Math.max(256,Math.floor(Math.min(960,rect.width||640)/16)*16),h=Math.round(w*9/16);if(w===this.w)return;const g=this.gl;this.targets.forEach(t=>{g.deleteTexture(t.t);g.deleteFramebuffer(t.f);});this.w=w;this.h=h;this.canvas.width=w;this.canvas.height=h;this.targets=Array.from({length:5},()=>this.target());this.history=3;this.clear();}
 clear(){const g=this.gl;g.clearColor(0,0,0,1);this.targets.forEach(t=>{g.bindFramebuffer(g.FRAMEBUFFER,t.f);g.clear(g.COLOR_BUFFER_BIT);});g.bindFramebuffer(g.FRAMEBUFFER,null);}
 setMedia(element){this.media=element;this.mediaAspect=element?(element.videoWidth||element.naturalWidth||1)/(element.videoHeight||element.naturalHeight||1):1;}
 draw(program,target,uniforms={},textures={}){const g=this.gl;g.bindFramebuffer(g.FRAMEBUFFER,target?.f||null);g.viewport(0,0,this.w,this.h);g.useProgram(program.p);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);const a=g.getAttribLocation(program.p,'pos');g.enableVertexAttribArray(a);g.vertexAttribPointer(a,2,g.FLOAT,false,0,0);const loc=name=>{if(!program.uniforms.has(name))program.uniforms.set(name,g.getUniformLocation(program.p,name));return program.uniforms.get(name);};g.uniform2f(loc('resolution'),this.w,this.h);for(const [key,val] of Object.entries(uniforms))g.uniform1f(loc(key),val);let unit=0;for(const [key,tex] of Object.entries(textures)){g.activeTexture(g.TEXTURE0+unit);g.bindTexture(g.TEXTURE_2D,tex);g.uniform1i(loc(key),unit++);}g.drawArrays(g.TRIANGLES,0,6);this.draws++;}
 render(state,time,audio,burst=0){if(this.lost)return;const g=this.gl;let ready=false;if(this.media){ready=this.media.tagName==='VIDEO'?this.media.readyState>=2:this.media.complete&&this.media.naturalWidth>0;if(ready){g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.mediaTexture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);try{g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,this.media);}catch{this.media=null;ready=false;this.onFailure('Media could not be sampled. Only local or same-origin media is supported.');}}}
 const energy=audio.bands[0],u={time:time*state.speed,scene:state.scene,zoom:state.zoom,rotation:state.rotation,hue:state.hue,displacement:state.displacement,react:state.react,energy,beat:audio.beat,mirror:state.mirror?1:0,hasMedia:ready?1:0,mixAmount:state.mix,mediaAspect:this.mediaAspect};
 this.draw(this.source,this.targets[0],u,{media:this.mediaTexture});let sorted=this.targets[0];if(state.sorting>.001){let index=1;for(const [k,j] of bitonicStages()){this.draw(this.sort,this.targets[index],{k,j,threshold:state.threshold},{image:sorted.t});sorted=this.targets[index];index=index===1?2:1;}}
 const write=this.history===3?4:3;this.draw(this.composite,this.targets[write],{time,energy,react:state.react,sortingAmount:state.sorting,artifacts:state.artifacts,feedback:state.feedback,mosh:state.mosh,burst},{image:this.targets[0].t,sorted:sorted.t,history:this.targets[this.history].t});this.draw(this.copy,null,{}, {image:this.targets[write].t});this.history=write;this.frames++;}
 destroy(){const g=this.gl;this.targets.forEach(t=>{g.deleteTexture(t.t);g.deleteFramebuffer(t.f);});g.deleteTexture(this.mediaTexture);g.deleteBuffer(this.buffer);this.programs.forEach(p=>g.deleteProgram(p));this.shaders.forEach(s=>g.deleteShader(s));this.canvas.removeEventListener('webglcontextlost',this.onLost);}
}
