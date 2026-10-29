// Low-resolution liquid field. Pointer influence is damped; the portfolio stays foreground.
const canvas=document.createElement('canvas');canvas.className='liquid-background';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
if(gl){
 const vertex=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
 const fragment=`precision highp float;uniform vec2 size,pointer;uniform float time,activity;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.02+5.1;a*=.5;}return n;}
 void main(){vec2 uv=gl_FragCoord.xy/size;float aspect=size.x/size.y;vec2 p=(uv-.5)*vec2(aspect,1.);vec2 mouse=(pointer-.5)*vec2(aspect,1.);vec2 d=p-mouse;float influence=exp(-dot(d,d)*2.8);p+=vec2(-d.y,d.x)*influence*.55*activity;float t=time*.045;
 vec2 q=vec2(fbm(p*1.65+vec2(t,-t*.7)),fbm(p*1.65+vec2(4.3,-1.7)-t*.8));
 float field=fbm(p*2.2+q*2.8+vec2(t*.4,-t*.3));float film=field*9.+q.x*3.;
 vec3 purple=vec3(.19,.075,.27),green=vec3(.09,.22,.15),pearl=vec3(.24,.23,.28);
 vec3 tint=mix(purple,green,.5+.5*sin(film));tint=mix(tint,pearl,pow(.5+.5*sin(film*1.7+1.2),8.)*.4);
 float ribbon=pow(.5+.5*sin(field*15.+q.y*3.),5.);vec3 base=vec3(.047,.058,.052);
 float nearMouse=influence*activity;
 vec2 glitterUV=p*100.;vec2 cell=floor(glitterUV),local=fract(glitterUV)-.5;float seed=hash(cell);
 float sparse=step(.992,seed);float twinkle=pow(.5+.5*sin(time*.9+seed*91.),6.);
 float glint=exp(-dot(local,local)*130.)+.3*(exp(-abs(local.x)*160.-abs(local.y)*22.)+exp(-abs(local.y)*160.-abs(local.x)*22.));
 vec3 shimmer=vec3(.65,.75,.55)*glint*sparse*twinkle*nearMouse*.22;
 gl_FragColor=vec4(base+tint*(.14+.22*ribbon+.24*nearMouse)+shimmer+vec3((hash(gl_FragCoord.xy)-.5)/255.),1.);
 }`;
 const program=gl.createProgram();let valid=true;
 for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))valid=false;gl.attachShader(program,shader);}
 gl.linkProgram(program);valid=valid&&gl.getProgramParameter(program,gl.LINK_STATUS);
 if(valid){
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  const size=gl.getUniformLocation(program,'size'),point=gl.getUniformLocation(program,'pointer'),time=gl.getUniformLocation(program,'time'),activity=gl.getUniformLocation(program,'activity');
  let target=[.5,.5],mouse=[.5,.5],frame=0,last=0,elapsed=0,lost=false,presence=0,targetPresence=0;
  function resize(){canvas.width=Math.max(1,Math.round(Math.min(innerWidth*.5,960)));canvas.height=Math.max(1,Math.round(canvas.width*innerHeight/innerWidth));gl.viewport(0,0,canvas.width,canvas.height);render();}
  function render(){gl.uniform2f(size,canvas.width,canvas.height);gl.uniform2f(point,...mouse);gl.uniform1f(time,elapsed);gl.uniform1f(activity,presence);gl.drawArrays(gl.TRIANGLES,0,6);}
  function loop(now){frame=0;if(document.hidden||reduced.matches||lost)return;if(now-last>40){const delta=Math.min((now-last)/1000,.08);last=now;elapsed+=delta;presence+=(targetPresence-presence)*.045;mouse=mouse.map((v,i)=>v+(target[i]-v)*.045);render();}frame=requestAnimationFrame(loop);}
  function sync(){cancelAnimationFrame(frame);frame=0;last=performance.now();if(!document.hidden&&!reduced.matches&&!lost)frame=requestAnimationFrame(loop);else if(!lost)render();}
  window.addEventListener('pointermove',e=>{if(!reduced.matches&&e.pointerType!=='touch'){target=[e.clientX/innerWidth,1-e.clientY/innerHeight];targetPresence=1;}},{passive:true});
  document.addEventListener('pointerleave',()=>{target=[.5,.5];targetPresence=0;});window.addEventListener('resize',resize);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);canvas.remove();});window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));resize();sync();
 }else canvas.remove();
}else canvas.remove();

