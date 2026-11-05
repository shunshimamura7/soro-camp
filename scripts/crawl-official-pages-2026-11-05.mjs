// 公式ページの原文から5項目の記述を引用つきで抜き出す（推測しない・書き換えない）
import fs from 'node:fs';
const ROOT='/home/claude/soro-camp';
const data=JSON.parse(fs.readFileSync(ROOT+'/data/campgrounds.json','utf8'));
const list=(Array.isArray(data)?data:data.campgrounds).filter(c=>c.status==='active'&&c.type!=='wild'&&(c.officialUrl||c.reservationUrl));
const OUT=process.argv[2]||'/home/claude/scr/pages-v2.jsonl';
const done=new Set(fs.existsSync(OUT)?fs.readFileSync(OUT,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).slug):[]);
const SUBKW=/料金|利用|案内|ご利用|FAQ|よくある|質問|guide|price|fee|faq|rule|ルール|注意|access|アクセス|交通|施設|facility|about|サイト|site|map|マップ|設備|qa|q&a|規約|ソロ/i;
function decode(buf,ct){
  let cs=(/charset=([\w-]+)/i.exec(ct||'')||[])[1];
  if(!cs){const head=buf.subarray(0,3000).toString('latin1');cs=(/charset=["']?([\w-]+)/i.exec(head)||[])[1];}
  cs=(cs||'utf-8').toLowerCase();
  if(/sjis|shift|x-sjis|windows-31j|cp932/.test(cs))cs='shift_jis';
  if(/euc/.test(cs))cs='euc-jp';
  try{return new TextDecoder(cs).decode(buf);}catch{return new TextDecoder('utf-8').decode(buf);}
}
async function get(url){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),15000);
  try{const r=await fetch(url,{signal:ctl.signal,redirect:'follow',headers:{'user-agent':'Mozilla/5.0 soro-camp-factcheck','accept-language':'ja'}});
    if(!r.ok)return null;const ct=r.headers.get('content-type')||'';if(!/html|text/.test(ct)&&ct)return null;
    const buf=Buffer.from(await r.arrayBuffer());return {url:r.url,html:decode(buf,ct)};}
  catch{return null}finally{clearTimeout(t)}
}
function text(html){return html.replace(/<!--[\s\S]*?-->/g,' ').replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi,' ').replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|div|li|tr|h\d|dd|dt|td|th)>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/[ \t　]+/g,' ').split('\n').map(s=>s.trim()).filter(Boolean);}
const RX={
 checkin:/(チェック\s*イン|チェック\s*アウト|イン\s*[:：]?\s*\d{1,2}[:：時]|アウト\s*[:：]?\s*\d{1,2}[:：時]|IN\s*\d{1,2}:\d{2}|OUT\s*\d{1,2}:\d{2}|受付時間|入場時間|退場)/i,
 bike:/(バイク|二輪|オートバイ|単車|自動二輪|ツーリング)/,
 jikabi:/(直火)/,
 manager:/(管理人|管理棟|常駐|夜間|ゲート|門限|消灯|静寂時間|クワイエット)/,
 women:/(女性専用|女性限定|女性のみ|女子|レディース|女性用)/,
};
function links(html,base){const out=new Set();const h=new URL(base).host;for(const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)){try{const u=new URL(m[1],base);if(u.host!==h||!/^https?:/.test(u.protocol))continue;if(/\.(pdf|jpg|png|gif|zip)$/i.test(u.pathname))continue;const label=m[2].replace(/<[^>]+>/g,'');if(SUBKW.test(label)||SUBKW.test(u.pathname))out.add(u.href.split('#')[0]);}catch{}}return [...out].slice(0,9);}
async function one(c){
  const start=c.officialUrl||c.reservationUrl;const pages=[];
  const top=await get(start);if(!top)return {slug:c.slug,ok:false,start};
  pages.push(top);
  for(const u of links(top.html,top.url)){if(pages.some(p=>p.url===u))continue;const p=await get(u);if(p)pages.push(p);}
  return {slug:c.slug,ok:true,start,pages:pages.map(p=>({url:p.url,lines:text(p.html).filter(l=>l.length<400)}))};
  const facts={};
  for(const p of pages){const lines=text(p.html);
    for(const [k,rx] of Object.entries(RX)){lines.forEach((l,ix)=>{if(l.length>220||l.length<2)return;if(!rx.test(l))return;
      (facts[k]??=[]);if(facts[k].length>=8||facts[k].some(f=>f.q===l))return;facts[k].push({q:l,next:lines.slice(ix+1,ix+3).filter(x=>x.length<160),url:p.url});});}}
  return {slug:c.slug,ok:true,start,pages:pages.map(p=>p.url),facts};
}
const todo=list.filter(c=>!done.has(c.slug));
console.log('todo',todo.length);
let i=0;const N=8;
async function worker(){while(i<todo.length){const c=todo[i++];const r=await one(c);fs.appendFileSync(OUT,JSON.stringify(r)+'\n');}}
await Promise.all(Array.from({length:N},worker));
console.log('done');
