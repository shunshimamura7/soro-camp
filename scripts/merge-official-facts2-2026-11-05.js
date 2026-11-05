const fs=require('fs');
const ROOT='/home/claude/soro-camp';
const P=ROOT+'/data/official-facts-2026-11-05.json';
const doc=JSON.parse(fs.readFileSync(P,'utf8'));const F=doc.facts;
const pages={};for(const l of fs.readFileSync('pages-v2.jsonl','utf8').trim().split('\n')){const x=JSON.parse(l);if(x.ok)pages[x.slug]=x.pages;}
const raw1=Object.fromEntries(fs.readFileSync('facts-raw.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(x=>x.ok).map(x=>[x.slug,x]));
const okQuote=(slug,q,url)=>{if(!q||q.length<6)return false;
  const ps=(pages[slug]||[]).filter(p=>p.url===url);for(const p of ps)for(let i=0;i<p.lines.length;i++){const t=[p.lines[i],...p.lines.slice(i+1,i+3).filter(s=>s.length<160)].join(' ');if(t.includes(q))return true;}
  const r=raw1[slug];if(r)for(const f of Object.values(r.facts).flat())if(f.url===url&&[f.q,...(f.next||[])].join(' ').includes(q))return true;return false;};
const z2h=s=>s.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/：/g,':').replace(/\s+/g,'');
const TIME='((?:午前|午後)?[0-9]{1,2}(?::[0-9]{2}|時(?:[0-9]{1,2}分?)?)(?:[〜～~\\-ー](?:午前|午後)?[0-9]{1,2}(?::[0-9]{2}|時(?:[0-9]{1,2}分?)?))?|[〜～~](?:午前|午後)?[0-9]{1,2}(?::[0-9]{2}|時(?:[0-9]{1,2}分?)?))';
const pick=(q,kw)=>{const n=z2h(q);const m=new RegExp('(?:'+kw+')[^0-9午〜～~]{0,6}'+TIME,'i').exec(n);return m?m[1]:undefined;};
const stat={};const bump=k=>stat[k]=(stat[k]||0)+1;
// 1) checkin の in/out を検査：値が引用の中にあり、その手前に「イン/アウト」の語があるものだけ残す
const kwBefore=(q,val,kw)=>{const n=z2h(q),v=z2h(val||'');if(!v)return false;let i=n.indexOf(v);while(i>=0){if(new RegExp(kw,'i').test(n.slice(Math.max(0,i-40),i)))return true;i=n.indexOf(v,i+1);}return false;};
const KIN='チェックイン|IN|イン(?!タ)|入場|受付|サイトに?お?入',KOUT='チェックアウト|OUT|アウト|退場|退出';
const fixCheckin=(c,stat)=>{const src=[c.quote,c.quoteOut].filter(Boolean).join(' ');
  const i=kwBefore(src,c.in,KIN)?c.in:pick(src,KIN);const o=kwBefore(src,c.out,KOUT)?c.out:pick(src,KOUT);
  if(i!==c.in||o!==c.out)bump('checkin-refix');
  if(i)c.in=i;else delete c.in;if(o)c.out=o;else delete c.out;return Boolean(c.in||c.out);};
for(const [s,r] of Object.entries(F)){if(r.checkin&&!fixCheckin(r.checkin)){delete r.checkin;bump('checkin-drop');}}
// 2) 既存の読み違いを外す
for(const [s,r] of Object.entries(F)){
  if(r.jikabi&&/準備中|予定|休止/.test(r.jikabi.quote)){delete r.jikabi;bump('jikabi-pending');}
  if(r.bike&&/時.{0,20}(出入|移動)/.test(r.bike.quote)){delete r.bike;bump('bike-time');}
  if(r.women&&/風呂|露天|浴/.test(r.women.quote)){delete r.women;bump('women-bath');}
  if(r.manager?.status==='夜間ゲート閉鎖'){r.nightGate={...r.manager,status:'夜間は出入口を閉める'};delete r.manager;bump('gate-split');}
  if(r.manager&&/緊急|際の/.test(r.manager.quote)&&r.manager.status==='夜間不在'){delete r.manager;bump('mgr-generic');}
}
// 3) 2回目の分類を足す
const KEYS={checkin:['記載あり'],solo:['ソロ専用サイト','ソロ料金・プラン','ソロ利用可の明記'],ground:['区画サイト','フリーサイト','区画とフリー両方'],
  manager:['24時間常駐','夜間不在','日中のみ'],nightGate:['夜間は出入口を閉める'],access:null,road:null,toilet:null,shower:null};
const tokOk=(status,q)=>{const n=z2h(q);const toks=z2h(status).split(/から|より|まで|約|で|の|は|が|・|、|\(|\)|（|）|／|\/|～|〜|あり|なし|可|利用/).filter(t=>t.length>=2);return toks.length>0&&toks.every(t=>n.includes(t));};
for(const f of fs.readdirSync('facts-out2').filter(f=>/^b\d\d\.json$/.test(f)).sort()){
  for(const r of JSON.parse(fs.readFileSync('facts-out2/'+f,'utf8'))){
    for(const k of Object.keys(KEYS)){const x=r[k];if(!x)continue;
      if(/nap-camp\.com/.test(x.url||'')){bump(k+':resv');continue;}
      if(!okQuote(r.slug,x.quote,x.url)){bump(k+':quote');continue;}
      if(KEYS[k]&&!KEYS[k].includes(x.status)){bump(k+':status');continue;}
      if(!KEYS[k]&&(!x.status||x.status.length>22||!tokOk(x.status,x.quote))){bump(k+':freetext');continue;}
      if(/準備中|予定|休止/.test(x.quote)){bump(k+':pending');continue;}
      const v={status:x.status,quote:x.quote,url:x.url};
      if(k==='checkin'){v.in=x.in;v.out=x.out;if(!fixCheckin(v)){bump('checkin2:notime');continue;}if(F[r.slug]?.checkin)continue;}
      if(k==='access'&&['car','train'].includes(x.kind))v.kind=x.kind;
      if(k==='ground'){if(x.surface&&z2h(x.quote).includes(z2h(x.surface)))v.surface=x.surface;if(x.sites&&z2h(x.quote).includes(z2h(x.sites)))v.sites=x.sites;}
      if(k==='manager'&&x.status==='24時間常駐'&&!/24時間|夜間|夜も|宿直|駐在|夜中|24h/i.test(x.quote)){bump('mgr2:weak');continue;}
      if(k==='manager'&&F[r.slug]?.manager&&F[r.slug].manager.status!==x.status){bump('mgr2:conflict');delete F[r.slug].manager;continue;}
      (F[r.slug]??={})[k]=v;bump(k+':ok');
    }
  }
}
for(const s of Object.keys(F))if(!Object.keys(F[s]).length)delete F[s];
fs.writeFileSync(P,JSON.stringify(doc,null,1)+'\n');
console.log(Object.keys(F).length,stat);
