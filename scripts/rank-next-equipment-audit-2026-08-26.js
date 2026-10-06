const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const camps = JSON.parse(fs.readFileSync(path.join(root, 'data', 'campgrounds.json'), 'utf8'));
const candidates = JSON.parse(fs.readFileSync(path.join(root, 'data', 'candidate-batch2-four-pref-2026-08-26.json'), 'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(root, 'data', 'candidate-batch2-30-review-summary-2026-08-26.json'), 'utf8'));
const reviewById = new Map(review.map(x => [x.id, x]));

const unknown = (value) => value === undefined || value === null || value === '' || value === '不明' || value === '要確認';
const noteSaysUnconfirmed = (note) => /要確認|不明|未確認/.test(note || '');

function activeAudit(camp) {
  const f = camp.features || {};
  const gaps = [];
  if (unknown(f.toilet) || noteSaysUnconfirmed(f.toiletNote)) gaps.push('トイレ');
  if (f.shower === undefined || noteSaysUnconfirmed(f.showerNote)) gaps.push('シャワー');
  if (f.bonfire === undefined || (f.bonfire === false && noteSaysUnconfirmed(f.bonfireNote))) gaps.push('焚き火');
  if (f.carIn === undefined || noteSaysUnconfirmed(f.carInNote)) gaps.push('車両・荷下ろし');
  if (unknown(f.reservation) || noteSaysUnconfirmed(f.reservationNote)) gaps.push('予約方法');
  if (unknown(f.garbage)) gaps.push('ゴミ');
  if (f.bath === undefined || noteSaysUnconfirmed(f.bathNote)) gaps.push('入浴');
  if (f.soloPlan === undefined || noteSaysUnconfirmed(f.soloPlanNote)) gaps.push('ソロ条件');

  // 命に関わる設備・利用可否を重くし、データ不確実性を上乗せする。
  const equipmentWeight = gaps.reduce((score, gap) => score + ({
    'トイレ': 4, '焚き火': 3, '予約方法': 3, '車両・荷下ろし': 2, 'シャワー': 2, 'ゴミ': 2, '入浴': 1, 'ソロ条件': 2,
  }[gap] || 0), 0);
  const dataRisk =
    (camp.priceVerified !== true ? 4 : 0) +
    (camp.coordsVerified !== true ? 3 : 0) +
    (camp.scoresVerified === false ? 2 : 0) +
    (camp.needsVerify ? 4 : 0);

  return {
    id: camp.id, name: camp.name, prefecture: camp.prefecture, area: camp.area,
    status: camp.status, priority: equipmentWeight + dataRisk,
    gaps, priceVerified: camp.priceVerified === true, coordsVerified: camp.coordsVerified === true,
    scoresVerified: camp.scoresVerified === true, officialUrl: camp.officialUrl || '',
    lastVerified: camp.lastVerified || '',
  };
}

const active = camps.filter(c => c.status === 'active').map(activeAudit)
  .filter(x => x.gaps.length > 0)
  .sort((a, b) => b.priority - a.priority || b.gaps.length - a.gaps.length || a.name.localeCompare(b.name, 'ja'));

const activeIds = new Set(camps.filter(c => c.status === 'active').map(c => c.id));
const backlog = candidates.filter(c => !activeIds.has(c.id)).map(c => {
  const r = reviewById.get(c.id) || {};
  const missing = [
    ...(c.knownGaps || []),
    ...(r.key_gaps || []).slice(0, 2),
  ];
  // 既に公式料金・ソロ根拠があり、品質指数が比較的高い候補を先に再調査する。
  const priority = Math.round((r.quality_index || 0) + (30 - Math.min(r.blockers || 30, 30)) * 1.2 + (c.priceMin > 0 ? 8 : 0));
  return {
    id: c.id, name: c.name, prefecture: c.prefecture, area: c.area,
    priority, qualityIndex: r.quality_index ?? null, blockers: r.blockers ?? null,
    knownGaps: missing, officialUrl: c.officialUrl, priceMin: c.priceMin,
  };
}).sort((a, b) => b.priority - a.priority || (b.qualityIndex || 0) - (a.qualityIndex || 0));

const report = {
  generatedAt: '2026-08-26',
  rules: {
    active: '衛生・火気・予約・車両・ゴミ・入浴・ソロ条件の未確認を優先。料金・座標・同定の不確実性を上乗せ。',
    backlog: '公式料金・ソロ根拠があり、30観点レビューの品質指数が高く、解消すべき阻害要因が相対的に少ない候補を優先。',
  },
  activeTop25: active.slice(0, 25),
  backlog,
};

fs.writeFileSync(path.join(root, 'data', 'next-equipment-audit-2026-08-26.json'), JSON.stringify(report, null, 2) + '\n');

const md = [
  '# 次回の未確認設備・運用情報の再調査優先リスト',
  '',
  '作成日: 2026-08-26',
  '',
  '## 判定方法',
  '',
  '公開中施設は、トイレ・焚き火・予約方法・車両／荷下ろし・シャワー・ゴミ・入浴・ソロ条件のうち、未確認の項目を抽出した。トイレ、火気、予約可否は安全と訪問可否に直結するため重く扱い、料金・座標・施設同定の未確認を追加リスクとして加算した。',
  '',
  '## 公開中施設：優先上位25件',
  '',
  '| 優先度 | 施設 | 都県 | 未確認の主項目 | 料金 | 位置 | 公式 |',
  '|---:|---|---|---|---|---|---|',
  ...report.activeTop25.map(x => `| ${x.priority} | ${x.name} | ${x.prefecture} | ${x.gaps.join('、')} | ${x.priceVerified ? '確認済み' : '要確認'} | ${x.coordsVerified ? '確認済み' : '要確認'} | ${x.officialUrl || 'なし'} |`),
  '',
  '## 未掲載候補：再調査後に追加を判断する7件',
  '',
  '| 優先度 | 施設 | 都県 | 品質指数 | 阻害要因 | 先に確認する項目 |',
  '|---:|---|---|---:|---:|---|',
  ...report.backlog.map(x => `| ${x.priority} | ${x.name} | ${x.prefecture} | ${x.qualityIndex ?? '-'} | ${x.blockers ?? '-'} | ${x.knownGaps.slice(0, 3).join(' / ')} |`),
  '',
  'スコアは施設の魅力度ではなく、再調査の作業順を決めるための情報充足度・リスク指標である。',
  '',
].join('\n');
fs.writeFileSync(path.join(root, 'next-equipment-audit-2026-08-26.md'), md);

console.log(JSON.stringify({ activeCandidates: active.length, backlogCandidates: backlog.length, output: 'next-equipment-audit-2026-08-26.md' }, null, 2));
