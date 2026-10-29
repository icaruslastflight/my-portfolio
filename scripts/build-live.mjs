import {cp,mkdir,readFile,writeFile,rm,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {projects} from '../src/live/projects.mjs';
import {projectDetails} from '../src/live/project-details.mjs';
import {esc} from '../src/live/model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
try{await access(resolve(root,'public'));await cp(resolve(root,'public'),dist,{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await cp(resolve(root,'src/live'),resolve(dist,'assets'),{recursive:true});
let html=await readFile(resolve(root,'index.html'),'utf8');html=html.replaceAll('./src/live/','./assets/');
const readable=projects.map(p=>{const d=projectDetails[p.id];return `<article><p>${esc(d.type)}</p><h3>${esc(p.title)}</h3><p>${esc(d.role)} — ${esc(d.period)}</p><p>${esc(d.summary)}</p><ul>${d.responsibilities.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><p>${esc(d.contribution)}</p><a href="${esc(p.media)}">Project media</a></article>`;}).join('');
html=html.replace(/<noscript>[\s\S]*?<\/noscript>/,`<noscript><h2>Portfolio / project files</h2>${readable}</noscript>`);
await writeFile(resolve(dist,'index.html'),html);
console.log(`Built portfolio: ${projects.length} role/project descriptions, optional visual lab, local audio only.`);
