/* ZArchiver Web — file manager + archiver (client-side, RTL Arabic) */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const enc = new TextEncoder(), dec = new TextDecoder();

// ---------- i18n (Arabic / English) ----------
const LS_LANG='zarchiver_lang';
let lang=localStorage.getItem(LS_LANG)||'ar';
const STR={
ar:{app_sub:'مدير الضغط والملفات',nav_home:'📁 التخزين الداخلي',nav_data:'📂 Android/data',nav_obb:'📦 Android/obb',nav_arch:'🗜️ الأرشيفات',nav_img:'🖼️ الصور',nav_vid:'🎬 الفيديو والصوت',nav_doc:'📄 المستندات',nav_recent:'🕘 الأحدث',nav_set:'⚙️ الإعدادات',nav_about:'ℹ️ حول',search_ph:'ابحث عن ملف أو مجلد…',drop:'أفلت الملفات هنا للرفع 📥',empty:'المجلد فارغ',empty_sub:'استخدم زر + لإنشاء مجلد أو رفع ملفات',reset:'استعادة ملفات العرض',items:'عنصر',used:'مستخدم',local:'محلي',folder:'مجلد',in_archive:'داخل أرشيف: ',close_archive:'✕ إغلاق الأرشيف',selected:'محدد',access_data_title:'مجلد Android/data — يتطلب منح الوصول (مثل ZArchiver في أندرويد 11+)',access_obb_title:'مجلد Android/obb — يتطلب منح الوصول',access_linked:'✅ مرتبط بمجلد حقيقي',access_notlinked:'⚠️ عرض افتراضي — اربط المجلد الحقيقي من جهازك',grant:'📂 منح الوصول وربط المجلد',how:'❓ طريقة الوصول',dlg_lang:'اللغة / Language',cancel:'إلغاء',ok:'حسناً',save:'حفظ',create:'إنشاء',compress:'ضغط',close:'إغلاق',del:'🗑️ حذف',confirm_del:'تأكيد الحذف',paste_here:'📥 لصق هنا'},
en:{app_sub:'Archive & file manager',nav_home:'📁 Internal storage',nav_data:'📂 Android/data',nav_obb:'📦 Android/obb',nav_arch:'🗜️ Archives',nav_img:'🖼️ Images',nav_vid:'🎬 Video & Audio',nav_doc:'📄 Documents',nav_recent:'🕘 Recent',nav_set:'⚙️ Settings',nav_about:'ℹ️ About',search_ph:'Search files or folders…',drop:'Drop files here to upload 📥',empty:'Folder is empty',empty_sub:'Use the + button to create or upload',reset:'Restore demo files',items:'items',used:'used',local:'local',folder:'Folder',in_archive:'Inside archive: ',close_archive:'✕ Close archive',selected:'selected',access_data_title:'Android/data folder — requires access grant (like ZArchiver on Android 11+)',access_obb_title:'Android/obb folder — requires access grant',access_linked:'✅ Linked to a real folder',access_notlinked:'⚠️ Virtual preview — link the real device folder',grant:'📂 Grant access & link folder',how:'❓ How to grant',dlg_lang:'اللغة / Language',cancel:'Cancel',ok:'OK',save:'Save',create:'Create',compress:'Compress',close:'Close',del:'🗑️ Delete',confirm_del:'Confirm delete',paste_here:'📥 Paste here'}
};
const t=k=>(STR[lang]&&STR[lang][k])||STR.ar[k]||k;
function setLang(l){ lang=(l==='en')?'en':'ar'; localStorage.setItem(LS_LANG,lang);
  document.documentElement.lang=lang; document.documentElement.dir=(lang==='ar')?'rtl':'ltr';
  document.title=(lang==='ar')?'ZArchiver — مدير الأرشيف والملفات':'ZArchiver — Archive Manager';
  const m={home:'nav_home',android_data:'nav_data',android_obb:'nav_obb',archives:'nav_arch',images:'nav_img',videos:'nav_vid',docs:'nav_doc',recent:'nav_recent',settings:'nav_set',about:'nav_about'};
  $$('#drawer-nav .nav-item').forEach(b=>{ const k=m[b.dataset.nav]; if(k) b.textContent=t(k); });
  const si=$('#search-input'); if(si) si.placeholder=t('search_ph');
  const dh=$('#drop-hint'); if(dh) dh.textContent=t('drop');
  const rs=$('#btn-reset-demo'); if(rs) rs.textContent=t('reset');
  const ac=$('#archive-close'); if(ac) ac.textContent=t('close_archive');
  const bp=$('#btn-paste'); if(bp) bp.textContent=t('paste_here');
  const ds=$('.drawer-sub'); if(ds) ds.textContent=t('app_sub');
  const bl=$('#btn-link-folder'); if(bl) bl.textContent=t('grant');
  const bh=$('#btn-access-help'); if(bh) bh.textContent=t('how');
  if(typeof render==='function') try{render();}catch{}
}

// ---------- utils ----------
const uid = () => Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4);
function fmtSize(b){ if(b==null) return '—'; if(b===0) return '0 بايت'; const u=['بايت','ك.ب','م.ب','ج.ب']; let i=0; while(b>=1024&&i<3){b/=1024;i++;} return (b>=100?Math.round(b):b.toFixed(1))+' '+u[i]; }
function fmtDate(t){ try{ return new Date(t).toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'});}catch{ return '';} }
function extOf(n){ const m=/\.([^.\\/]{1,8})$/.exec(n||''); return m?m[1].toLowerCase():''; }
function toast(msg){ const d=document.createElement('div'); d.className='toast'; d.textContent=msg; $('#toasts').appendChild(d); setTimeout(()=>d.remove(),2600); }
function b64encode(u8){ let s=''; const CH=0x8000; for(let i=0;i<u8.length;i+=CH){ s+=String.fromCharCode.apply(null,u8.subarray(i,i+CH)); } return btoa(s); }
function b64decode(b){ const s=atob(b); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i); return u; }
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800); }
function mimeOf(name){ const e=extOf(name);
  if(['png','jpg','jpeg','gif','webp','bmp','svg'].includes(e)) return 'image/'+(e==='jpg'?'jpeg':e==='svg'?'svg+xml':e);
  if(['mp4','webm','mkv'].includes(e)) return 'video/'+e;
  if(['mp3','wav','ogg','m4a'].includes(e)) return 'audio/'+e;
  if(e==='pdf') return 'application/pdf';
  if(e==='txt'||e==='md'||e==='json'||e==='js'||e==='css'||e==='html') return 'text/plain';
  if(e==='zip') return 'application/zip'; if(e==='tar') return 'application/x-tar'; if(e==='gz'||e==='tgz') return 'application/gzip';
  return 'application/octet-stream'; }
function iconFor(n,isDir){ if(isDir) return ['dir','📁']; const e=extOf(n);
  if(['zip','7z','rar','tar','gz','tgz'].includes(e)) return ['zip','🗜️'];
  if(['png','jpg','jpeg','gif','webp','bmp','svg'].includes(e)) return ['img','🖼️'];
  if(['mp4','webm','mkv','avi'].includes(e)) return ['vid','🎬'];
  if(['mp3','wav','ogg','m4a'].includes(e)) return ['aud','🎵'];
  if(['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','md'].includes(e)) return ['doc','📄'];
  if(['apk'].includes(e)) return ['zip','📲']; return ['','📄']; }

