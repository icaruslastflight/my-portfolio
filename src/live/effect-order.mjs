export const featuredEffectIds=['glitch-pixelsort','fluid-soapfilm','metal-acrylic','metal-crystal','metal-chrome','glitch-ledwall','fluid-shockwave','flora-watercolor'];
const names={sting:'Transitions',flora:'Organic',fluid:'Particles & fluids',metal:'Materials',glitch:'Glitch'};
export function effectGroups(catalog){
 const entries=catalog.map((effect,index)=>({effect,index})),featured=new Set(featuredEffectIds);
 return [{label:'Featured eight',entries:featuredEffectIds.map(id=>entries.find(entry=>entry.effect.id===id)).filter(Boolean)},...Object.entries(names).map(([id,label])=>({label,entries:entries.filter(entry=>entry.effect.category===id&&!featured.has(entry.effect.id))}))].filter(group=>group.entries.length);
}
