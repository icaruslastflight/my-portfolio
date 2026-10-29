// A short performance of the actual Pixel-Sort Alpha Streaks stinger, followed by the original artwork.
// Lazy initialization keeps the portfolio idle until the visitor interacts.
import {Renderer,isfProgram} from './render.mjs';
import {stingers} from './stingers.mjs';
const brand=document.querySelector('.topbar .brand');
const canvas=brand.querySelector('canvas');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,program,ready=false,failed=false,frame=0,start=0,loading;
const effect=stingers.find(e=>e.id==='glitch-pixelsort');
function stop(){cancelAnimationFrame(frame);frame=0;brand.classList.remove('effect-active');canvas.hidden=true;}
async function initialize(){
 if(loading)return loading;
 loading=new Promise(resolve=>{
  try{
   canvas.hidden=false;
   renderer=new Renderer(canvas,()=>{failed=true;stop();resolve(false);},true);
   program=renderer.program(isfProgram(effect));
   program.ints=new Set(effect.params.filter(p=>p.type==='long').map(p=>p.name));
   renderer.setLogo('/brand/primordial-studio.png',()=>{ready=true;canvas.hidden=true;resolve(true);});
  }catch{failed=true;stop();resolve(false);}
 });
 return loading;
}
function draw(now){
 const phase=Math.min(1,(now-start)/1400);
 const values=Object.fromEntries(effect.params.map(p=>[p.name,p.default]));
 Object.assign(values,{TIME:1.4,TIMEDELTA:1/30,logoScale:1,uGlitch:.65,uGlitchFreq:.484,uScanDensity:420,uChannelOffset:.008,uBeat:Math.max(.001,phase*.8),uAudioReact:0,uBass:0,uMid:0,uHigh:0});
 renderer.draw(program,null,values,{inputImage:renderer.logoTexture});
 if(phase<1)frame=requestAnimationFrame(draw);else stop();
}
async function play(){
 if(reduced.matches||failed||document.hidden||frame)return;
 if(!ready&&!await initialize())return;
 if(reduced.matches||!(brand.matches(':hover')||brand.matches(':focus-visible')))return;
 canvas.hidden=false;brand.classList.add('effect-active');start=performance.now();frame=requestAnimationFrame(draw);
}
brand.addEventListener('pointerenter',play);brand.addEventListener('focus',play);
brand.addEventListener('pointerleave',stop);brand.addEventListener('blur',stop);
reduced.addEventListener('change',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
window.addEventListener('pagehide',()=>{stop();renderer?.destroy();});
// Reuse the supplied Soap-Film shader on an alpha plate rendered in the real nav font.
const film=stingers.find(e=>e.id==='fluid-soapfilm');
let filmRenderer,filmProgram,filmFrame=0,filmToken=0,filmStart=0,filmHost;
const filmCanvas=document.createElement('canvas');filmCanvas.className='nav-film';filmCanvas.setAttribute('aria-hidden','true');
function stopFilm(){filmToken++;cancelAnimationFrame(filmFrame);filmFrame=0;filmHost?.classList.remove("film-active");filmCanvas.remove();filmHost=null;}
async function playFilm(link,span){
 if(reduced.matches)return;
 stopFilm();const token=filmToken;
 await document.fonts.ready;if(token!==filmToken)return;
 const style=getComputedStyle(span),plate=document.createElement('canvas'),c=plate.getContext('2d');
 const text=span.textContent;const font=`600 96px ${style.fontFamily}`;c.font=font;
 const m=c.measureText(text),inkWidth=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,inkHeight=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
 plate.width=Math.ceil(inkWidth+4);plate.height=Math.ceil(inkHeight+4);c.font=font;c.fillStyle='#ffffff';c.fillText(text,m.actualBoundingBoxLeft+2,m.actualBoundingBoxAscent+2);
 // Match the visible glyph width, including fonts with side bearings.
 const inkCSSWidth=inkWidth*parseFloat(style.fontSize)/96;
 const width=inkCSSWidth*1024/Math.min(700,330*inkWidth/inkHeight);
 filmCanvas.style.width=width+'px';filmCanvas.style.height=width*9/16+'px';span.append(filmCanvas);filmHost=link;
 try{
  if(!filmRenderer){filmRenderer=new Renderer(filmCanvas,stopFilm,true);filmProgram=filmRenderer.program(isfProgram(film));}
  filmRenderer.resize();
  filmRenderer.setLogo(plate.toDataURL(),()=>{
   if(token!==filmToken||reduced.matches)return;
   filmHost.classList.add("film-active");filmStart=performance.now();filmFrame=requestAnimationFrame(drawFilm);
  });
 }catch{stopFilm();}
}
function drawFilm(now){
 if(!filmHost||document.hidden||reduced.matches){stopFilm();return;}
 const t=(now-filmStart)/1000;
 const values=Object.fromEntries(film.params.map(p=>[p.name,p.default]));
 Object.assign(values,film.presets[1].values,{TIME:t+2,TIMEDELTA:1/30,logoScale:1,uTint:[.55,.35,1,1],uAudioReact:0,uBass:0,uMid:0,uHigh:0});
 filmRenderer.draw(filmProgram,null,values,{inputImage:filmRenderer.logoTexture});
 if(t<2.5)filmFrame=requestAnimationFrame(drawFilm);else stopFilm();
}
for(const link of document.querySelectorAll('.topbar nav a')){
 const span=document.createElement('span');span.className='nav-lettering';span.textContent=link.textContent;link.replaceChildren(span);
 link.addEventListener('pointerenter',()=>playFilm(link,span));link.addEventListener('focus',()=>playFilm(link,span));
 link.addEventListener('pointerleave',stopFilm);link.addEventListener('blur',stopFilm);
}
reduced.addEventListener('change',stopFilm);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFilm();});
window.addEventListener('pagehide',()=>{stopFilm();filmRenderer?.destroy();});
