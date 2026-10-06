const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const camps = JSON.parse(fs.readFileSync(path.join(root, 'data', 'campgrounds.json'), 'utf8'));
const active = camps.filter(c => c.status === 'active');

function hasSource(c) {
  // 既存データは source 配列ではなく、公式・予約・注意事項URLに根拠を持つ。
  if (c.officialUrl || c.reservationUrl) return true;
  if (Array.isArray(c.cautions) && c.cautions.some(x => /https?:\/\//.test(String(x)))) return true;
  if (Array.isArray(c.sources)) return c.sources.some(s => s && (s.url || s.title));
  if (c.source && typeof c.source === 'object') return Boolean(c.source.url || c.source.title);
  return Boolean(c.source);
}
function bool(v) { return v === true; }
function dayDiff(date) {
  const t = Date.parse(date || '');
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.UTC(2026, 7, 26) - t) / 86400000);
}

const risk = active.map(c => {
  const issues = [];
  if (!c.officialUrl) issues.push('公式URLなし');
  if (!hasSource(c)) issues.push('一次情報の記録なし');
  if (!bool(c.priceVerified)) issues.push('料金未検証');
  if (c.priceVerified && !c.officialUrl && !hasSource(c)) issues.push('料金確認済みフラグの根拠なし');
  if (!bool(c.coordsVerified) || c.needsCoord) issues.push('位置未検証');
  if (!bool(c.scoresVerified)) issues.push('5軸評価未検証');
  const age = dayDiff(c.lastVerified);
  if (age === null) issues.push('確認日の記録なし');
  else if (age > 90) issues.push(`確認日が${age}日前`);
  return {
    id: c.id, name: c.name, prefecture: c.prefecture, area: c.area, issues,
    officialUrl: c.officialUrl || '', lastVerified: c.lastVerified || '',
    priceVerified: bool(c.priceVerified), coordsVerified: bool(c.coordsVerified) && !c.needsCoord,
    scoresVerified: bool(c.scoresVerified), sourceBacked: hasSource(c),
    riskScore: issues.reduce((n, i) => n + (
      i.includes('料金確認済みフラグの根拠なし') ? 7 :
      i.includes('公式URLなし') ? 5 : i.includes('一次情報') ? 4 :
      i.includes('料金未検証') ? 4 : i.includes('位置未検証') ? 4 :
      i.includes('5軸') ? 1 : i.includes('確認日') ? 2 : 0
    ), 0)
  };
}).sort((a,b)=>b.riskScore-a.riskScore || a.name.localeCompare(b.name,'ja'));

const counts = {
  active: active.length,
  officialUrl: active.filter(c=>!!c.officialUrl).length,
  sourceBacked: risk.filter(x=>x.sourceBacked).length,
  priceVerified: risk.filter(x=>x.priceVerified).length,
  coordsVerified: risk.filter(x=>x.coordsVerified).length,
  scoresVerified: risk.filter(x=>x.scoresVerified).length,
  zeroRisk: risk.filter(x=>x.riskScore===0).length,
};

const special = ['tanukiko','takizawaso','aonohara-auto','miyagase-village','yataro-camp','sankoso-auto','kabutomushi-mori-camp','okumakino-camp','mikagi-camp','mushizawa-camp','makioka-fruits-camp','akiyamagawa-camp','mobility-park-izu'];
const specialRows = special.map(id => risk.find(x=>x.id===id)).filter(Boolean);

const report = { generatedAt:'2026-08-26', counts, riskTop50:risk.slice(0,50), validateWarnings:specialRows };
fs.writeFileSync(path.join(root,'data','full-content-audit-summary-2026-08-26.json'), JSON.stringify(report,null,2)+'\n');

const md = [
  '# 全掲載情報：機械再監査サマリー', '', '作成日: 2026-08-26', '',
  '## 全159件の根拠状態', '',
  '| 指標 | 件数 | 意味 |', '|---|---:|---|',
  `| 通常掲載 | ${counts.active} | 公開対象 |`,
  `| 公式URLあり | ${counts.officialUrl} | 死活・営業情報の自動確認の入口あり |`,
  `| 一次情報の記録あり | ${counts.sourceBacked} | ソース項目に根拠を記録 |`,
  `| 料金確認済み | ${counts.priceVerified} | 料金の一次情報確認フラグあり |`,
  `| 位置確認済み | ${counts.coordsVerified} | 実ピンまたは座標の確認フラグあり |`,
  `| 5軸評価確認済み | ${counts.scoresVerified} | 5軸すべての根拠が揃っている状態 |`,
  `| リスク項目なし | ${counts.zeroRisk} | この機械ルールの範囲で未検証項目がない |`, '',
  '## 優先確認：検証スクリプトが具体的に警告した施設', '',
  '| 施設 | 都県 | 現在の課題 | 公式URL |', '|---|---|---|---|',
  ...specialRows.map(x=>`| ${x.name} | ${x.prefecture} | ${x.issues.join('、')} | ${x.officialUrl || 'なし'} |`), '',
  '## 情報根拠の不足が大きい上位50件', '',
  '| リスク | 施設 | 都県 | 要確認項目 |', '|---:|---|---|---|',
  ...risk.slice(0,50).map(x=>`| ${x.riskScore} | ${x.name} | ${x.prefecture} | ${x.issues.join('、')} |`), '',
  '> この表は「誤り」と断定する表ではない。現時点のデータに、公開情報を正しいと証明する根拠がどの程度記録されているかを示す。', ''
].join('\n');
fs.writeFileSync(path.join(root,'full-content-audit-summary-2026-08-26.md'), md);
console.log(JSON.stringify(counts,null,2));
