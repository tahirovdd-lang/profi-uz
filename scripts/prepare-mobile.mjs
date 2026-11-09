import { mkdir,copyFile,readdir,rm } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),out=path.join(root,'www');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const allowed=new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.ico','.webmanifest','.json']);
const excluded=new Set(['package.json','package-lock.json','capacitor.config.json','service-worker.js']);
for(const item of await readdir(root,{withFileTypes:true})){
 if(!item.isFile()||excluded.has(item.name)||!allowed.has(path.extname(item.name).toLowerCase()))continue;
 await copyFile(path.join(root,item.name),path.join(out,item.name));
}
// Service workers registered by the hosted PWA must not intercept Capacitor assets.
const htmlPath=path.join(out,'index.html');
const {readFile,writeFile}=await import('node:fs/promises');
let html=await readFile(htmlPath,'utf8');
html=html.replace(/<script>if\("serviceWorker" in navigator&&location\.protocol==="https:"\)\{window\.addEventListener\("load",\(\)=>navigator\.serviceWorker\.register\("\.\/service-worker\.js"\)\.catch\(\(\)=>\{\}\)\)\}<\/script>/,'');
await writeFile(htmlPath,html);
console.log('Prepared Capacitor www assets. Check references to nested files before building.');
