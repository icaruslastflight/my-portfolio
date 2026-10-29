import {cp,mkdir,readFile,writeFile,rm,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {projects} from '../src/live/projects.mjs';
import {projectDetails} from '../src/live/project-details.mjs';
import {esc} from '../src/live/model.mjs';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
try{await access(resolve(root,'public'));await cp(resolve(root,'public'),dist,{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await cp(resolve(root,'src/live'),resolve(dist,'assets'),{recursive:true});
let html=await readFile(resolve(root,'index.html'),'utf8');html=html.replaceAll('./src/live/','./assets/');
const readable=projects.map(p=>{const d=projectDetails[p.id];return `<article><p>${esc(d.type)}</p><h3>${esc(p.title)}</h3><p>${esc(d.role)} — ${esc(d.period)}</p><p>${esc(d.summary)}</p><ul>${d.responsibilities.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><p>${esc(d.contribution)}</p><a href="${esc(p.media)}">Project media</a></article>`;}).join('');
html=html.replace(/<noscript>[\s\S]*?<\/noscript>/,`<noscript><h2>Portfolio / project files</h2>${readable}</noscript>`);
await writeFile(resolve(dist,'index.html'),html);
// Keep CLI and repository deploys consistent; authorize only the bundled inline script.
const basePolicy="default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'";
const mainPolicy=basePolicy+"; script-src 'self'; connect-src 'self'; frame-src https://open.spotify.com https://www.youtube-nocookie.com https://www.youtube.com";
const studioHTML=await readFile(resolve(dist,'stinger/index.html'),'utf8');
const scriptHashes=[...studioHTML.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>"'sha256-"+createHash('sha256').update(m[1].replace(/\r\n?/g,'\n')).digest('base64')+"'").join(' ');
const studioPolicy=basePolicy+"; script-src 'self' "+scriptHashes+"; connect-src 'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*; frame-src 'none'";
await writeFile(resolve(dist,'_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Cache-Control: public, max-age=0, must-revalidate\n  Permissions-Policy: microphone=(self), camera=(), geolocation=(), autoplay=(self "https://open.spotify.com" "https://www.youtube-nocookie.com" "https://www.youtube.com")\n/\n  Content-Security-Policy: ${mainPolicy}\n/index.html\n  Content-Security-Policy: ${mainPolicy}\n/stinger/*\n  Content-Security-Policy: ${studioPolicy}\n/media/*\n  Cache-Control: public, max-age=3600\n`);
console.log(`Built portfolio: ${projects.length} role/project descriptions, optional visual lab, local audio only.`);
