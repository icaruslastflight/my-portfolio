import {cp,mkdir,readFile,writeFile,rm,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {projects} from '../src/live/projects.mjs';
import {esc} from '../src/live/model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
try{await access(resolve(root,'public'));await cp(resolve(root,'public'),dist,{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await cp(resolve(root,'src/live'),resolve(dist,'assets'),{recursive:true});
let html=await readFile(resolve(root,'index.html'),'utf8');html=html.replaceAll('./src/live/','./assets/');
const readable=projects.map(p=>`<article><h3>${esc(p.title)}</h3><p>${esc(p.role)} — ${esc(p.location)}</p><p>${esc(p.description)}</p><p>Challenge: ${esc(p.challenge)}</p><p>Architecture: ${esc(p.architecture)}</p><p>Execution: ${esc(p.execution)}</p><a href="${esc(p.media)}">Original project media</a></article>`).join('');
html=html.replace(/<noscript>[\s\S]*?<\/noscript>/,`<noscript><h2>Portfolio / project files</h2>${readable}</noscript>`);
await writeFile(resolve(dist,'index.html'),html);
console.log(`Built live portfolio: ${projects.length} projects, 5 original music sketches, 4 3D sources.`);
