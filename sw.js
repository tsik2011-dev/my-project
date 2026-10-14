// ゴロ合わせ講座 音声 — service worker
const SHELL_CACHE='goro-shell-202610150716';
const AUDIO_CACHE='goro-audio-v1';
const FONT_CACHE='goro-fonts-v1';
const SHELL=["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.png", "img/01.jpg", "img/02.jpg", "img/03.jpg", "img/04.jpg", "img/05.jpg", "img/06.jpg", "img/07.jpg", "img/08.jpg", "img/09.jpg", "img/10.jpg", "img/11.jpg", "img/12.jpg", "img/13.jpg", "img/14.jpg", "img/15.jpg", "img/16.jpg", "img/17.jpg", "img/18.jpg", "img/19.jpg", "img/20.jpg", "img/21.jpg", "img/22.jpg", "img/23.jpg", "img/24.jpg", "img/25.jpg", "img/26.jpg", "img/27.jpg", "img/28.jpg", "img/29.jpg", "img/30.jpg", "img/31.jpg", "img/32.jpg", "img/33.jpg", "img/34.jpg", "img/35.jpg", "img/36.jpg", "img/37.jpg", "img/38.jpg", "img/39.jpg", "img/40.jpg", "img/41.jpg", "img/42.jpg", "img/43.jpg", "img/44.jpg", "img/45.jpg", "img/46.jpg", "img/47.jpg", "img/48.jpg", "img/49.jpg", "img/50.jpg", "img/51.jpg", "img/52.jpg", "img/53.jpg", "img/54.jpg", "img/55.jpg", "img/56.jpg", "img/57.jpg", "img/58.jpg", "img/59.jpg", "img/60.jpg", "img/61.jpg", "img/62.jpg", "img/63.jpg", "img/64.jpg", "img/65.jpg", "img/66.jpg", "img/67.jpg", "img/68.jpg", "img/69.jpg", "img/70.jpg", "img/71.jpg", "img/72.jpg", "img/73.jpg", "img/74.jpg", "img/75.jpg", "img/76.jpg", "img/77.jpg", "img/78.jpg", "img/79.jpg", "img/80.jpg", "img/81.jpg", "img/82.jpg", "img/83.jpg"];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(SHELL_CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('goro-shell-')&&k!==SHELL_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    if(url.pathname.endsWith('.mp3')){e.respondWith(audio(req));return}
    if(req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html')){e.respondWith(networkFirst(req));return}
    e.respondWith(cacheFirst(req));return;
  }
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com'){e.respondWith(fontCache(req))}
});

async function networkFirst(req){
  const c=await caches.open(SHELL_CACHE);
  try{const res=await fetch(req);if(res.ok)c.put('index.html',res.clone());return res}
  catch(err){return (await c.match('index.html'))||(await c.match('./'))||Response.error()}
}
async function cacheFirst(req){
  const hit=await caches.match(req,{ignoreSearch:true});if(hit)return hit;
  const res=await fetch(req);
  if(res.ok){const c=await caches.open(SHELL_CACHE);c.put(req,res.clone())}
  return res;
}
async function fontCache(req){
  const c=await caches.open(FONT_CACHE);const hit=await c.match(req);if(hit)return hit;
  try{const res=await fetch(req);if(res.ok||res.type==='opaque')c.put(req,res.clone());return res}catch(err){return Response.error()}
}
// 保存済みの音声は端末から返す。iPhoneのSafariは音声を範囲指定（Range）で要求するので、部分応答（206）を組み立てる。
async function audio(req){
  const url=new URL(req.url);url.search='';url.hash='';
  const c=await caches.open(AUDIO_CACHE);
  const hit=await c.match(url.href);
  if(!hit)return fetch(req);
  const range=req.headers.get('range');
  if(!range)return hit;
  const buf=await hit.arrayBuffer();const size=buf.byteLength;
  const m=/bytes=(\d*)-(\d*)/.exec(range);
  let start=0,end=size-1;
  if(m){
    if(m[1]===''&&m[2]!==''){start=Math.max(0,size-Number(m[2]))}
    else{start=Number(m[1]||0);if(m[2]!=='')end=Math.min(Number(m[2]),size-1)}
  }
  if(start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  return new Response(buf.slice(start,end+1),{status:206,statusText:'Partial Content',headers:{
    'Content-Type':'audio/mpeg','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes'}});
}
