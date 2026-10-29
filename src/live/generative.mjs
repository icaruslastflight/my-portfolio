// Four original, continuous source studies. Audio changes geometry, never a flash gate.
export const generativeGLSL=`
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float n=dot(i,vec3(1.,57.,113.));return mix(mix(mix(fract(sin(n)*43758.5),fract(sin(n+1.)*43758.5),f.x),mix(fract(sin(n+57.)*43758.5),fract(sin(n+58.)*43758.5),f.x),f.y),mix(mix(fract(sin(n+113.)*43758.5),fract(sin(n+114.)*43758.5),f.x),mix(fract(sin(n+170.)*43758.5),fract(sin(n+171.)*43758.5),f.x),f.y),f.z);}
float fbm3(vec3 p){float f=0.,a=.5;for(int i=0;i<4;i++){f+=a*noise3(p);p=p*2.03+vec3(3.1,1.7,9.2);a*=.5;}return f;}
vec3 palette(float f){return mix(vec3(.38,.065,.82),vec3(.55,1.,.12),smoothstep(.2,.85,f));}
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float liquid(vec3 p,float t,float drive){float d=length(p)-.65;for(int i=0;i<4;i++){float k=float(i);vec3 c=vec3(sin(t*.31+k*2.1),cos(t*.27+k*1.7),sin(t*.23+k*2.9))*(.65+drive*.2);d=smin(d,length(p-c)-(.39+drive*.12),.4);}return d;}
float tunnel(vec3 p,float t,float drive){p.xy=rot(p.z*.24+sin(t*.12)*.3)*p.xy;float sector=6.2831853/6.;float angle=atan(p.y,p.x);float polygon=length(p.xy)*cos(mod(angle+sector*.5,sector)-sector*.5);float z=mod(p.z,1.15)-.575;float rad=1.08+sin(p.z*.7+t*.2)*.08+drive*.08;return length(vec2(polygon-rad,z))-.045;}

vec3 environment(vec3 r,float t){float strips=pow(.5+.5*sin(atan(r.z,r.x)*5.+r.y*4.+t*.15),14.);vec3 c=palette(.5+.5*sin(r.y*3.+r.x*2.+t*.1))*(.16+.55*strips);c+=vec3(.8,.88,1.)*pow(max(0.,dot(r,normalize(vec3(-.5,.8,1.)))),40.)*2.;return c;}
float silkFlow(vec2 p,float t){return p.x*3.1+.65*sin(p.y*2.1-t*.24)+.24*sin(p.y*4.2+t*.17);}
float silk(vec2 p,float t){float u=silkFlow(p,t);return .22*sin(u*3.4+t*.26)+.09*sin(u*1.7-p.y*.9-t*.13);}

vec3 generate(vec2 p,float t,float which,float drive){
 vec3 col=vec3(.008,.006,.02);
 if(which<.5){
  // Twisted architectural rings recede into a real perspective volume.
  vec3 ro=vec3(.13*sin(t*.16),.13*cos(t*.13),t*.55),rd=normalize(vec3(p,1.05));float d=0.;
  for(int i=0;i<76;i++){vec3 q=ro+rd*d;float h=tunnel(q,t,drive);float fog=exp(-d*.12);float glow=.003/(.015+h*h*22.);col+=palette(.5+.5*sin(q.z*.35))*glow*fog;if(h<.003||d>24.)break;d+=max(h*.75,.007);}
  col+=vec3(.31,.06,.55)*exp(-dot(p,p)*12.)*.35;
 }else if(which<1.5){
  // Smooth-unioned forms, surface normals, Fresnel and reflected light ribbons.
  vec3 ro=vec3(0.,0.,3.4),rd=normalize(vec3(p*1.8,-2.5));float d=0.;bool hit=false;
  for(int i=0;i<56;i++){float h=liquid(ro+rd*d,t,drive);if(h<.002){hit=true;break;}d+=h*.85;if(d>7.)break;}
  col+=environment(normalize(vec3(p,-1.)),t)*.09;
  if(hit){vec3 q=ro+rd*d;vec2 e=vec2(.003,0.);vec3 n=normalize(vec3(liquid(q+e.xyy,t,drive)-liquid(q-e.xyy,t,drive),liquid(q+e.yxy,t,drive)-liquid(q-e.yxy,t,drive),liquid(q+e.yyx,t,drive)-liquid(q-e.yyx,t,drive)));float fres=pow(1.-max(dot(-rd,n),0.),3.);col=environment(reflect(rd,n),t)*(1.1+fres)+palette(.5+n.y*.5)*.12;col+=vec3(.7,.85,.8)*pow(max(dot(n,normalize(vec3(-1.,1.,2.))),0.),80.);}
 }else if(which<2.5){
  // Broad traveling folds: coherent normals, directional sheen, fine fibers only as an accent.
  p=rot(-.3)*p*(1.+drive*.12);float h=silk(p,t),e=.004;
  float dx=(silk(p+vec2(e,0.),t)-silk(p-vec2(e,0.),t))/(2.*e),dy=(silk(p+vec2(0.,e),t)-silk(p-vec2(0.,e),t))/(2.*e);
  vec3 n=normalize(vec3(-dx*.8,-dy*.8,1.)),light=normalize(vec3(-.55,.75,1.));float diffuse=max(dot(n,light),0.);
  float u=silkFlow(p,t),pigment=.5+.5*sin(u*1.2+p.y*.6-t*.08);float sheen=pow(max(dot(n,normalize(light+vec3(0.,0.,1.))),0.),42.);
  float occlusion=.65+.35*smoothstep(-.24,.24,h),fiber=.012*sin(u*94.+p.y*3.);
  col=palette(pigment)*(.12+.7*diffuse)*occlusion+vec3(.74,.86,.82)*sheen*.75;
  col+=palette(pigment)*fiber*diffuse;

 }else{
  // Layered orbital filaments with depth-dependent softness and traveling nodes.
  p=rot(.14*sin(t*.1))*p;for(int i=0;i<30;i++){float k=float(i),z=k/29.;vec2 q=p;float a=t*.12+k*.21;vec2 axis=rot(a)*q;float r=length(axis*vec2(.62+.24*sin(k*.7),1.));float radius=.12+z*.38+drive*.05;float dist=abs(r-radius);float ang=atan(axis.y,axis.x);float wave=.35+.65*pow(.5+.5*cos(ang*2.-t*.5+k*.16),5.);float width=max(.0018+z*.0015,.65/resolution.y);float strand=exp(-dist*dist/(width*width));float halo=exp(-dist*dist/.0003)*.05;col+=palette(z)*(strand+halo)*wave*.7;float node=pow(max(0.,cos(ang-t*.18-k*.3)),180.)*exp(-dist*dist/.00007);col+=vec3(.65,.85,.5)*node*.45;}
 }
 col=vec3(1.)-exp(-col*1.2);return pow(max(col,vec3(0.)),vec3(.9));
}
`;
