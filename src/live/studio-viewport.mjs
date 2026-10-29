// Keep the two-pane operator surface below the persistent navigation.
export function keepStudioPreviewVisible(studio,header){
 if(!studio.open)return;
 const workbench=studio.querySelector('.studio-layout'),rect=workbench.getBoundingClientRect(),headerBottom=header.getBoundingClientRect().bottom;
 if(rect.bottom<=headerBottom||rect.top>=innerHeight)return;
 if(rect.top<headerBottom+8)window.scrollBy({top:rect.top-headerBottom-8,behavior:'instant'});
 const controls=studio.querySelector('.lab-controls'),active=document.activeElement;
 if(controls.contains(active)){
  const pane=controls.getBoundingClientRect(),focus=active.getBoundingClientRect(),bottom=Math.min(innerHeight-12,pane.bottom-8),top=Math.max(headerBottom+8,pane.top+8);
  if(focus.bottom>bottom)controls.scrollTop+=focus.bottom-bottom;
  else if(focus.top<top)controls.scrollTop-=top-focus.top;
 }
}
export function watchStudioViewport(studio,header){
 let timer=0,pointerActive=false;
 const keep=()=>{
  clearTimeout(timer);
  // Native select/focus scrolling can run after the event; settle both panes afterward.
  timer=setTimeout(()=>{if(!pointerActive)keepStudioPreviewVisible(studio,header);},80);
 };
 studio.addEventListener('focusin',keep);
 studio.addEventListener('pointerdown',()=>{pointerActive=true;});
 const released=()=>{if(pointerActive){pointerActive=false;keep();}};
 window.addEventListener('pointerup',released);
 window.addEventListener('pointercancel',released);
 studio.addEventListener('click',keep);
 studio.addEventListener('input',keep);
 studio.addEventListener('change',keep);
 const observer=new ResizeObserver(()=>{const r=studio.getBoundingClientRect();if(studio.open&&r.top<innerHeight&&r.bottom>header.getBoundingClientRect().bottom)keep();});
 observer.observe(header);
 const resized=()=>{if(studio.contains(document.activeElement))keep();};
 window.addEventListener('resize',resized);
 window.visualViewport?.addEventListener('resize',resized);
 window.addEventListener('pagehide',()=>{clearTimeout(timer);observer.disconnect();window.removeEventListener('resize',resized);window.visualViewport?.removeEventListener('resize',resized);window.removeEventListener('pointerup',released);window.removeEventListener('pointercancel',released);});
}
