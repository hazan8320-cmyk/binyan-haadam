/* להיות אדם · the service worker: the whole program kept on the computer, so it opens at once and works without internet.
   A new version (a new build of index.html) waits until the person chooses "עדכון עכשיו" — never in the middle of his work.
   V101 · 67 — the reminders with the program closed: the owner's server wakes this worker at the minute (an empty push, no word in
   it); the worker reads from the computer itself what rings now and shows it. Another person on this computer sees only that there
   is a reminder for someone. When the program is in front, its own card is enough. */
const BUILD='69c1607505e9';const CACHE='binyan-haadam-'+BUILD;
const CORE=["./", "index.html", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/favicon-48.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon.svg", "icons/maskable-192.png", "icons/maskable-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('binyan-haadam-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='skip')self.skipWaiting()});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;
 if(req.mode==='navigate'){e.respondWith(caches.open(CACHE).then(c=>c.match('index.html').then(hit=>hit||fetch(req).catch(()=>c.match('./')))));return}
 e.respondWith(caches.open(CACHE).then(c=>c.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{if(res.ok&&res.type==='basic')c.put(req,res.clone());return res}))))});
/* ---------- the reminders ---------- */
const PDB='lihyot-adam-push';
const idb=()=>new Promise((res,rej)=>{const q=indexedDB.open(PDB,1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
const tx=(db,mode,fn)=>new Promise(res=>{const t=db.transaction('kv',mode),q=fn(t.objectStore('kv'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>res(undefined)});
const NOTE={icon:'icons/icon-192.png',badge:'icons/favicon-48.png',lang:'he',dir:'rtl'};
async function ring(){
 const cl=await clients.matchAll({type:'window',includeUncontrolled:true});
 const front=cl.some(c=>c.visibilityState==='visible'&&c.focused);
 const now=Date.now(),hits=[];
 try{const db=await idb();const keys=(await tx(db,'readonly',s=>s.getAllKeys()))||[];
  for(const k of keys){if(!String(k).startsWith('due@'))continue;const v=await tx(db,'readonly',s=>s.get(k));if(!v||!Array.isArray(v.list))continue;
   const sk='shown@'+v.who,sh=(await tx(db,'readonly',s=>s.get(sk)))||{};let ch=false;
   for(const x of v.list)if(x.at<=now+90e3&&x.at>now-3*36e5&&!sh[x.key]){hits.push({x,v});sh[x.key]=now;ch=true}
   for(const k2 of Object.keys(sh))if(sh[k2]<now-45*864e5){delete sh[k2];ch=true}
   if(ch)await tx(db,'readwrite',s=>s.put(sh,sk))}}catch(_){}
 if(front){cl.forEach(c=>c.postMessage({type:'remind-tick'}));return}
 if(!hits.length)return self.registration.showNotification('להיות אדם',Object.assign({body:'תזכורת',tag:'lihyot-adam'},NOTE));
 for(const {x,v} of hits.slice(-4))await self.registration.showNotification(v.multi?('תזכורת ל'+(v.name||'')):(x.title||'תזכורת'),Object.assign({body:v.multi?'להיות אדם · פתיחה — לפרטים':(x.body||'להיות אדם'),tag:x.key,data:{key:x.key,who:v.who}},NOTE));
}
self.addEventListener('push',e=>{e.waitUntil(ring())});
self.addEventListener('notificationclick',e=>{e.notification.close();const d=e.notification.data||{};e.waitUntil((async()=>{
 const cl=await clients.matchAll({type:'window',includeUncontrolled:true});const c=cl.find(x=>'focus' in x);
 if(c){await c.focus();c.postMessage({type:'remind-open',key:d.key||''});return}
 await clients.openWindow('./?from=remind')})())});
