// One shared WebGL surface, eight audited looks, hover lettering and an automatic logo loop.
import {Renderer,isfProgram} from './render.mjs';
import {stingers} from './stingers.mjs';
export const hoverEffects=['glitch-pixelsort','fluid-soapfilm','metal-acrylic','flora-engrave','glitch-ledwall','glitch-halftone','fluid-ash','fluid-shockwave'];
const textEffects=['glitch-ledwall','fluid-soapfilm','metal-acrylic','metal-chrome','metal-glass','metal-holo','metal-anodized','metal-guilloche'];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const canvas=document.createElement('canvas');canvas.className='hover-shader';canvas.setAttribute('aria-hidden','true');
const seen=new WeakSet(),cycles=new WeakMap(),programs=new Map();
let effectTarget,outputProgram,outputSize,cropRect;
let renderer,active=null,frame=0,token=0,start=0,current,order=0,lastFrame=0,logoVisible=false,logoTimer;
const brand=document.querySelector('.topbar .brand');
function scheduleLogo(){clearTimeout(logoTimer);if(logoVisible&&!reduced.matches&&!document.hidden)logoTimer=setTimeout(()=>{if(!active)play(brand);},1400);}
document.querySelector('.brand-effect')?.remove();
function stop(){token++;cancelAnimationFrame(frame);frame=0;active?.classList.remove('hover-rendering');canvas.remove();active=null;scheduleLogo();}
function rasterText(el,rect,pad,scale){
 const plate=document.createElement('canvas');plate.width=Math.ceil((rect.width+pad*2)*scale);plate.height=Math.ceil((rect.height+pad*2)*scale);
 const c=plate.getContext('2d');c.scale(scale,scale);
 const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,s=getComputedStyle(node.parentElement);
  c.font=`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;c.fillStyle=s.color;c.letterSpacing=s.letterSpacing==='normal'?'0px':s.letterSpacing;
  const metrics=c.measureText('Mg');
  for(let i=0;i<node.length;i++){
   if(!node.data[i].trim())continue;
   const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const r=range.getBoundingClientRect();
   if(!r.width||!r.height)continue;
   const baseline=r.top-rect.top+pad+(r.height-metrics.fontBoundingBoxAscent-metrics.fontBoundingBoxDescent)/2+metrics.fontBoundingBoxAscent;
   const ch=s.textTransform==='uppercase'?node.data[i].toUpperCase():s.textTransform==='lowercase'?node.data[i].toLowerCase():node.data[i];
   c.fillText(ch,r.left-rect.left+pad,baseline);
  }
 }
 return plate;
}
async function play(el){
 if(reduced.matches||document.hidden||el===active)return;
 stop();clearTimeout(logoTimer);const ticket=token;await document.fonts.ready;
 if(ticket!==token||reduced.matches)return;
 const host=el.getBoundingClientRect();let rect=host;
 if(!el.classList.contains('brand')){
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),boxes=[];
  while(walker.nextNode()){if(!walker.currentNode.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(walker.currentNode);boxes.push(...range.getClientRects());}
  if(boxes.length){const left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top)),right=Math.max(...boxes.map(r=>r.right)),bottom=Math.max(...boxes.map(r=>r.bottom));rect={left,top,width:right-left,height:bottom-top};}
 }
 if(!rect.width||!rect.height)return;
 const isLogo=el.classList.contains('brand'),pad=isLogo?0:14;
 const scale=Math.min(devicePixelRatio||1,2,1440/(rect.width+pad*2));
 let plate;
 if(isLogo){
  const img=el.querySelector('img');try{await img.decode();}catch{return;}if(ticket!==token)return;
  plate=document.createElement('canvas');plate.width=Math.ceil(rect.width*scale);plate.height=Math.ceil(rect.height*scale);const c=plate.getContext('2d');c.scale(scale,scale);
  const r=img.getBoundingClientRect();c.drawImage(img,r.left-rect.left,r.top-rect.top,r.width,r.height);
 }else plate=rasterText(el,rect,pad,scale);
 if(ticket!==token)return;
 const idx=cycles.get(el)||0;cycles.set(el,(idx+1)%hoverEffects.length);current=stingers.find(e=>e.id===(isLogo?hoverEffects:textEffects)[idx]);
 canvas.style.cssText=`left:${rect.left-host.left-pad}px;top:${rect.top-host.top-pad}px;width:${rect.width+pad*2}px;height:${rect.height+pad*2}px`;
 el.append(canvas);active=el;
 try{
  if(!renderer)renderer=new Renderer(canvas,stop,true);
  if(renderer.lost){stop();return;}
  outputSize=[plate.width,plate.height];
  // Keep the source's complete bounds inside the authored 16:9 stage, then crop
  // the finished result back to the exact text box. Glyphs retain their proportions.
  const canonical=document.createElement('canvas');canonical.width=1024;canonical.height=576;
  const fit=Math.min(700/plate.width,330/plate.height),w=plate.width*fit,h=plate.height*fit,x=(1024-w)/2,y=(576-h)/2;
  canonical.getContext('2d').drawImage(plate,x,y,w,h);
  cropRect=[x/1024,y/576,w/1024,h/576];plate=canonical;
  renderer.w=1024;renderer.h=576;
  if(!effectTarget)effectTarget=renderer.target();
  if(!outputProgram)outputProgram=renderer.program(`precision highp float;varying vec2 uv;uniform sampler2D image;uniform vec4 cropRect;void main(){gl_FragColor=texture2D(image,cropRect.xy+uv*cropRect.zw);}`);
  canvas.width=outputSize[0];canvas.height=outputSize[1];
  const cacheKey=current.id+(isLogo?':logo':':text');let program=programs.get(cacheKey);if(!program){let adapted=isfProgram(current);if(!isLogo&&current.id==='glitch-pixelsort')adapted=adapted.replace(/float gate =[^;]+;/,'float gate = 1.0;');const shader=adapted.replace(/void\s+main\s*\(\s*\)/,'void hoverEffectMain()')+`
uniform float hoverMix;
void main(){hoverEffectMain();vec4 original=samplePlate(inputImage,isf_FragNormCoord);gl_FragColor=mix(original,mix(gl_FragColor,original,${isLogo?'0.0':'0.14'}*original.a),hoverMix);}`;program=renderer.program(shader);program.ints=new Set(current.params.filter(p=>p.type==='long').map(p=>p.name));programs.set(cacheKey,program);}current={...current,program};
  const g=renderer.gl;g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,renderer.logoTexture);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,true);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,plate);
  el.dataset.hoverEffect=current.id;start=performance.now();lastFrame=0;frame=requestAnimationFrame(draw);
 }catch(error){console.warn('Hover shader unavailable',current?.id,error);stop();}
}
function draw(now){
 if(!active||!active.isConnected||document.hidden||reduced.matches){stop();return;}
 const t=(now-start)/1000,p=Math.min(t/4.5,1),pulse=Math.sin(Math.PI*p);
 if(now-lastFrame<32){frame=requestAnimationFrame(draw);return;}lastFrame=now;
 const values=Object.fromEntries(current.params.map(p=>[p.name,p.default]));
 Object.assign(values,{TIME:t+1.4,TIMEDELTA:1/30,logoScale:1,uAudioReact:0,uBass:0,uMid:0,uHigh:0,uTint:[.68,.4,1,1],uTint2:[.58,1,.24,1],uLumaKey:false,hoverMix:Math.max(0,Math.min(1,t/.15,(5-t)/.45))});
 switch(current.id){
 case 'glitch-pixelsort':Object.assign(values,{TIME:1.4,uGlitch:.58,uGlitchFreq:.484,uScanDensity:420,uChannelOffset:.006,uBeat:Math.max(.001,((t%2.5)/2.5)*.8)});break;
 case 'fluid-soapfilm':Object.assign(values,{uGravityWell:.15,uBounce:.15,uTurbScale:1.6,uLifespan:4.5});break;
 case 'metal-chrome':case 'metal-glass':case 'metal-holo':case 'metal-anodized':case 'metal-guilloche':Object.assign(values,{uDepth:.025,uBevel:.006,uRoughness:.22,uFresnel:1.1,uTint:[.82,.88,.76,1]});break;
 case 'metal-acrylic':Object.assign(values,{uSettle:1-.5*pulse,uLayers:1,uDepth:.012,uBevel:.003});break;
 case 'flora-engrave':Object.assign(values,{uGrowth:100-40*pulse,uLineDensity:12,uTint:[.65,1,.35,1]});break;
 case 'glitch-ledwall':Object.assign(values,{uResolve:1-.65*pulse,uBloom:.15,uGlitch:.18,uScanDensity:600});break;
 case 'glitch-halftone':Object.assign(values,{TIME:1.4,uGlitch:.5*pulse,uScanDensity:900,uChannelOffset:.002,uBeat:.12});break;
 case 'fluid-ash':Object.assign(values,{uDissolve:.12*pulse,uTint:[.68,.4,1,1]});break;
 case 'fluid-shockwave':Object.assign(values,{uBeat:Math.min(.99,p),uBounce:.12,uGravityWell:.3,uTurbScale:1.5,uTint:[.6,1,.3,1]});break;
 }
 renderer.w=1024;renderer.h=576;
 renderer.draw(current.program,effectTarget,values,{inputImage:renderer.logoTexture});
 renderer.w=outputSize[0];renderer.h=outputSize[1];
 renderer.draw(outputProgram,null,{cropRect},{image:effectTarget.t});
 if(!active.classList.contains('hover-rendering'))active.classList.add('hover-rendering');
 // Blend back to the native lettering before removing the surface.
 canvas.style.opacity="1";
 if(t<5)frame=requestAnimationFrame(draw);else stop();
}
function attach(){
 for(const el of document.querySelectorAll('.topbar .brand,.topbar nav a,h1,h2,h3,h4,h5,h6,p,strong,span,a,button')){
  if(seen.has(el))continue;if(!el.matches('.brand,.topbar nav a,h1,h2,h3,h4,h5,h6')&&!(parseFloat(getComputedStyle(el).fontSize)>=24&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())))continue;seen.add(el);el.classList.add('hover-surface');
  cycles.set(el,el.classList.contains('brand')?0:el.matches('.topbar nav a')?1+(order++%7):(order++%8));
  el.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')play(el);});
  el.addEventListener('pointerleave',()=>{if(active===el&&el!==brand)stop();});
  el.addEventListener('focus',()=>play(el));el.addEventListener('blur',()=>{if(active===el)stop();});
 }
}
attach();const observer=new MutationObserver(attach);observer.observe(document.body,{subtree:true,childList:true});
const logoObserver=new IntersectionObserver(([entry])=>{logoVisible=entry.isIntersecting;if(!logoVisible&&active===brand)stop();else if(!active)scheduleLogo();});logoObserver.observe(brand);
reduced.addEventListener('change',stop);window.addEventListener('resize',stop);window.addEventListener('blur',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else scheduleLogo();});
window.addEventListener('pagehide',()=>{logoVisible=false;stop();clearTimeout(logoTimer);logoObserver.disconnect();observer.disconnect();if(effectTarget&&renderer){renderer.gl.deleteTexture(effectTarget.t);renderer.gl.deleteFramebuffer(effectTarget.f);}renderer?.destroy();});
