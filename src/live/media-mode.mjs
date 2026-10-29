// Be conservative with unrecognized image formats: continuing to upload preserves motion.
// Container references: https://www.w3.org/TR/png/,
// https://developers.google.com/speed/webp/docs/riff_container,
// https://aomediacodec.github.io/av1-avif/latest-approved.html
const ascii=bytes=>String.fromCharCode(...bytes);
export async function isDynamicImage(file){
 try{
  const h=new Uint8Array(await file.slice(0,32).arrayBuffer());
  if(h[0]===255&&h[1]===216)return false; // JPEG
  if(ascii(h.slice(0,2))==='BM')return false;
  if(ascii(h.slice(0,3))==='GIF')return true;
  if(h[0]===137&&ascii(h.slice(1,4))==='PNG'){
   let offset=8;
   for(let i=0;i<64;i++){
    const chunk=new Uint8Array(await file.slice(offset,offset+8).arrayBuffer());
    if(chunk.length<8)return true;
    const length=new DataView(chunk.buffer,chunk.byteOffset,8).getUint32(0),type=ascii(chunk.slice(4,8));
    if(type==='acTL'||type==='fcTL')return true;
    if(type==='IDAT'||type==='IEND')return false;
    offset+=length+12;
    if(offset>file.size)return true;
   }
   return true;
  }
  if(ascii(h.slice(0,4))==='RIFF'&&ascii(h.slice(8,12))==='WEBP'){
   const type=ascii(h.slice(12,16));
   if(type==='VP8X'&&h.length>20)return Boolean(h[20]&2);
   if(type==='VP8 '||type==='VP8L')return false;
  }
  if(ascii(h.slice(4,8))==='ftyp'&&h.length>=16){
   const size=new DataView(h.buffer,h.byteOffset,h.byteLength).getUint32(0);
   if(size>=16&&size<=4096&&size<=file.size){
    const box=new Uint8Array(await file.slice(8,size).arrayBuffer()),brands=[ascii(box.slice(0,4))];
    for(let i=8;i+4<=box.length;i+=4)brands.push(ascii(box.slice(i,i+4)));
    if(brands.includes('avis')||brands.includes('msf1'))return true;
    if(brands.includes('avif'))return false;
   }
  }
  return true; // Includes SVG animation and formats whose animation cannot be ruled out.
 }catch{return true;}
}
