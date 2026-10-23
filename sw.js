/* בניין האדם · the service worker: the whole program kept on the computer, so it opens at once and works without internet.
   A new version (a new build of index.html) waits until the person chooses "עדכון עכשיו" — never in the middle of his work. */
const BUILD='3f1ec7c7d6da';const CACHE='binyan-haadam-'+BUILD;
const CORE=["./", "index.html", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/favicon-48.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon.svg", "icons/maskable-192.png", "icons/maskable-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('binyan-haadam-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='skip')self.skipWaiting()});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;
 if(req.mode==='navigate'){e.respondWith(caches.open(CACHE).then(c=>c.match('index.html').then(hit=>hit||fetch(req).catch(()=>c.match('./')))));return}
 e.respondWith(caches.open(CACHE).then(c=>c.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{if(res.ok&&res.type==='basic')c.put(req,res.clone());return res}))))});
