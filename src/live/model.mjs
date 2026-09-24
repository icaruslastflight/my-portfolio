/** Small, deterministic functions shared by the browser and tests. */
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(+x)?+x:a));
export const defaults={speed:1,zoom:1,rotation:0,hue:0,displacement:.08,sorting:0,threshold:.18,artifacts:0,feedback:.12,mosh:0,react:.45,mix:0,mirror:false};
export const ranges={speed:[0,2],zoom:[.5,2],rotation:[-180,180],hue:[-180,180],displacement:[0,1],sorting:[0,1],threshold:[0,1],artifacts:[0,1],feedback:[0,.92],mosh:[0,.94],react:[0,1],mix:[0,1]};
export const genres=[
 {id:'dnb',name:'Drum & bass',title:'Night transmission',bpm:172,swing:0,root:41,kick:[0,6,10],snare:[4,12],bass:[0,3,6,10,13]},
 {id:'house',name:'Gangsta house',title:'Concrete swing',bpm:126,swing:.08,root:38,kick:[0,4,8,12],snare:[4,12],bass:[2,5,7,10,14]},
 {id:'midtempo',name:'Midtempo',title:'Black circuit',bpm:100,swing:0,root:36,kick:[0,7,8,14],snare:[4,12],bass:[0,3,7,10,14]},
 {id:'140',name:'140 / halftime',title:'Sub architecture',bpm:140,swing:.035,root:41,kick:[0,6,11],snare:[8],bass:[0,5,9,14]},
 {id:'garage',name:'UK garage',title:'After-hours signal',bpm:132,swing:.22,root:43,kick:[0,6,10],snare:[4,12],bass:[0,3,7,10,13]}
];
export const scenes=['Monolith district','Portal sequence','Signal terrain','Chrome organism'];
export const presets={clean:{...defaults},fracture:{...defaults,displacement:.28,artifacts:.34,mosh:.4,hue:36},sort:{...defaults,sorting:.85,threshold:.12,feedback:.1,hue:-32},echo:{...defaults,feedback:.82,zoom:1.18,displacement:.15,react:.6},acid:{...defaults,hue:112,displacement:.6,sorting:.3,feedback:.42,artifacts:.17}};
export const sanitize=(input={})=>Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,k==='mirror'?Boolean(input[k]):clamp(input[k]??v,...ranges[k])]));
export function tapTempo(taps){if(taps.length<3)return null;const gaps=taps.slice(1).map((t,i)=>t-taps[i]).filter(t=>t>=.3&&t<=1.2).sort((a,b)=>a-b);if(gaps.length<2)return null;return Math.round(clamp(60/gaps[Math.floor(gaps.length/2)],50,200));}
export function spotifyEmbed(value){let url;try{url=new URL(value.trim());}catch{return null;}if(url.protocol!=='https:'||url.hostname!=='open.spotify.com'||url.username||url.password||url.port)return null;const match=url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(track|playlist|album)\/([A-Za-z0-9]{22})\/?$/);return match?`https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`:null;}
export function spectrumBands(data,sampleRate,fftSize){const average=(lo,hi)=>{const a=Math.max(0,Math.floor(lo*fftSize/sampleRate)),b=Math.min(data.length,Math.ceil(hi*fftSize/sampleRate));let sum=0;for(let i=a;i<b;i++)sum+=data[i];return sum/Math.max(1,b-a)/255;};return [average(30,180),average(180,2500),average(2500,12000)];}
export const bitonicStages=()=>{const passes=[];for(let k=2;k<=16;k*=2)for(let j=k/2;j>=1;j/=2)passes.push([k,j]);return passes;};
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
