import {seedGrains,stepGrain} from './sediment.mjs';
// Exact viewport pointer coordinates, a decaying stirred wake, and scroll-driven waves.
const canvas=document.createElement('canvas');canvas.className='liquid-background';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
if(gl){
 const resources=[];
 function program(vertex,fragment){const p=gl.createProgram();resources.push(['program',p]);for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){const s=gl.createShader(type);resources.push(['shader',s]);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
 try{
 const liquid=program(`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`,`precision highp float;
 uniform vec2 size,pointer;uniform float time,activity,scrollWave;uniform vec4 wakes[16];
 float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.02+5.1;a*=.5;}return n;}
 void main(){vec2 uv=gl_FragCoord.xy/size;float aspect=size.x/size.y;vec2 p=(uv-.5)*vec2(aspect,1.);vec2 mouse=(pointer-.5)*vec2(aspect,1.);
 float glow=exp(-dot(p-mouse,p-mouse)/.035)*activity;vec2 flow=vec2(0.);float wake=0.;
 for(int i=0;i<16;i++){vec2 d=p-(wakes[i].xy-.5)*vec2(aspect,1.);float age=max(0.,time-wakes[i].w);float strength=wakes[i].z*exp(-age*2.3);float g=exp(-dot(d,d)/(.008+age*.018))*strength;flow+=vec2(-d.y,d.x)*g*.8;wake+=g;}
 float wave=sin(uv.y*10.-time*3.2+sin(uv.x*3.)*.5)*scrollWave;
 p+=flow+vec2(wave*.075,sin(uv.x*5.+time)*scrollWave*.025);
 float t=time*.035;vec2 q=vec2(fbm(p*1.65+vec2(t,-t*.7)),fbm(p*1.65+vec2(4.3,-1.7)-t*.8));
 float localDetail=clamp(glow+min(wake*.35,1.),0.,1.);
 float field=fbm(p*2.2+q*2.8+flow*1.8);float film=field*11.+q.x*3.+wake*.6;
 // Finer contours are confined to the stirred region; the distant field stays soft.
 film+=localDetail*noise(p*13.+q*2.)*.65;
 vec3 purple=vec3(.28,.105,.4),green=vec3(.1,.32,.21);vec3 tint=mix(purple,green,.5+.5*sin(film));
 float ribbon=pow(.5+.5*sin(field*15.+q.y*3.),4.);vec3 base=vec3(.037,.046,.042);
 vec3 clearTint=mix(purple,green,smoothstep(.3,.7,.5+.5*sin(film)));
 float stirred=clamp(wake*.48+glow*.45,0.,1.);
 vec3 col=base+tint*(.23+.38*ribbon)+clearTint*stirred*(.18+.24*ribbon)+tint*abs(wave)*.16;
 col+=vec3((hash(gl_FragCoord.xy)-.5)/255.);gl_FragColor=vec4(col,1.);
 }`);
 const glitter=program(`attribute vec4 particle;attribute vec3 tint;varying vec3 color;varying float alpha;uniform float scale;
 void main(){gl_Position=vec4(particle.xy*2.-1.,0.,1.);gl_PointSize=particle.z*scale;color=tint;alpha=particle.w;}`,`precision mediump float;varying vec3 color;varying float alpha;
 void main(){vec2 d=gl_PointCoord-.5;float flake=1.-smoothstep(.12,.5,abs(d.x)*.85+abs(d.y));gl_FragColor=vec4(color*flake*alpha,1.);}`);
 const quad=gl.createBuffer(),dots=gl.createBuffer();resources.push(['buffer',quad],['buffer',dots]);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const u=Object.fromEntries(['size','pointer','time','activity','scrollWave','wakes[0]'].map(n=>[n,gl.getUniformLocation(liquid,n)]));
 const quadPos=gl.getAttribLocation(liquid,'p'),dotPos=gl.getAttribLocation(glitter,'particle'),dotTint=gl.getAttribLocation(glitter,'tint'),dotScale=gl.getUniformLocation(glitter,'scale');
 let frame=0,last=0,elapsed=0,lost=false,pointer=[.5,.5],inside=false,lastMove=0,previous=null,wakeIndex=0,scrollEnergy=0,pendingScroll=0,previousScroll=scrollY;
 const wakes=new Float32Array(64),particles=seedGrains(520);let surfaces=[];
 function resize(){const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(Math.min(r.width*.75,1440)));canvas.height=Math.max(1,Math.round(canvas.width*r.height/r.width));gl.viewport(0,0,canvas.width,canvas.height);previous=null;render(0);}
 function waveContent(){const amplitude=reduced.matches?0:scrollEnergy;const rects=surfaces.map(el=>el.getBoundingClientRect());surfaces.forEach((el,i)=>{const phase=rects[i].top/innerHeight*5.-elapsed*3.2;el.style.setProperty('--liquid-y',(Math.sin(phase)*amplitude*5).toFixed(2)+'px');el.style.setProperty('--liquid-skew',(Math.cos(phase)*amplitude*.22).toFixed(3)+'deg');});}
 function render(dt){
  gl.disable(gl.BLEND);gl.useProgram(liquid);gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.enableVertexAttribArray(quadPos);gl.vertexAttribPointer(quadPos,2,gl.FLOAT,false,0,0);
  gl.uniform2f(u.size,canvas.width,canvas.height);gl.uniform2f(u.pointer,...pointer);gl.uniform1f(u.time,elapsed);gl.uniform1f(u.activity,inside?1:0);gl.uniform1f(u.scrollWave,scrollEnergy);gl.uniform4fv(u['wakes[0]'],wakes);gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(quadPos);
  const points=[];for(const s of particles){stepGrain(s,dt,elapsed,wakes,canvas.width/canvas.height);const twinkle=.5+.5*Math.sin(elapsed*2.2+s.phase);const a=(.035+s.agitation*.62)*(.45+.55*twinkle);points.push(s.x,s.y,s.size*(1+s.agitation*.35),a,...s.color);}
  if(points.length){gl.useProgram(glitter);gl.bindBuffer(gl.ARRAY_BUFFER,dots);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(dotPos);gl.vertexAttribPointer(dotPos,4,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(dotTint);gl.vertexAttribPointer(dotTint,3,gl.FLOAT,false,28,16);gl.uniform1f(dotScale,canvas.width/canvas.getBoundingClientRect().width);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.drawArrays(gl.POINTS,0,points.length/7);gl.disableVertexAttribArray(dotTint);gl.disableVertexAttribArray(dotPos);gl.disable(gl.BLEND);}
 }
 function loop(now){frame=0;if(document.hidden||reduced.matches||lost)return;if(now-last>=32){const dt=Math.min((now-last)/1000,.08);last=now;elapsed+=dt;scrollEnergy=Math.max(-1,Math.min(1,scrollEnergy*Math.exp(-dt*4.5)+pendingScroll));pendingScroll=0;render(dt);waveContent();}frame=requestAnimationFrame(loop);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=performance.now();previous=null;if(reduced.matches){wakes.fill(0);particles.splice(0,particles.length,...seedGrains(520));scrollEnergy=pendingScroll=0;inside=false;waveContent();}if(!document.hidden&&!reduced.matches&&!lost)frame=requestAnimationFrame(loop);else if(!lost)render(0);}
 window.addEventListener('pointermove',e=>{
  if(reduced.matches||e.pointerType==='touch')return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=1-(e.clientY-r.top)/r.height,now=performance.now();pointer=[x,y];inside=true;
  if(previous){const dx=x-previous[0],dy=y-previous[1],distance=Math.hypot(dx*r.width,dy*r.height);if(distance>2){const strength=Math.min(1.4,.3+distance/65),count=Math.min(5,Math.ceil(distance/14));
   for(let j=1;j<=count;j++){const f=j/count,px=previous[0]+dx*f,py=previous[1]+dy*f;const index=wakeIndex++%16;wakes.set([px,py,strength,elapsed],index*4);

   }
  }}previous=[x,y];lastMove=now;
 },{passive:true});
 document.addEventListener('pointerleave',()=>{inside=false;previous=null;});
 window.addEventListener('scroll',()=>{const delta=scrollY-previousScroll;previousScroll=scrollY;if(!reduced.matches)pendingScroll+=delta/450;},{passive:true});
 function collect(){surfaces=[...document.querySelectorAll('.portfolio-intro,.portfolio-heading,.project-card,.about,.studio,footer')];surfaces.forEach(el=>el.classList.add('scroll-liquid'));}
 collect();const observer=new MutationObserver(collect);observer.observe(document.querySelector('#projects'),{childList:true});
 window.addEventListener('resize',resize);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);canvas.remove();surfaces.forEach(el=>el.classList.remove('scroll-liquid'));});
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();resources.forEach(([type,r])=>gl['delete'+type[0].toUpperCase()+type.slice(1)](r));});resize();sync();
 }catch(error){console.warn('Liquid background unavailable',error);canvas.remove();}
}else canvas.remove();