// ---------- storage (IndexedDB + localStorage fallback) ----------
const LS_KEY='zarchiver_tree_v1', LS_THEME='zarchiver_theme';
let nodes=new Map(), rootId='root';
function idb(){ return new Promise((res,rej)=>{ const r=indexedDB.open('zarchiver',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('files');
  r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function idbSet(k,v){ try{ const db=await idb(); return new Promise((res,rej)=>{ const t=db.transaction('files','readwrite'); t.objectStore('files').put(v,k); t.oncomplete=res; t.onerror=()=>rej(t.error); }); }catch{ try{localStorage.setItem('za_'+k,b64encode(v));}catch{} } }
async function idbGet(k){ try{ const db=await idb(); return new Promise((res)=>{ const t=db.transaction('files','readonly'); const q=t.objectStore('files').get(k); q.onsuccess=()=>res(q.result||null); q.onerror=()=>res(null); }); }catch{ try{ const s=localStorage.getItem('za_'+k); return s?b64decode(s):null; }catch{ return null; } } }
async function idbDel(k){ try{ const db=await idb(); return new Promise(res=>{ const t=db.transaction('files','readwrite'); t.objectStore('files').delete(k); t.oncomplete=res; t.onerror=()=>res(); }); }catch{ try{localStorage.removeItem('za_'+k);}catch{} } }
function saveTree(){ try{ localStorage.setItem(LS_KEY, JSON.stringify({rootId, arr:[...nodes.values()].map(n=>({...n,data:undefined}))})); }catch{} }
function loadTree(){ try{ const s=localStorage.getItem(LS_KEY); if(!s) return false; const o=JSON.parse(s); rootId=o.rootId; nodes=new Map(o.arr.map(n=>[n.id,n])); return nodes.size>0; }catch{ return false; } }

// ---------- state ----------
let curDir='root', history=[], selected=new Set(), clipboard=null, sortBy='name', sortDir=1, viewMode='list', filter='home', searchQ='';
let archiveCtx=null; // {fileId,name,entries:[{path,isDir,size,data:Uint8Array}],innerPath}
let previewBlobUrl=null, previewNode=null;

function childrenOf(pid){ return [...nodes.values()].filter(n=>n.parent===pid); }
function getNode(id){ return nodes.get(id); }
function pathOf(id){ const p=[]; let c=nodes.get(id); while(c&&c.id!=='root'){ p.unshift(c); c=nodes.get(c.parent);} return p; }
function fullPath(id){ return '/التخزين الداخلي'+pathOf(id).map(n=>'/'+n.name).join(''); }

// ---------- Android/data & obb access ----------
let realHandles={data:null,obb:null};
function ensureSpecialFolders(){
  let android=[...nodes.values()].find(n=>n.parent==='root'&&n.isDir&&n.name==='Android');
  if(!android){ android={id:uid(),name:'Android',parent:'root',isDir:true,size:0,mtime:Date.now(),mime:''}; nodes.set(android.id,android); }
  for(const nm of ['data','obb']){ let d=childrenOf(android.id).find(n=>n.isDir&&n.name===nm);
    if(!d){ d={id:uid(),name:nm,parent:android.id,isDir:true,size:0,mtime:Date.now(),mime:''}; nodes.set(d.id,d); } }
}
function specialDirId(kind){ // 'data' | 'obb'
  const android=[...nodes.values()].find(n=>n.parent==='root'&&n.isDir&&n.name==='Android');
  if(!android) return null; const d=childrenOf(android.id).find(n=>n.isDir&&n.name===kind); return d?d.id:null;
}
function curSpecial(){ // returns 'data'|'obb'|null
  const p=pathOf(curDir).map(n=>n.name);
  if(p[0]==='Android'&&p[1]==='data') return 'data';
  if(p[0]==='Android'&&p[1]==='obb') return 'obb';
  return null;
}
function goSpecial(kind){
  ensureSpecialFolders();
  const id=specialDirId(kind); if(!id){ toast('تعذر فتح المجلد'); return; }
  archiveCtx=null; selected.clear(); filter='home'; curDir=id; render();
  $('#drawer')?.classList.remove('open'); $('#drawer-scrim')?.classList.add('hidden');
}
async function linkRealFolder(){
  const sp=curSpecial()||'data';
  const destId=specialDirId(sp)||curDir;
  try{
    if(window.showDirectoryPicker){
      const h=await window.showDirectoryPicker({mode:'readwrite'});
      realHandles[sp]=h;
      toast(lang==='ar'?'جاري استيراد المجلد…':'Importing folder…');
      const count=await importHandle(h,destId,0);
      render(); toast((lang==='ar'?'تم ربط واستيراد ':'Linked & imported ')+count+(lang==='ar'?' عنصر':' items'));
    } else {
      // fallback: folder input
      window._linkDest=destId; window._linkKind=sp;
      $('#dir-input').click();
    }
  }catch(e){ if(e&&e.name!=='AbortError') toast((lang==='ar'?'تعذر الوصول: ':'Access failed: ')+e.message); }
}
async function importHandle(dirHandle,parentId,depth){
  if(depth>4) return 0; let count=0;
  for await (const [name,handle] of dirHandle.values()){
    try{
      if(handle.kind==='file'){
        const f=await handle.getFile(); if(f.size>60*1024*1024) continue; // skip huge
        const buf=new Uint8Array(await f.arrayBuffer());
        let nm=name,k=1; while(childrenOf(parentId).some(n=>n.name===nm)){ nm='('+k+')_'+name; k++; }
        const n={id:uid(),name:nm,parent:parentId,isDir:false,size:buf.length,mtime:f.lastModified||Date.now(),mime:f.type||mimeOf(name)};
        nodes.set(n.id,n); await idbSet(n.id,buf); count++;
      } else if(handle.kind==='directory'){
        let d=childrenOf(parentId).find(n=>n.isDir&&n.name===name);
        if(!d){ d={id:uid(),name,parent:parentId,isDir:true,size:0,mtime:Date.now(),mime:''}; nodes.set(d.id,d); }
        count+=await importHandle(handle,d.id,depth+1);
      }
    }catch{}
    if(count>400) break;
  }
  return count;
}
function showAccessHelp(){
  const ar=lang!=='en';
  dlgInfo(ar?'طريقة الوصول إلى Data / obb':"How to access Data / obb",
  ar?('مثل تطبيق ZArchiver الأصلي على أندرويد 11+:\n\n1. افتح Android/data أو Android/obb من القائمة الجانبية\n2. اضغط "منح الوصول وربط المجلد"\n3. من نافذة النظام اختر مجلد data (أو obb) ثم Allow\n4. سيتم استيراد الملفات (حتى 4 مستويات وحتى 400 عنصر)\n\n• على الكمبيوتر: انسخ مجلد Android من هاتفك ثم اختره.\n• على الهاتف: استخدم متصفح Chrome واختر المجلد من التخزين.\n• ملفات OBB تكون مثل: main.123.com.game.obb')
    :('Like the original ZArchiver on Android 11+:\n\n1. Open Android/data or Android/obb from the drawer\n2. Tap "Grant access & link folder"\n3. Pick the data (or obb) folder, then Allow\n4. Files are imported (up to 4 levels, 400 items)\n\n• On desktop: copy the Android folder from your phone first.\n• OBB files look like: main.123.com.game.obb'));
}

// ---------- seed demo ----------
async function seed(){
  nodes=new Map(); rootId='root';
  const mk=(name,parent,isDir,data)=>{ const n={id:isDir?('d_'+name+'_'+parent):uid(),name,parent,isDir,size:isDir?0:(data?data.length:0),mtime:Date.now()-Math.floor(Math.random()*8*864e5),mime:isDir?'':mimeOf(name)}; nodes.set(n.id,n); if(!isDir&&data) idbSet(n.id,data); return n; };
  nodes.set('root',{id:'root',name:'التخزين الداخلي',parent:null,isDir:true,size:0,mtime:Date.now()});
  const docs=mk('Documents','root',true), dl=mk('Download','root',true), pics=mk('Pictures','root',true), mus=mk('Music','root',true);
  const andr=mk('Android','root',true);
  const dataD=mk('data',andr.id,true), obbD=mk('obb',andr.id,true);
  mk('ملاحظات.txt','root',false,enc.encode('مرحباً بك في ZArchiver Web 🌟\n\n• حدد ملفات ثم اضغط «ضغط» لإنشاء ZIP\n• انقر ملف ZIP لعرض محتوياته واستخراجه\n• يدعم: ZIP / TAR / GZ + معاينة صور ونصوص وفيديو\n• كل ملفاتك محفوظة محلياً في متصفحك (IndexedDB)\n'));
  mk('تعليمات.md',docs.id,false,enc.encode('# دليل الاستخدام\n\n1. زر + : مجلد / ملف / رفع / أرشيف\n2. ضغطة مطولة / كليك يمين: قائمة السياق\n3. تحديد متعدد ثم ضغط أو تنزيل أو حذف\n4. داخل الأرشيف: استخراج الكل أو ملفات محددة\n'));
  // Data / obb demo + help files (bilingual)
  mk('com.example.game',dataD.id,true);
  mk('com.example.app',dataD.id,true);
  mk('README.txt',dataD.id,false,enc.encode('مجلد Android/data\n\nفي أندرويد 11+ الوصول لهذا المسار مقيد ويتطلب إذن "كل الملفات".\nفي نسخة الويب: اضغط "منح الوصول وربط المجلد" واختر مجلد data من جهازك لاستيراد محتوياته.\n\nAndroid/data folder: on Android 11+ access is restricted.\nIn Web version: tap Grant access and pick the data folder to import.\n'));
  mk('com.example.game.obb',obbD.id,true);
  mk('README.txt',obbD.id,false,enc.encode('مجلد Android/obb — ملفات OBB للألعاب (main.*.obb / patch.*.obb).\nاربط المجلد الحقيقي لاستيراد ملفات OBB وعرضها/فك ضغطها.\n\nAndroid/obb — game OBB files. Link the real folder to import.\n'));
  mk('جهات-اتصال.csv',docs.id,false,enc.encode('name,phone\nأحمد,0501111111\nسارة,0502222222\n'));
  mk('خلفيات',pics.id,true);
  // tiny svg demo image
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e7d32"/><stop offset="1" stop-color="#a5d6a7"/></linearGradient></defs><rect width="400" height="240" fill="url(#g)"/><text x="200" y="130" font-size="42" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">ZArchiver</text></svg>';
  mk('شعار.svg',pics.id,false,enc.encode(svg));
  mk('أغنية-تجريبية.txt',mus.id,false,enc.encode('ملف صوتي تجريبي — ارفع MP3 حقيقي لتشغيل المعاينة.'));
  mk('تطبيق-تجريبي.apk',dl.id,false,enc.encode('fake-apk-binary-demo'));
  saveTree(); curDir='root';
}

// ---------- render ----------
function visibleNodes(){
  let arr = childrenOf(curDir);
  if(archiveCtx){ arr = archiveCtx.entries.filter(e=>{ const dir=archiveCtx.innerPath?archiveCtx.innerPath+'/':''; if(!e.path.startsWith(dir)) return false; const rest=e.path.slice(dir.length); if(!rest||rest.endsWith('/')&&rest.slice(0,-1).includes('/')) return false; if(rest.includes('/')&&!e.isDir) return false; if(e.isDir){ const r2=rest.endsWith('/')?rest.slice(0,-1):rest; if(r2.includes('/')) return false; } return true; });
    arr = arr.map(e=>({archiveEntry:e}));
  } else {
    if(filter==='archives') arr=arr.filter(n=>!n.isDir&&['zip','7z','rar','tar','gz','tgz'].includes(extOf(n.name)));
    else if(filter==='images') arr=arr.filter(n=>!n.isDir&&['png','jpg','jpeg','gif','webp','bmp','svg'].includes(extOf(n.name)));
    else if(filter==='videos') arr=arr.filter(n=>!n.isDir&&['mp4','webm','mkv','mp3','wav','ogg','m4a'].includes(extOf(n.name)));
    else if(filter==='docs') arr=arr.filter(n=>!n.isDir&&['pdf','txt','md','doc','docx','csv','json'].includes(extOf(n.name)));
    else if(filter==='recent') { let all=[...nodes.values()].filter(n=>!n.isDir); all.sort((a,b)=>b.mtime-a.mtime); arr=all.slice(0,60); }
  }
  if(searchQ) { const q=searchQ.trim(); arr=arr.filter(x=>{ const nm=x.archiveEntry?x.archiveEntry.path:(x.name||''); return nm.includes(q); }); }
  const key=sortBy;
  arr.sort((a,b)=>{ const A=a.archiveEntry?{name:a.archiveEntry.path.split('/').filter(Boolean).pop()||'',size:a.archiveEntry.size,mtime:0,isDir:a.archiveEntry.isDir}:a;
    const B=b.archiveEntry?{name:b.archiveEntry.path.split('/').filter(Boolean).pop()||'',size:b.archiveEntry.size,mtime:0,isDir:b.archiveEntry.isDir}:b;
    if(A.isDir!==B.isDir) return A.isDir?-1:1;
    let v=0; if(key==='name') v=A.name.localeCompare(B.name,'ar'); else if(key==='size') v=(A.size||0)-(B.size||0); else if(key==='mtime') v=(A.mtime||0)-(B.mtime||0); else v=extOf(A.name).localeCompare(extOf(B.name));
    return v*sortDir; });
  return arr;
}
function render(){
  // crumbs
  const cb=$('#crumbs'); cb.innerHTML='';
  if(archiveCtx){ const b=document.createElement('button'); b.textContent='🗜️ '+archiveCtx.name; b.className='cur'; cb.appendChild(b);
    if(archiveCtx.innerPath){ archiveCtx.innerPath.split('/').forEach(p=>{ const s=document.createElement('span'); s.textContent='/'; cb.appendChild(s); const bb=document.createElement('button'); bb.textContent=p; cb.appendChild(bb); }); }
  } else if(filter==='recent'){ cb.innerHTML='<button class="cur">🕘 الأحدث</button>'; }
  else { const p=[{id:'root',name:'🏠 الرئيسية'},...pathOf(curDir)]; p.forEach((n,i)=>{ const b=document.createElement('button'); b.textContent=n.name; if(i===p.length-1)b.className='cur';
      b.onclick=()=>{ if(n.id){curDir=n.id; selected.clear(); render();} }; cb.appendChild(b); }); }
  $('#appbar-path').textContent = archiveCtx?('داخل أرشيف: '+archiveCtx.name):fullPath(curDir);
  // list
  const list=$('#filelist'); list.innerHTML=''; list.className=viewMode==='grid'?'grid':'';
  const arr=visibleNodes();
  $('#empty').classList.toggle('hidden',arr.length>0);
  for(const item of arr){
    const li=document.createElement('li'); li.className='file-row'+(isSel(item)?' selected':'');
    const isDir=item.archiveEntry?item.archiveEntry.isDir:item.isDir;
    const nm=item.archiveEntry?item.archiveEntry.path.split('/').filter(Boolean).pop():item.name;
    const sz=item.archiveEntry?item.archiveEntry.size:item.size;
    const mt=item.archiveEntry?Date.now():item.mtime;
    const [cls,ico]=iconFor(nm,isDir);
    li.innerHTML=`<div class="ficon ${cls}">${isDir?'📁':ico}</div><div class="fmeta"><div class="fname"></div><div class="fsub">${isDir?'مجلد':fmtSize(sz)+' • '+fmtDate(mt)}</div></div><input type="checkbox" class="fcheck" ${isSel(item)?'checked':''}><button class="fmore">⋮</button>`;
    li.querySelector('.fname').textContent=nm;
    li.onclick=e=>{ if(e.target.classList.contains('fcheck')||e.target.classList.contains('fmore')) return; toggleSel(item); if(!isDir&&!archiveCtx){ /* single tap opens */ } };
    li.ondblclick=()=>openItem(item);
    li.querySelector('.fcheck').onchange=e=>{ setSel(item,e.target.checked); };
    li.querySelector('.fmore').onclick=e=>{ e.stopPropagation(); showCtx(e.clientX,e.clientY,item); };
    // tap to open on icon/name double behavior: single click opens dirs & archives
    li.querySelector('.fmeta').onclick=()=>openItem(item);
    li.querySelector('.ficon').onclick=()=>openItem(item);
    // long-press
    let t; li.onpointerdown=()=>{ t=setTimeout(()=>{ setSel(item,true); navigator.vibrate&&navigator.vibrate(30); },550); };
    li.onpointerup=()=>clearTimeout(t); li.onpointerleave=()=>clearTimeout(t);
    li.oncontextmenu=e=>{ e.preventDefault(); showCtx(e.clientX,e.clientY,item); };
    list.appendChild(li);
  }
  // meta
  const kids=childrenOf(curDir); let total=0; for(const n of nodes.values()) if(!n.isDir) total+=n.size||0;
  $('#storage-count').textContent = arr.length+' عنصر';
  $('#storage-size').textContent = ' • '+fmtSize(total)+' مستخدم';
  $('#drawer-storage-text').textContent = fmtSize(total)+' / 100 م.ب (محلي)';
  $('#pie-fill').style.width=Math.min(100,total/(100*1048576)*100)+'%';
  renderSel(); renderPaste();
  $('#archive-banner').classList.toggle('hidden',!archiveCtx);
  if(archiveCtx) $('#archive-banner-text').textContent='📦 داخل الأرشيف: '+archiveCtx.name+(archiveCtx.innerPath?' / '+archiveCtx.innerPath:'');
  // access banner for data/obb
  const sp=curSpecial(); const ab=$('#access-banner');
  if(ab){ if(sp&&!archiveCtx){ ab.classList.remove('hidden');
      const linked=!!realHandles[sp];
      $('#access-text').textContent=((sp==='data')?t('access_data_title'):t('access_obb_title'))+' — '+(linked?t('access_linked'):t('access_notlinked'));
    } else ab.classList.add('hidden'); }
  saveTree();
}
function keyOf(x){ return x.archiveEntry?('arc:'+x.archiveEntry.path):x.id; }
function isSel(x){ return selected.has(keyOf(x)); }
function setSel(x,v){ v?selected.add(keyOf(x)):selected.delete(keyOf(x)); render(); }
function toggleSel(x){ const k=keyOf(x); selected.has(k)?selected.delete(k):selected.add(k); render(); }
function selectedItems(){ const arr=visibleNodes(); return arr.filter(isSel); }
function renderSel(){ const n=selected.size; $('#selbar').classList.toggle('hidden',n===0); $('#sel-count').textContent=n+' محدد'; }
function renderPaste(){ const p=$('#pastebar'); if(!clipboard){p.classList.add('hidden');return;} p.classList.remove('hidden'); $('#paste-text').textContent=(clipboard.mode==='cut'?'✂️ نقل ':'📋 نسخ ')+clipboard.keys.length+' عنصر — انتقل للمجلد ثم الصق'; }

// ---------- open / preview ----------
async function openItem(item){
  if(item.archiveEntry){ const e=item.archiveEntry;
    if(e.isDir){ archiveCtx.innerPath=e.path.replace(/\/$/,''); render(); }
    else { const nm=e.path.split('/').pop(); const ex=extOf(nm);
      if(['zip'].includes(ex)){ toast('الأرشيفات المتداخلة تُستخرج أولاً'); }
      else previewBytes(nm, e.data||new Uint8Array(), e.size); }
    return; }
  const n=item;
  if(n.isDir){ if(filter==='recent'){ // find actual parent
      } history.push(curDir); curDir=n.id; selected.clear(); render(); return; }
  const e=extOf(n.name);
  if(['zip','tar','gz','tgz'].includes(e)){ await openArchive(n); return; }
  if(['7z','rar'].includes(e)){ dlgInfo(n.name,'صيغة '+e.toUpperCase()+' غير مدعومة للفك في نسخة الويب.\n\nيمكنك تنزيل الملف أو عرضه كبيانات.\n usually ZArchiver على أندرويد يدعمها — هنا ندعم ZIP/TAR/GZ بالكامل.'); return; }
  const data=await idbGet(n.id)||new Uint8Array();
  previewBytes(n.name,data,n.size,n);
}
function previewBytes(name,u8,size,node){
  previewNode=node||null;
  const body=$('#preview-body'); body.innerHTML='';
  $('#preview-name').textContent=name;
  const e=extOf(name), m=mimeOf(name);
  if(previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
  if(['png','jpg','jpeg','gif','webp','bmp','svg'].includes(e)){ const b=new Blob([u8],{type:m}); previewBlobUrl=URL.createObjectURL(b); const im=document.createElement('img'); im.src=previewBlobUrl; body.appendChild(im); }
  else if(['mp4','webm'].includes(e)){ const b=new Blob([u8],{type:m}); previewBlobUrl=URL.createObjectURL(b); const v=document.createElement('video'); v.controls=true; v.src=previewBlobUrl; body.appendChild(v); }
  else if(['mp3','wav','ogg','m4a'].includes(e)){ const b=new Blob([u8],{type:m}); previewBlobUrl=URL.createObjectURL(b); const a=document.createElement('audio'); a.controls=true; a.style.width='100%'; a.src=previewBlobUrl; body.appendChild(a); }
  else if(e==='pdf'){ const b=new Blob([u8],{type:'application/pdf'}); previewBlobUrl=URL.createObjectURL(b); const f=document.createElement('iframe'); f.src=previewBlobUrl; f.style.cssText='width:100%;height:55vh;border:0;border-radius:10px;background:#fff'; body.appendChild(f); }
  else { let txt=''; try{ txt=dec.decode(u8.slice(0,200000)); if(txt.includes('\uFFFD')&&u8.length>50){ /* binary */ throw 0; } const pre=document.createElement('pre'); pre.textContent=u8.length>200000?txt+'\n…(معاينة أول 200KB)':txt; body.appendChild(pre); }
    catch{ const p=document.createElement('div'); p.innerHTML='ملف ثنائي — لا يمكن عرضه كنص.<br>الحجم: '+fmtSize(u8.length); body.appendChild(p); } }
  $('#preview-info').textContent=fmtSize(u8.length)+' • '+m;
  $('#preview-scrim').classList.remove('hidden');
  $('#preview-download').onclick=()=>downloadBlob(new Blob([u8],{type:m}),name);
}

// ---------- archives ----------
async function openArchive(node){
  const data=await idbGet(node.id);
  if(!data){ toast('تعذر قراءة الملف'); return; }
  prog('فتح الأرشيف…',10,'جاري التحليل');
  try{
    const e=extOf(node.name); let entries=[];
    if(e==='zip'){ if(typeof JSZip==='undefined') throw new Error('مكتبة JSZip غير محملة (تحقق من الإنترنت)');
      const z=await JSZip.loadAsync(data);
      const names=Object.keys(z.files);
      let i=0; for(const p of names){ const f=z.files[p]; const d=f.dir?new Uint8Array():await f.async('uint8array'); entries.push({path:p,isDir:f.dir,size:d.length,data:d}); prog('فتح الأرشيف…',10+80*i/names.length,p); i++; } }
    else if(e==='tar'){ entries=parseTar(data); }
    else if(e==='gz'||e==='tgz'){ const ds=new DecompressionStream('gzip'); const s=new Blob([data]).stream().pipeThrough(ds); const out=new Uint8Array(await new Response(s).arrayBuffer());
      if(e==='tgz'||isTar(out)) entries=parseTar(out); else entries=[{path:node.name.replace(/\.gz$/,'')||'file',isDir:false,size:out.length,data:out}]; }
    archiveCtx={fileId:node.id,name:node.name,entries,innerPath:''};
    selected.clear(); progDone(); render(); toast('تم فتح الأرشيف: '+entries.length+' عنصر');
  }catch(err){ progDone(); toast('فشل فتح الأرشيف: '+err.message); }
}
function isTar(u8){ return u8.length>262&&dec.decode(u8.slice(257,262))==='ustar'; }
function parseTar(u8){ const out=[]; let off=0; const td=dec;
  while(off+512<=u8.length){ const h=u8.slice(off,off+512); if(h.every(b=>b===0)) break;
    let name=td.decode(h.slice(0,100)).replace(/\0.*$/,''); const prefix=td.decode(h.slice(345,500)).replace(/\0.*$/,''); if(prefix) name=prefix+'/'+name;
    const sizeOct=td.decode(h.slice(124,136)).replace(/\0.*$/,'').trim(); const size=parseInt(sizeOct||'0',8)||0;
    const type=h[156]===0||h[156]===53?'0':String.fromCharCode(h[156]); const isDir=type==='5'||name.endsWith('/');
    const start=off+512, end=start+size; out.push({path:isDir&&!name.endsWith('/')?name+'/':name,isDir,size,data:u8.slice(start,Math.min(end,u8.length))});
    off=start+Math.ceil(size/512)*512; if(!name) break; }
  return out; }
function makeTar(files){ // files:[{path,U8}]
  const parts=[]; const te=enc;
  for(const f of files){ const h=new Uint8Array(512); const nm=te.encode(f.path.length>100?f.path.slice(-100):f.path);
    h.set(nm.slice(0,100),0); const mode=te.encode('0000777'); h.set(mode,100);
    const sz=f.data.length.toString(8).padStart(11,'0'); h.set(te.encode(sz),124); h.set(te.encode('        '),148); h[156]=f.isDir?53:48;
    h.set(te.encode('ustar  '),257);
    let sum=0; for(let i=0;i<512;i++) sum+=h[i]; const chk=sum.toString(8).padStart(6,'0')+'\0 '; h.set(te.encode(chk),148);
    parts.push(h,f.data); const pad=(512-f.data.length%512)%512; if(pad) parts.push(new Uint8Array(pad)); }
  parts.push(new Uint8Array(1024));
  let len=parts.reduce((a,p)=>a+p.length,0); const out=new Uint8Array(len); let o=0; for(const p of parts){out.set(p,o);o+=p.length;} return out; }
async function collectFiles(ids){ // -> [{path,data}]
  const out=[];
  async function walk(n,base){ if(n.isDir){ for(const c of childrenOf(n.id)) await walk(c,base+'/'+n.name); }
    else { const d=await idbGet(n.id)||new Uint8Array(); out.push({path:(base?base.replace(/^\//,'')+'/':'')+n.name,data:d,isDir:false}); } }
  for(const id of ids){ const n=getNode(id); if(n) await walk(n,''); }
  return out.map(f=>({...f,path:f.path.replace(/^\//,'')})); }
async function createArchive(ids,arcName,fmt){
  prog('إنشاء الأرشيف…',5,arcName);
  try{
    const files=await collectFiles(ids); let blob,name;
    if(fmt==='zip'){ if(typeof JSZip==='undefined') throw new Error('JSZip غير متوفر');
      const z=new JSZip(); files.forEach((f,i)=>{ z.file(f.path,f.data); prog('إنشاء الأرشيف…',5+80*i/files.length,f.path); });
      blob=await z.generateAsync({type:'blob',compression:'DEFLATE'},m=>prog('إنشاء الأرشيف…',m.percent,m.currentFile||'')); name=arcName.endsWith('.zip')?arcName:arcName+'.zip'; }
    else if(fmt==='tar'){ blob=new Blob([makeTar(files)],{type:'application/x-tar'}); name=arcName.endsWith('.tar')?arcName:arcName+'.tar'; }
    else { const tar=makeTar(files); const cs=new CompressionStream('gzip'); const s=new Blob([tar]).stream().pipeThrough(cs); blob=await new Response(s).blob(); name=arcName.replace(/\.(tar\.gz|tgz|gz)$/,'')+'.tar.gz'; }
    const buf=new Uint8Array(await blob.arrayBuffer());
    const n={id:uid(),name,parent:archiveCtx?curDir:curDir,isDir:false,size:buf.length,mtime:Date.now(),mime:mimeOf(name)};
    nodes.set(n.id,n); await idbSet(n.id,buf); selected.clear(); progDone(); render(); toast('تم إنشاء '+name); downloadBlob(blob,name);
  }catch(e){ progDone(); toast('فشل الضغط: '+e.message); }
}
async function extractArchive(allOrSel){
  if(!archiveCtx) return;
  let list = allOrSel==='all'?archiveCtx.entries:archiveCtx.entries.filter(e=>selected.has('arc:'+e.path)&&!e.isDir);
  if(!list.length){ toast('حدد ملفات داخل الأرشيف أولاً'); return; }
  list=list.filter(e=>!e.isDir);
  prog('استخراج…',10,list.length+' ملف');
  // ensure dest folder
  const destName=archiveCtx.name.replace(/\.(zip|tar|gz|tgz|tar\.gz)$/i,'')+'_مستخرج';
  let dest=childrenOf(curDir).find(n=>n.isDir&&n.name===destName);
  if(!dest){ dest={id:uid(),name:destName,parent:curDir,isDir:true,size:0,mtime:Date.now(),mime:''}; nodes.set(dest.id,dest); }
  let i=0; for(const e of list){ const parts=e.path.split('/').filter(Boolean); const fname=parts.pop();
    let parent=dest.id; for(const p of parts){ let d=childrenOf(parent).find(n=>n.isDir&&n.name===p); if(!d){ d={id:uid(),name:p,parent,isDir:true,size:0,mtime:Date.now(),mime:''}; nodes.set(d.id,d);} parent=d.id; }
    const nn={id:uid(),name:fname||'file',parent,isDir:false,size:e.data.length,mtime:Date.now(),mime:mimeOf(fname||'')}; nodes.set(nn.id,nn); await idbSet(nn.id,e.data);
    i++; prog('استخراج…',10+80*i/list.length,fname); }
  progDone(); render(); toast('تم استخراج '+list.length+' ملف إلى '+destName);
}

// ---------- file ops ----------
async function addFiles(fileList){
  prog('رفع…',5,fileList.length+' ملف');
  let i=0; for(const f of fileList){ const buf=new Uint8Array(await f.arrayBuffer());
    let nm=f.name, k=1; while(childrenOf(curDir).some(n=>n.name===nm)){ nm='('+k+')_'+f.name; k++; }
    const n={id:uid(),name:nm,parent:curDir,isDir:false,size:buf.length,mtime:f.lastModified||Date.now(),mime:f.type||mimeOf(f.name)};
    nodes.set(n.id,n); await idbSet(n.id,buf); i++; prog('رفع…',5+90*i/fileList.length,nm); }
  progDone(); render(); toast('تم رفع '+fileList.length+' ملف');
}
async function delIds(ids){ for(const id of ids){ const n=getNode(id); if(!n) continue;
    if(n.isDir){ for(const c of childrenOf(id)) await delIds([c.id]); }
    else await idbDel(id); nodes.delete(id); } selected.clear(); render(); }
async function pasteTo(dest){
  if(!clipboard) return; const {mode,keys}=clipboard;
  for(const id of keys){ const n=getNode(id); if(!n) continue;
    if(mode==='cut'){ n.parent=dest; n.mtime=Date.now(); }
    else { // deep copy
      async function clone(src,newParent,suffix){ const c={id:uid(),name:src.name,parent:newParent,isDir:src.isDir,size:src.size,mtime:Date.now(),mime:src.mime};
        if(!src.isDir){ const d=await idbGet(src.id)||new Uint8Array(); c.size=d.length; nodes.set(c.id,c); await idbSet(c.id,d); }
        else { // unique name
          let nm=src.name; if(suffix){ let k=1; while(childrenOf(newParent).some(x=>x.name===nm)){ nm=src.name+' نسخة'+(k>1?' '+k:''); k++; } c.name=nm; }
          nodes.set(c.id,c); for(const ch of childrenOf(src.id)) await clone(ch,c.id,false); } return c; }
      await clone(n,dest,true); } }
  if(mode==='cut') clipboard=null; render(); toast('تم اللصق');
}

// ---------- dialogs ----------
function dlg(title,bodyHTML,buttons){ $('#dlg-title').textContent=title; $('#dlg-body').innerHTML=bodyHTML; const A=$('#dlg-actions'); A.innerHTML='';
  for(const b of buttons){ const btn=document.createElement('button'); btn.textContent=b.label; if(b.primary)btn.className='primary'; btn.onclick=()=>{ if(b.onClick) b.onClick(); if(!b.keep) closeDlg(); }; A.appendChild(btn); }
  $('#dlg-scrim').classList.remove('hidden'); }
function closeDlg(){ $('#dlg-scrim').classList.add('hidden'); }
function dlgInfo(title,msg){ dlg(title,`<div style="white-space:pre-wrap;font-size:14px"></div>`,[{label:'حسناً',primary:true}]); $('#dlg-body div').textContent=msg; }
function prog(t,p,txt){ $('#prog-scrim').classList.remove('hidden'); $('#prog-title').textContent=t; $('#prog-fill').style.width=p+'%'; $('#prog-text').textContent=txt||''; }
function progDone(){ $('#prog-scrim').classList.add('hidden'); }

function askName(title,def,okLabel,cb,opts={}){
  dlg(title,`${opts.hint?`<div style="font-size:12px;color:var(--muted)">${opts.hint}</div>`:''}<input type="text" id="dlg-inp" value=""><${opts.select?`select id="dlg-fmt">${opts.select}</select>`:''}`,[{label:'إلغاء'},{label:okLabel,primary:true,onClick:()=>{ const v=$('#dlg-inp').value.trim(); const f=$('#dlg-fmt')?$('#dlg-fmt').value:null; if(!v){toast('أدخل اسماً');return;} cb(v,f); }}]);
  const i=$('#dlg-inp'); i.value=def; setTimeout(()=>{i.focus();i.select();},50); }

// ---------- context menu ----------
function hideMenus(){ ['#ctx','#sort-menu','#top-menu'].forEach(s=>$(s).classList.add('hidden')); }
function showCtx(x,y,item){
  hideMenus(); const c=$('#ctx'); c.innerHTML='';
  const isA=!!item.archiveEntry;
  const acts = isA?[
    ['👁️ معاينة / فتح',()=>openItem(item)],
    ['⬇️ استخراج المحدد هنا',()=>{ selected.clear(); selected.add(keyOf(item)); extractArchive('sel'); }],
    ['📦 استخراج الكل',()=>extractArchive('all')],
  ]:[
    ['👁️ فتح / معاينة',()=>openItem(item)],
    ['⬇️ تنزيل',()=>dlItems([item])],
    ['🗜️ ضغط إلى ZIP',()=>askName('ضغط إلى ZIP',(item.name||'archive')+'.zip','ضغط',(v)=>createArchive([item.id],v,'zip'))],
    ['✏️ إعادة تسمية',()=>renameItem(item)],
    ['📋 نسخ',()=>{clipboard={mode:'copy',keys:[item.id]};renderPaste();toast('تم النسخ — اختر مجلداً والصق');}],
    ['✂️ قص',()=>{clipboard={mode:'cut',keys:[item.id]};renderPaste();}],
    ['ℹ️ خصائص',()=>propsItem(item)],
    ['🗑️ حذف',()=>confirmDel([item.id])],
  ];
  for(const [l,fn] of acts){ const b=document.createElement('button'); b.textContent=l; b.onclick=()=>{hideMenus();fn();}; c.appendChild(b); }
  c.classList.remove('hidden'); c.style.top=Math.min(innerHeight-acts.length*40-20,y)+'px'; c.style.left=Math.max(8,Math.min(innerWidth-210,x-180))+'px';
}
function renameItem(item){ if(item.archiveEntry){toast('لا يمكن التسمية داخل الأرشيف');return;}
  askName('إعادة تسمية',item.name,'حفظ',v=>{ item.name=v; item.mtime=Date.now(); render(); }); }
function propsItem(item){ if(item.archiveEntry){ const e=item.archiveEntry; dlgInfo('خصائص',`الاسم: ${e.path}\nالنوع: ${e.isDir?'مجلد':'ملف'}\nالحجم: ${fmtSize(e.size)}`); return; }
  (async()=>{ let sz=item.size, cnt='—'; if(item.isDir){ let q=[item.id],files=0,bytes=0; while(q.length){ const id=q.pop(); for(const c of childrenOf(id)){ if(c.isDir)q.push(c.id); else {files++;bytes+=c.size||0;} } } sz=bytes; cnt=files+' ملف'; }
    dlg('خصائص: '+item.name,`<div class="kv"><span>النوع</span><b>${item.isDir?'مجلد':'ملف ('+extOf(item.name)+')'}</b></div><div class="kv"><span>الحجم</span><b>${fmtSize(sz)}</b></div><div class="kv"><span>المسار</span><b style="font-size:11px">${fullPath(item.id)}</b></div><div class="kv"><span>التاريخ</span><b>${fmtDate(item.mtime)}</b></div>${item.isDir?`<div class="kv"><span>المحتوى</span><b>${cnt}</b></div>`:''}`,[{label:'إغلاق',primary:true}]); })(); }
function confirmDel(ids){ dlg('تأكيد الحذف',`<div>حذف ${ids.length} عنصر نهائياً؟ لا يمكن التراجع.</div>`,[{label:'إلغاء'},{label:'🗑️ حذف',primary:true,onClick:()=>delIds(ids)}]); }
async function dlItems(items){
  const real=items.filter(x=>!x.archiveEntry);
  const arc=items.filter(x=>x.archiveEntry);
  for(const a of arc){ const e=a.archiveEntry; if(!e.isDir) downloadBlob(new Blob([e.data]),e.path.split('/').pop()); }
  if(!real.length) return;
  if(real.length===1&&!real[0].isDir){ const n=real[0]; const d=await idbGet(n.id)||new Uint8Array(); downloadBlob(new Blob([d],{type:n.mime}),n.name); }
  else { const ids=real.map(n=>n.id); prog('تجهيز التنزيل…',20,'ضغط'); const files=await collectFiles(ids);
    if(typeof JSZip==='undefined'){toast('JSZip غير متوفر');progDone();return;}
    const z=new JSZip(); files.forEach(f=>z.file(f.path,f.data)); const b=await z.generateAsync({type:'blob'}); progDone(); downloadBlob(b,'zarchiver-export.zip'); }
}

// ---------- events ----------
function bind(){
  $('#btn-menu').onclick=()=>{ $('#drawer').classList.toggle('open'); $('#drawer-scrim').classList.toggle('hidden',!$('#drawer').classList.contains('open')); };
  $('#drawer-scrim').onclick=()=>{ $('#drawer').classList.remove('open'); $('#drawer-scrim').classList.add('hidden'); };
  $$('#drawer-nav .nav-item').forEach(b=>b.onclick=()=>{ $$('#drawer-nav .nav-item').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    filter=b.dataset.nav; archiveCtx=null; selected.clear();
    if(filter==='settings'){ showSettings(); return; } if(filter==='about'){ showAbout(); return; }
    if(filter==='android_data'){ goSpecial('data'); return; }
    if(filter==='android_obb'){ goSpecial('obb'); return; }
    if(filter==='home'){curDir='root';} $('#drawer').classList.remove('open'); $('#drawer-scrim').classList.add('hidden'); render(); });
  $('#btn-lang').onclick=()=>{ setLang(lang==='ar'?'en':'ar'); toast(lang==='ar'?'تم التبديل إلى العربية':'Switched to English'); };
  $('#btn-search').onclick=()=>{ $('#searchbar').classList.toggle('hidden'); $('#search-input').focus(); };
  $('#search-close').onclick=()=>{ $('#searchbar').classList.add('hidden'); searchQ=''; $('#search-input').value=''; render(); };
  $('#search-input').oninput=e=>{ searchQ=e.target.value; render(); };
  $('#btn-view').onclick=()=>{ viewMode=viewMode==='list'?'grid':'list'; render(); };
  $('#btn-sort').onclick=e=>{ hideMenus(); const m=$('#sort-menu'); m.classList.remove('hidden'); m.style.top='60px'; m.style.left='12px'; e.stopPropagation(); };
  $$('#sort-menu button').forEach(b=>b.onclick=()=>{ const s=b.dataset.sort||b.dataset.sortdir; if(s==='toggle')sortDir*=-1; else sortBy=s; hideMenus(); render(); });
  $('#btn-more').onclick=e=>{ hideMenus(); const m=$('#top-menu'); m.classList.remove('hidden'); m.style.top='60px'; m.style.left='12px'; e.stopPropagation(); };
  $$('#top-menu button').forEach(b=>b.onclick=()=>{ const t=b.dataset.top; hideMenus();
    if(t==='select-all'){ visibleNodes().forEach(x=>selected.add(keyOf(x))); render(); }
    if(t==='lang'){ setLang(lang==='ar'?'en':'ar'); return; }
    if(t==='download-dir'){ dlItems([{...getNode(curDir)}].filter(Boolean).length?[{id:curDir}].map(()=>visibleNodes().filter(x=>!x.archiveEntry)):[]); const ids=childrenOf(curDir).map(n=>n.id); if(ids.length)createArchive(ids,pathOf(curDir).pop()?.name||'backup','zip'); else toast('المجلد فارغ'); }
    if(t==='paste'&&clipboard) pasteTo(curDir);
    if(t==='theme'){ const h=document.documentElement; h.dataset.theme=h.dataset.theme==='dark'?'':'dark'; localStorage.setItem(LS_THEME,h.dataset.theme||''); }
    if(t==='about') showAbout(); });
  document.addEventListener('click',e=>{ if(!e.target.closest('#ctx,#sort-menu,#top-menu,.fmore,#btn-sort,#btn-more')) hideMenus(); });

  // fab
  $('#fab').onclick=()=>$('#fab-menu').classList.toggle('hidden');
  $$('#fab-menu button').forEach(b=>b.onclick=()=>{ $('#fab-menu').classList.add('hidden'); const k=b.dataset.fab;
    if(k==='folder') askName('مجلد جديد','مجلد جديد','إنشاء',v=>{ nodes.set(uid(),{id:uid(),name:v,parent:curDir,isDir:true,size:0,mtime:Date.now(),mime:''}); render(); });
    // fix: uid twice — create properly:
    if(k==='folder'){} // handled below correctly
    if(k==='file') askName('ملف نصي جديد','جديد.txt','إنشاء',async v=>{ const n={id:uid(),name:v,parent:curDir,isDir:false,size:0,mtime:Date.now(),mime:'text/plain'}; nodes.set(n.id,n); await idbSet(n.id,enc.encode('')); render(); });
    if(k==='upload') $('#file-input').click();
    if(k==='zip'||k==='tar'){ const items=selectedItems().filter(x=>!x.archiveEntry); const ids=items.length?items.map(x=>x.id):childrenOf(curDir).map(n=>n.id);
      if(!ids.length){toast('المجلد فارغ — ارفع ملفات أولاً');return;} askName(k==='zip'?'أرشيف ZIP':'أرشيف TAR','archive_'+new Date().toISOString().slice(0,10),'ضغط',(v)=>createArchive(ids,v,k),{hint:items.length?items.length+' عنصر محدد':'سيتم ضغط كل محتويات المجلد'}); }
  });
  $('#file-input').onchange=e=>{ if(e.target.files.length) addFiles([...e.target.files]); e.target.value=''; };
  // selbar
  $$('#selbar button').forEach(b=>b.onclick=()=>{ const a=b.dataset.act; const items=selectedItems();
    if(a==='clear') selected.clear(),render();
    if(a==='delete'){ const ids=items.filter(x=>!x.archiveEntry).map(x=>x.id); if(items.some(x=>x.archiveEntry)){toast('حدد استخراج بدل الحذف داخل الأرشيف');return;} if(ids.length)confirmDel(ids); }
    if(a==='copy'){ const ids=items.filter(x=>!x.archiveEntry).map(x=>x.id); clipboard={mode:'copy',keys:ids}; renderPaste(); toast('تم النسخ'); }
    if(a==='cut'){ const ids=items.filter(x=>!x.archiveEntry).map(x=>x.id); clipboard={mode:'cut',keys:ids}; renderPaste(); }
    if(a==='download') dlItems(items);
    if(a==='zip'){ const ids=items.filter(x=>!x.archiveEntry).map(x=>x.id); if(!ids.length){toast('لا عناصر صالحة');return;} askName('ضغط المحدد','selected.zip','ضغط',v=>createArchive(ids,v,'zip')); }
  });
  $('#btn-paste').onclick=()=>pasteTo(curDir);
  $('#btn-paste-cancel').onclick=()=>{ clipboard=null; renderPaste(); };
  $('#archive-close').onclick=()=>{ archiveCtx=null; selected.clear(); render(); };
  $('#btn-link-folder').onclick=()=>linkRealFolder();
  $('#btn-access-help').onclick=()=>showAccessHelp();
  $('#dir-input').onchange=async e=>{ const files=[...e.target.files]; const dest=window._linkDest||curDir;
    if(files.length){ prog(lang==='ar'?'استيراد…':'Importing…',10,files.length+' files');
      // webkitRelativePath like "data/com.app/file"
      let i=0; const dirCache={'':dest};
      for(const f of files){ const rel=f.webkitRelativePath||f.name; const parts=rel.split('/').slice(1); // drop top folder
        let parent=dest; let prefix='';
        for(let k=0;k<parts.length-1;k++){ prefix+=parts[k]+'/';
          if(!dirCache[prefix]){ let d=childrenOf(parent).find(n=>n.isDir&&n.name===parts[k]); if(!d){ d={id:uid(),name:parts[k],parent,isDir:true,size:0,mtime:Date.now(),mime:''}; nodes.set(d.id,d);} dirCache[prefix]=d.id; }
          parent=dirCache[prefix]; }
        const buf=new Uint8Array(await f.arrayBuffer());
        const n={id:uid(),name:parts[parts.length-1]||f.name,parent,isDir:false,size:buf.length,mtime:f.lastModified||Date.now(),mime:f.type||mimeOf(f.name)};
        nodes.set(n.id,n); await idbSet(n.id,buf); i++; prog(lang==='ar'?'استيراد…':'Importing…',10+80*i/files.length,n.name); }
      realHandles[window._linkKind||'data']={fallback:true}; progDone(); render(); toast(lang==='ar'?'تم الاستيراد: ':'Imported: '+files.length); }
    e.target.value=''; };
  $('#dlg-scrim').addEventListener('click',e=>{ if(e.target.id==='dlg-scrim') closeDlg(); });
  $('#preview-close').onclick=()=>$('#preview-scrim').classList.add('hidden');
  $('#preview-scrim').addEventListener('click',e=>{ if(e.target.id==='preview-scrim') $('#preview-scrim').classList.add('hidden'); });
  $('#btn-reset-demo').onclick=async()=>{ localStorage.removeItem(LS_KEY); await seed(); archiveCtx=null;selected.clear();clipboard=null;curDir='root'; render(); toast('تمت استعادة ملفات العرض'); };
  // drag & drop
  const hint=$('#drop-hint');
  ['dragover','dragenter'].forEach(ev=>document.addEventListener(ev,e=>{ e.preventDefault(); hint.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev=>document.addEventListener(ev,e=>{ e.preventDefault(); hint.classList.remove('over'); }));
  document.addEventListener('drop',e=>{ if(e.dataTransfer?.files?.length&&!archiveCtx) addFiles([...e.dataTransfer.files]); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ hideMenus(); closeDlg(); $('#preview-scrim').classList.add('hidden'); } });
}
function showSettings(){
  const ar=lang!=='en';
  dlg(ar?'⚙️ الإعدادات':'⚙️ Settings',`<label>${t('dlg_lang')}<select id="s-lang"><option value="ar">العربية</option><option value="en">English</option></select></label><label>الترتيب الافتراضي / Sort<select id="s-sort"><option value="name">الاسم / Name</option><option value="mtime">التاريخ / Date</option><option value="size">الحجم / Size</option></select></label><label>طريقة العرض / View<select id="s-view"><option value="list">قائمة / List</option><option value="grid">شبكة / Grid</option></select></label><button id="s-wipe" style="background:#ffebee;border:1px solid #ef9a9a;border-radius:9px;padding:9px;cursor:pointer">🗑️ مسح كل البيانات المحلية</button>`,[{label:t('close'),primary:true}]);
  $('#s-lang').value=lang; $('#s-sort').value=sortBy; $('#s-view').value=viewMode;
  $('#s-lang').onchange=e=>setLang(e.target.value);
  $('#s-sort').onchange=e=>{sortBy=e.target.value;render();}; $('#s-view').onchange=e=>{viewMode=e.target.value;render();};
  $('#s-wipe').onclick=async()=>{ if(confirm('مسح كل الملفات؟')){ localStorage.removeItem(LS_KEY); try{(await idb()).transaction('files','readwrite').objectStore('files').clear();}catch{} await seed(); closeDlg(); render(); } };
}
function showAbout(){
  dlgInfo('حول ZArchiver Web','ZArchiver Web — نسخة ويب مستوحاة من تطبيق ZArchiver لأندرويد.\n\n✔ مدير ملفات كامل (إنشاء/نسخ/نقل/حذف/بحث)\n✔ ضغط وفك ZIP / TAR / TAR.GZ بالكامل داخل المتصفح\n✔ معاينة صور ونصوص وفيديو وصوت وPDF\n✔ حفظ محلي (IndexedDB) + تنزيل ورفع\n✔ واجهة عربية RTL + وضع ليلي\n\nالصيغ 7Z/RAR للعرض فقط في نسخة الويب.');
}

// fix fab folder double-uid bug via patch
const _origBind=bind;

// ---------- init ----------
(async function init(){
  document.documentElement.dataset.theme=localStorage.getItem(LS_THEME)||'';
  document.documentElement.lang=lang; document.documentElement.dir=(lang==='ar')?'rtl':'ltr';
  const ok=loadTree();
  // load blobs lazily — tree only stores metadata; files already in idb
  if(!ok||![...nodes.values()].length) await seed();
  else { // ensure root exists
    if(!nodes.get('root')) await seed();
    curDir=nodes.get(curDir)?curDir:'root';
  }
  ensureSpecialFolders();
  // monkey-patch folder creation (correct single uid)
  bind(); setLang(lang);
  // override folder button to correct behavior
  $$('#fab-menu button')[0].onclick=()=>{ $('#fab-menu').classList.add('hidden'); askName('مجلد جديد','مجلد جديد','إنشاء',v=>{ const n={id:uid(),name:v,parent:curDir,isDir:true,size:0,mtime:Date.now(),mime:''}; nodes.set(n.id,n); render(); }); };
  render();
})();
