// Glitter exists throughout the liquid. Wakes move nearby grains; gravity settles them.
export function seedGrains(count,random=Math.random){return Array.from({length:count},()=>{const y=random();return{x:random(),y,bed:y-.045-random()*.055,vx:0,vy:0,agitation:0,moving:false,weight:.8+random()*.5,size:1.6+random()*3,phase:random()*6.283,color:random()>.5?[.55,.88,.36]:[.73,.36,.95]};});}
export function stepGrain(s,dt,time,wakes,aspect){
 let forceX=0,forceY=0,energy=0;
 for(let i=0;i<wakes.length;i+=4){const age=Math.max(0,time-wakes[i+3]);const dx=(s.x-wakes[i])*aspect,dy=s.y-wakes[i+1];const g=Math.exp(-(dx*dx+dy*dy)/(.008+age*.018))*wakes[i+2]*Math.exp(-age*2.3);energy+=g;forceX-=dy*g*4;forceY+=dx*g*4+g*.95;}
 energy=Math.min(energy,2);s.agitation=Math.max(s.agitation*Math.exp(-dt*4),Math.min(1,energy*.65));
 if(energy>.06)s.moving=true;
 if(s.moving){s.vx=(s.vx+forceX*dt)*Math.exp(-dt*3);s.vy=(s.vy+(forceY-.72*s.weight)*dt)*Math.exp(-dt*2.4);s.vy=Math.max(-.5,Math.min(.3,s.vy));s.x+=s.vx*dt/aspect;s.y+=s.vy*dt;
  if(s.y<s.bed&&energy<.08){s.y=s.bed;s.vx=s.vy=0;s.moving=false;s.bed=s.y-.06;}
  if(s.x<0)s.x+=1;if(s.x>1)s.x-=1;if(s.y<-.02){s.y=1.02;s.bed=s.y-.06;s.vx=s.vy=0;s.moving=false;}
 }
 return energy;
}
