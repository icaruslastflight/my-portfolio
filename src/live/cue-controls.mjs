export const cueAuditIds=['fluid-mercury','fluid-ash','fluid-ember','fluid-goldfill','fluid-frost','glitch-slicestagger','metal-glass','metal-forge'];
const cues={
 'fluid-mercury':{name:'uMelt',label:'Melt logo',autoStart:false},
 'fluid-ash':{name:'uDissolve',label:'Dissolve logo',autoStart:false,restore:0,help:'Dissolve logo plays an exit. Restore logo brings the artwork back.'},
 'fluid-ember':{name:'uBurn',label:'Burn logo',autoStart:false,restore:0,help:'Burn logo plays an exit. Restore logo brings the artwork back.'},
 'fluid-goldfill':{name:'uFill',label:'Fill logo'},
 'fluid-frost':{name:'uClear',label:'Clear frost'},
 'glitch-slicestagger':{name:'uStagger',label:'Settle slices'}
};
export function extraCueParameter(effect){const cue=cues[effect.id];return cue?{min:0,max:1,...cue}:null;}
