// 審査2回目のデータ指摘の修正（公式の数字の取り違え・運営メモの混入）
const fs=require('fs');const P='data/campgrounds.json';
const raw=fs.readFileSync(P,'utf8');const d=JSON.parse(raw);
const by=s=>{const c=d.find(x=>x.slug===s);if(!c)throw new Error(s);return c};
// 1) 要問合せなのに priceVerified=true の8件 → 料金未確認に戻す
for(const s of ['ikenoya-family','kunowaki-shinsui','yagi-camp','mitsuboshi-auto','fudonotaki-auto','apt-ichishiro','fukushigawa-auto','nekumasanso-auto']){
  const c=by(s);if(c.priceVerified!==true||c.priceMin!==0)throw new Error('unexpected '+s);
  c.priceVerified=false;c.needsPrice=true;c.priceMax=0;}
// 2) 市内料金を priceMin にしていた5件 → 誰でも払える市外料金（priceNote の公式引用どおり）
for(const [s,v] of [['shimosa-sports-park',330],['sakatagaike-park',300],['kidachi-camp-kannami',1400],['ichihara-quad-forest',1230],['shimada-yamanoie',2500]]){
  const c=by(s);if(c.priceMax!==v)throw new Error('max mismatch '+s);c.priceMin=v;}
// 3) 利用者向けの文に混ざった運営メモ・自己言及を外す
const rep=(s,from,to)=>{const c=by(s);const j=JSON.stringify(c);if(!j.includes(from))throw new Error('nf '+s+from);Object.assign(c,JSON.parse(j.split(from).join(to)));};
for(const s of ['center-village-camp','warabezawa-shinsui','tatsuyama-himitsumura']){
  const c=by(s);for(const k of Object.keys(c)){if(typeof c[k]==='string')c[k]=strip(c[k]);}
  if(c.features)for(const k of Object.keys(c.features))if(typeof c.features[k]==='string')c.features[k]=strip(c.features[k]);
  if(Array.isArray(c.cautions))c.cautions=c.cautions.map(strip).filter(Boolean);
}
function strip(t){return t.replace(/\*\*[^*]*台帳[^*]*\*\*[。、]?/g,'').replace(/[^。]*台帳[^。]*。/g,'').trim();}
const fixSelf=[['kanayama-sanso-camp','という当サイト最安クラスの料金','という料金'],['satsukigaoka-koen-camp','という、当サイトで最も安い料金','という料金'],['hakone-no-sato-camp','という、当サイトで2番目に安い料金','という料金'],['warabezawa-shinsui','当サイトで唯一の無料のキャンプ地','無料のキャンプ地']];
for(const [s,f,t] of fixSelf)rep(s,f,t);
for(const s of ['satsukigaoka-koen-camp','hakone-no-sato-camp']){const c=by(s);const j=JSON.stringify(c);Object.assign(c,JSON.parse(j.replace(/\*\*当サイトで[^*]*\*\*[。、]?/g,'')));}
const out=JSON.stringify(d,null,2)+(raw.endsWith('\n')?'\n':'');fs.writeFileSync(P,out);
const left=JSON.stringify(d).match(/[^"。]{0,30}(台帳|当サイト)[^"。]{0,30}/g)||[];console.log('left',left);
