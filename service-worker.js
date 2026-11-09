/* Profi.UZ installable web shell. No caching of auth, API or private data. */
const CACHE='profi-static-v1';
const ASSETS=['./profi-icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;if(url.pathname.endsWith('/profi-icon.svg')||url.pathname.endsWith('/manifest.webmanifest'))event.respondWith(caches.match(req).then(c=>c||fetch(req)))});
