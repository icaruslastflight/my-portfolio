export function crystalProgress(elapsed){const x=Math.max(0,Math.min(1,Number.isFinite(elapsed)?elapsed/5:0));return x*x*(3-2*x);}
// A field of raised six-face quartz tips grows through the actual logo silhouette.
// Height is intersected in depth; it is not a flat Voronoi color fill.
export const crystalGrowthGLSL=`
float crystalHeight(vec2 q,out vec3 normal,out float grown,out float ridge){
 float scale=24.0;vec2 second;vec2 axis=vec2(scale,scale*0.65);vec4 cell=voro(q*axis,second);
 vec2 local=q*axis-cell.xy;
 float angle=floor((atan(local.y,local.x)+0.5235988)/1.0471976)*1.0471976;
 vec2 face=vec2(cos(angle),sin(angle));
 float plane=max(0.0,dot(local,face));
 vec3 seed=hash32(floor(cell.xy*13.0));
 float order=clamp((cell.x/scale+0.72)/1.44,0.0,1.0)*0.42+seed.z*0.36;
 grown=smoothstep(order,order+0.20,clamp(uCrystal,0.0,1.0));
 float stroke=(logoP(q+vec2(0.006,0.0))+logoP(q-vec2(0.006,0.0))+logoP(q+vec2(0.0,0.006))+logoP(q-vec2(0.0,0.006)))*0.25;
 float widthScale=mix(0.12,1.0,pow(smoothstep(0.1,0.9,stroke),2.0));
 float depth=max(uDepth,0.008)*(0.7+seed.x*0.6)*widthScale;
 float tip=0.22+0.78*max(0.0,1.0-plane/0.7);
 normal=normalize(vec3(face*axis*depth*1.1,1.0));
 float edgeWidth=clamp(uBevel*scale,0.025,0.18);
 ridge=1.0-smoothstep(edgeWidth*0.2,edgeWidth*0.65,cell.w-cell.z);
 return depth*tip*grown;
}
void main(){
 vec2 uv=isf_FragNormCoord;vec2 p=uv2p(uv);
 float kick=uBass*uAudioReact;
 float orbit=TIME*uOrbit*0.28;
 vec2 tilt=vec2(-0.38+sin(orbit)*0.08,0.30+cos(orbit*0.7)*0.05);
 float top=max(uDepth,0.008)*1.35*(1.0+kick*0.15);
 float hit=-1.0,crystal=0.0,ridge=0.0;vec3 N=vec3(0,0,1);vec2 hp=p;
 for(int i=0;i<28;i++){
  float z=top*(1.0-float(i)/27.0);vec2 q=p+tilt*(z-top*0.45);
  float ink=logoP(q);
  if(ink>0.3){vec3 n;float grow;float edge;float h=crystalHeight(q,n,grow,edge);
   if(grow>0.001&&z<=h){hit=z;N=n;hp=q;crystal=grow;ridge=edge;break;}
  }
 }
 vec4 art=logoRGBA(p);float silhouette=logoP(p);
 vec3 pm=art.rgb*silhouette*0.10;float alpha=silhouette*0.12;
 if(hit>=0.0){
  vec4 colorPlate=logoRGBA(hp);vec3 V=normalize(vec3(-tilt,1.4));
  vec3 R=reflect(-V,N);vec3 L=normalize(vec3(-0.5,0.75,1.0));
  float diffuse=max(dot(N,L),0.0);
  float fresnel=pow(1.0-max(dot(N,V),0.0),4.0)*uFresnel*(1.0+uHigh*uAudioReact*0.2);
  vec3 gem=mix(uTint.rgb,colorPlate.rgb,0.48);
  vec3 reflection=studioEnv(R,clamp(uRoughness*0.65,0.02,1.0),orbit*0.3);
  vec3 refracted=logoRGBA(hp-N.xy*max(uDepth,0.008)*0.16).rgb;
  float spec=pow(max(dot(reflect(-L,N),V),0.0),mix(110.0,16.0,uRoughness));
  vec3 color=gem*(0.18+diffuse*0.52)+reflection*(0.16+fresnel*0.28);
  color+=refracted*0.22+vec3(1.0,0.97,1.0)*spec*1.05;
  color+=mix(gem,vec3(1.0),0.65)*ridge*0.12;
  color=1.0-exp(-color*1.35);
  float solid=smoothstep(0.25,0.8,logoP(hp))*smoothstep(0.0,0.08,crystal);
  pm=mix(pm,color*solid,solid);alpha=max(alpha,solid);
 }
 gl_FragColor=vjOutPM(vec4(pm,alpha));
}
`;
