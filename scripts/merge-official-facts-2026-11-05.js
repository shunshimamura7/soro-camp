const fs=require('fs');
const raw=Object.fromEntries(fs.readFileSync('facts-raw.jsonl','utf8').trim().split('\n').map(JSON.parse).filter(x=>x.ok).map(x=>[x.slug,x]));
const data=require('/home/claude/soro-camp/data/campgrounds.json');const by=Object.fromEntries(data.map(c=>[c.slug,c]));
const BAD=/nap-camp\.com|hinata|camp-hack|camphack|rakuten|jalan|ikyu|asoview/;
const out={};const stat={kept:{},drop:{}};
const texts=(slug,url)=>Object.values(raw[slug].facts).flat().filter(f=>f.url===url).map(f=>[f.q,...(f.next||[])].join(' '));
const okQuote=(slug,q,url)=>q&&q.length>=6&&texts(slug,url).some(t=>t.includes(q));
const STAT={checkin:['記載あり'],bike:['可','不可','制限あり'],jikabi:['可','不可','一部可'],manager:['24時間常駐','夜間不在','日中のみ','夜間ゲート閉鎖'],women:['女性専用エリア・サイト','女性専用プラン','女性専用の設備']};
const drop=(k,why)=>{stat.drop[k+':'+why]=(stat.drop[k+':'+why]||0)+1};
for(const f of fs.readdirSync('facts-out').filter(f=>/^b\d\d\.json$/.test(f)).sort()){
  for(const r of JSON.parse(fs.readFileSync('facts-out/'+f,'utf8'))){
    if(!raw[r.slug]||!by[r.slug]){drop('all','noslug');continue;}
    const rec={};
    for(const k of Object.keys(STAT)){const x=r[k];if(!x)continue;
      if(!STAT[k].includes(x.status)){drop(k,'status');continue;}
      if(BAD.test(x.url||'')){drop(k,'resv');continue;}
      if(!okQuote(r.slug,x.quote,x.url)){drop(k,'quote');continue;}
      const v={status:x.status,quote:x.quote,url:x.url};
      if(k==='checkin'){
        const pool=[x.quote];if(x.quote_out&&okQuote(r.slug,x.quote_out,x.url)){pool.push(x.quote_out);v.quoteOut=x.quote_out;}
        const has=s=>s&&pool.some(p=>p.includes(s)||p.replace(/[：]/g,':').includes(s.replace(/[：]/g,':')));
        if(has(x.in))v.in=x.in; if(has(x.out))v.out=x.out;
        if(!v.in&&!v.out){drop(k,'notime');continue;}
      }
      if(k==='bike'&&x.price&&x.quote.includes(x.price.replace(/^[＋+]/,'')))v.price=x.price;
      if(k==='manager'&&x.status==='24時間常駐'&&!/24時間|夜間|夜も|宿直|駐在|夜中|24h/i.test(x.quote)){drop(k,'weak24');continue;}
      rec[k]=v;stat.kept[k]=(stat.kept[k]||0)+1;
    }
    if(Object.keys(rec).length)out[r.slug]=rec;
  }
}
const doc={fetchedAt:'2026-11-05',note:'各施設の公式サイトの原文から抜き出した記述。quote は原文そのまま、url は取得したページ。推測は入れていない。',facts:out};
fs.writeFileSync('/home/claude/soro-camp/data/official-facts-2026-11-05.json',JSON.stringify(doc,null,1)+'\n');
console.log(Object.keys(out).length,stat);
