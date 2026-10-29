import {clamp,spectrumBands} from './model.mjs';
/** Local audio playback and analysis. No generated music or microphone monitoring. */
export class AudioDeck {
 constructor(){this.bpm=120;this.mode='idle';this.running=false;this.volume=.28;this.generation=0;this.file=null;this.stream=null;this.label='Choose your soundtrack';this.offset=0;}
 ensure(){
  if(this.ctx)return;
  const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Context)throw Error('Audio is unavailable. You can explore the visuals in silence.');
  this.ctx=new Context({latencyHint:'interactive'});this.output=this.ctx.createGain();this.output.gain.value=this.volume;this.output.connect(this.ctx.destination);
  this.analyser=this.ctx.createAnalyser();this.analyser.fftSize=2048;this.analyser.smoothingTimeConstant=.8;this.freq=new Uint8Array(this.analyser.frequencyBinCount);
  this.media=new globalThis.Audio();this.media.preload='metadata';this.media.loop=true;this.mediaSource=this.ctx.createMediaElementSource(this.media);
  this.mediaSource.connect(this.output);this.mediaSource.connect(this.analyser);
  this.media.addEventListener('error',()=>{this.running=false;this.onstate?.();});
 }
 setVolume(v){this.volume=clamp(v,0,.8);this.output?.gain.setTargetAtTime(this.volume,this.ctx.currentTime,.03);}
 setTempo(v){this.bpm=clamp(v,50,200);this.origin=this.ctx?.currentTime||0;this.offset=this.media?.currentTime||0;}
 async start(){
  if(this.mode==='idle')return false;
  this.ensure();const generation=++this.generation;await this.ctx.resume();if(generation!==this.generation)return false;
  if(this.mode==='local')await this.media.play();
  if(generation!==this.generation){this.media.pause();return false;}this.running=true;return true;
 }
 pause(){this.generation++;this.running=false;this.media?.pause();}
 async load(file){
  if(!file||file.size>80*1024*1024||(!file.type.startsWith('audio/')&&!/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name)))throw Error('Choose an audio file smaller than 80 MB.');
  this.ensure();this.disconnect();this.file=URL.createObjectURL(file);this.media.src=this.file;this.mode='local';this.label=file.name;this.offset=0;
  try{await this.start();}catch{this.running=false;throw Error('That audio could not play. Try an MP3, WAV or Ogg file.');}
 }
 async microphone(){
  this.ensure();this.disconnect();if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone input needs HTTPS and browser support.');
  const generation=++this.generation;await this.ctx.resume();const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
  this.stream=stream;this.micSource=this.ctx.createMediaStreamSource(stream);this.micSource.connect(this.analyser);this.mode='mic';this.running=true;this.origin=this.ctx.currentTime;
 }
 disconnect(){this.pause();this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.micSource?.disconnect();this.micSource=null;if(this.file){this.media.removeAttribute('src');this.media.load();URL.revokeObjectURL(this.file);this.file=null;}this.mode='idle';this.label='Choose your soundtrack';}
 sample(){
  if(!this.ctx||!this.running)return {bands:[0,0,0],beat:0,phase:0,freq:null,active:false};this.analyser.getByteFrequencyData(this.freq);
  const seconds=this.mode==='local'?Math.max(0,this.media.currentTime-this.offset):Math.max(0,this.ctx.currentTime-(this.origin||0)),beat=seconds*this.bpm/60;
  return {bands:spectrumBands(this.freq,this.ctx.sampleRate,this.analyser.fftSize),beat,phase:beat%1,freq:this.freq,active:true};
 }
 async destroy(){this.disconnect();this.mediaSource?.disconnect();await this.ctx?.close();}
}
