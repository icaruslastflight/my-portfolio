import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.argv[2]||'.'),port=Number(process.env.PORT)||4173;
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.wav':'audio/wav','.pdf':'application/pdf'};
createServer(async(req,res)=>{
 try{
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path==='/')path='/index.html';
  let file=resolve(root,'.'+path);if(!file.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return;}
  let info;try{info=await stat(file);}catch{const pub=resolve(root,'public');file=resolve(pub,'.'+path);if(!file.startsWith(pub+sep)){res.writeHead(403).end();return;}info=await stat(file);}
  if(!info.isFile())throw Error('Not a file');const bytes=await readFile(file);
  res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){const start=+range[1],end=range[2]?Math.min(+range[2],bytes.length-1):bytes.length-1;if(start>end){res.writeHead(416,{'Content-Range':`bytes */${bytes.length}`}).end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Accept-Ranges':'bytes','Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));}
  else{res.setHeader('Content-Length',bytes.length);res.end(bytes);}
 }catch{res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}`));
