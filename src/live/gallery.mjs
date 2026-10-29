import {esc} from './model.mjs';
const files={
 'republic-club':['youtube:6GY_e4yeLXw','RepublicClub-FloorReel-20250614.mp4','RepublicClub-FloorReel-20250402.mp4'],
 'van-gogh':['VanGogh1-StarryNight.jpg','VanGogh2-AlmondBlossoms.jpg','VanGogh3-Irises.webp','VanGogh4-PoemFloor.jpg'],
 'artechouse':['tunnel.jpg','Artechouse1.jpg','Artechouse2-anything.jpg','artechouse3-crt.jpg','Artechouse4.jpg'],
 'thexperience':['Primordial-featured-projection.png','TheXperience2-night.jpg','TheXperience1-statue-Day.jpg','TheXperience3-led-forest.jpg','TheXperience4-playa.jpg','TheXperience5-Playa.jpg','TheXperience6.jpg'],
 'gaussian-splatting':['GaussianSplats1-Pointcloud.mp4','GaussianSplats2-Capture-20251212.mp4','GaussianSplats3-DigitalFeedback.mp4','GaussianSplats4-Capture.mp4'],
 'story-portal':['Stage1-Storyportal1-action.jpg','Stage2-Storyportal2-night.jpg','Stage3-Storyportal3-design.jpg'],
 'homebass-hijinx':['Stage5-Homebass2-night.jpg','Stage4-Homebass1-CAD.jpg','Stage6-HiJinx1-render.jpg','Stage7-HiJinx2-CAD.jpg','Stage8-Gecko1.jpg','Stage9-Gecko2.jpg'],
 'lyric-gen':['LyricGen-signal-flow.svg','LyricGen-dashboard.jpg','LyricGen-resolume-stack.jpg'],
 'underground-stage':['Underground3.jpg','Underground1.jpg','Underground2.jpg','Underground4.jpg','Underground5.jpg','Underground6.jpg'],
 'bespoke-builds':['Setdesign1-hero.mp4','Setdesign2-Mural-flat.jpg','Setdesign3-portal-build.jpg','Setdesign4-me.jpg','Setdesign5-Wedding-bar.jpg']
};
const videoObserver=new IntersectionObserver(entries=>{for(const {target,isIntersecting} of entries){
 if(isIntersecting){if(!target.src||target.src==='about:blank')target.src=target.dataset.source;if(target.tagName==='VIDEO')target.play().catch(()=>{});}
 else if(target.tagName==='VIDEO')target.pause();else target.src='about:blank';
}},{rootMargin:'120px'});
export function mountGallery(container,project,{detail=false}={}){
 const items=files[project.id]||[project.media.replace('/media/','')];
 container.innerHTML='<div class="gallery-stage"></div><div class="gallery-strip" aria-label="Project media"></div><p class="gallery-caption"></p>';
 const stage=container.querySelector('.gallery-stage'),strip=container.querySelector('.gallery-strip'),caption=container.querySelector('.gallery-caption');
 let current,selected=0;
 const navigation=document.createElement("div");navigation.className="gallery-navigation";
 const previous=document.createElement("button"),next=document.createElement("button");
 previous.type=next.type="button";previous.textContent="← Previous";next.textContent="Next →";
 previous.setAttribute("aria-label",project.title+": previous media");next.setAttribute("aria-label",project.title+": next media");
 navigation.append(previous,next);stage.after(navigation);
 if(detail){container.tabIndex=0;container.setAttribute("aria-label",project.title+" gallery. Use left and right arrow keys to browse.");}
 caption.setAttribute("aria-live","polite");
 const select=index=>{
  selected=(index+items.length)%items.length;index=selected;
  if(current){videoObserver.unobserve(current);current.pause?.();if(current.tagName==='VIDEO'){current.removeAttribute('src');current.load();}if(current.tagName==='IFRAME')current.src='about:blank';}
  const file=items[index],youtube=file.startsWith('youtube:'),video=file.endsWith('.mp4');
  const mediaLabels={"VanGogh1-StarryNight.jpg":"Starry Night projection room","VanGogh2-AlmondBlossoms.jpg":"Almond Blossoms projection","VanGogh3-Irises.webp":"Irises projection","VanGogh4-PoemFloor.jpg":"Floor projection detail","Stage4-Homebass1-CAD.jpg":"Home Bass · CAD planning study","Stage6-HiJinx1-render.jpg":"HiJinx · stage visualization","Stage7-HiJinx2-CAD.jpg":"HiJinx · CAD planning study","Setdesign2-Mural-flat.jpg":"Studio scenic mural","Setdesign3-portal-build.jpg":"Portal fabrication","TheXperience1-statue-Day.jpg":"Sculptural surface in daylight","TheXperience3-led-forest.jpg":"Lighting within the landscape"};
  const title=mediaLabels[file]|| (youtube?'Republic Club · featured YouTube video':project.id==='bespoke-builds'&&index===0?'My studio VJ video':project.id==='lyric-gen'&&index>0?'Interface concept — not an application screenshot':project.title+' · '+(video?'Video':'Gallery image')+' '+(index+1));
  current=document.createElement(youtube?'iframe':video?'video':'img');
  if(youtube){const id=file.slice(8);current.dataset.source=`https://www.youtube-nocookie.com/embed/${id}?start=17&autoplay=1&mute=1&loop=1&playlist=${id}&playsinline=1&rel=0`;current.title=title;current.allow='autoplay; encrypted-media; picture-in-picture';current.allowFullscreen=true;current.referrerPolicy='strict-origin-when-cross-origin';videoObserver.observe(current);}
  else if(video){current.dataset.source='/media/'+file;current.muted=true;current.loop=true;current.playsInline=true;current.autoplay=true;current.controls=detail;current.preload='metadata';if(index===0&&project.poster)current.poster=project.poster;videoObserver.observe(current);}
  else{current.src='/media/'+file;current.alt=title;current.loading='lazy';current.decoding='async';}
  stage.replaceChildren(current);caption.textContent=`${index+1} / ${items.length} · ${title}`;
  strip.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(index===i)));
 };
 items.forEach((file,index)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`${project.title}: media ${index+1} of ${items.length}`);b.className='gallery-thumb';
  if(file.startsWith('youtube:'))b.innerHTML='<span>▶</span><small>YouTube</small>';
  else if(file.endsWith('.mp4'))b.innerHTML=`<span>▶</span><small>Film ${index+1}</small>`;
  else b.innerHTML=`<img src="/media/${esc(file)}" alt="" loading="lazy" decoding="async">`;
  b.onclick=e=>{e.stopPropagation();select(index);};strip.append(b);
 });
 previous.onclick=e=>{e.stopPropagation();select(selected-1);};next.onclick=e=>{e.stopPropagation();select(selected+1);};
 const onKey=e=>{if(e.target!==container)return;if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();select(selected+(e.key==="ArrowRight"?1:-1));}};
 container.addEventListener("keydown",onKey);select(0);
 return ()=>{container.removeEventListener("keydown",onKey);if(current){videoObserver.unobserve(current);current.pause?.();if(current.tagName==='VIDEO'){current.removeAttribute('src');current.load();}if(current.tagName==='IFRAME')current.src='about:blank';}};
}
