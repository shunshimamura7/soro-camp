/**
 * 座標が密集している塊を検出する。
 *
 * 本栖湖周辺の4件が、まとめて湖の真ん中を指していた（scripts/sea-coord-check.md）。
 * 一括投入のときに同じ地点付近へ寄せられた塊が他にもないかを洗い出す。
 *
 * 「密集しているから誤り」ではない。同じ湖畔・同じ谷筋にキャンプ場が並ぶのは普通にある。
 * 判断できる材料（住所・相互距離・座標の桁・検証フラグ）を並べるところまでをやる。
 *
 * データは読むだけで変更しない。書き込み先は scripts/coord-cluster-check.md だけ。
 * 使い方: node scripts/coord-cluster-check.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'coord-report.json');
const OUT_PATH = path.join(__dirname, 'coord-cluster-check.md');

/** この距離以内を「隣接」とみなす */
const LINK_KM = 2.0;
/** 隣接でつながった塊がこの件数以上なら報告対象 */
const MIN_MEMBERS = 3;
/** これより近いペアは、別施設としては近すぎる */
const TOO_CLOSE_KM = 0.1;

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

let verdictBySlug = new Map();
try {
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  verdictBySlug = new Map(report.map((r) => [r.slug, r.verdict]));
} catch {
  // レポートが無くても動く。判定列が空になるだけ
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const r = (d) => (d * Math.PI) / 180;
  const dLat = r(lat2 - lat1);
  const dLng = r(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 小数第何位まで持っているか。桁が粗い＝手で丸めた値の疑い */
function decimals(n) {
  const s = String(n);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

function fmtM(km) {
  const m = km * 1000;
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(2)}km`;
}

/** 住所から市区町村までを取り出す。塊の中で市区町村が揃っているかの判断に使う */
function cityOf(address) {
  if (!address) return '';
  const m = String(address).match(/^(.+?[都道府県])(.+?[市区町村])/);
  return m ? m[2] : '';
}

// 0,0 は座標未取得なので塊の判定に混ぜない（全部が同じ点に集まってしまう）
const points = camps.filter((c) => c.lat !== 0 && c.lng !== 0);

// ── 隣接グラフを作って連結成分を取る ────────────────────────────────────────
// 単連結なので、谷筋に沿って数珠つなぎになった塊も1つにまとまる。
// それが誤検出かどうかは「最遠ペア」を見れば分かるので、距離もあわせて出す。
const adjacency = points.map(() => []);
for (let i = 0; i < points.length; i++) {
  for (let j = i + 1; j < points.length; j++) {
    const d = haversineKm(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
    if (d <= LINK_KM) {
      adjacency[i].push(j);
      adjacency[j].push(i);
    }
  }
}

const seen = new Array(points.length).fill(false);
const clusters = [];
for (let i = 0; i < points.length; i++) {
  if (seen[i]) continue;
  const stack = [i];
  const group = [];
  seen[i] = true;
  while (stack.length) {
    const k = stack.pop();
    group.push(k);
    for (const n of adjacency[k]) {
      if (!seen[n]) {
        seen[n] = true;
        stack.push(n);
      }
    }
  }
  if (group.length >= MIN_MEMBERS) clusters.push(group);
}

// ── 各塊の中身を組み立てる ──────────────────────────────────────────────────
const analyzed = clusters.map((group) => {
  const members = group.map((i) => points[i]);
  const pairs = [];
  for (let a = 0; a < members.length; a++) {
    for (let b = a + 1; b < members.length; b++) {
      pairs.push({
        a: members[a],
        b: members[b],
        km: haversineKm(members[a].lat, members[a].lng, members[b].lat, members[b].lng),
      });
    }
  }
  pairs.sort((x, y) => x.km - y.km);

  const cities = [...new Set(members.map((m) => cityOf(m.address)).filter(Boolean))];
  const prefs = [...new Set(members.map((m) => m.prefecture))];
  const minDecimals = Math.min(...members.map((m) => Math.min(decimals(m.lat), decimals(m.lng))));

  const flags = [];
  if (pairs.length && pairs[0].km <= TOO_CLOSE_KM) {
    flags.push(`最も近い2件が ${fmtM(pairs[0].km)} しか離れていない`);
  }
  if (prefs.length > 1) flags.push(`県をまたいでいる（${prefs.join('・')}）`);
  if (cities.length > 1) flags.push(`市区町村が揃っていない（${cities.join('・')}）`);
  if (minDecimals <= 3) flags.push(`座標の小数が ${minDecimals} 桁しかない件を含む（丸めた値の疑い）`);
  const notOk = members.filter((m) => verdictBySlug.get(m.slug) && verdictBySlug.get(m.slug) !== 'OK');
  if (notOk.length) flags.push(`GSI検証を通っていない件を含む（${notOk.map((m) => m.slug).join('・')}）`);
  const unverifiedCoords = members.filter((m) => m.coordsVerified !== true);
  if (unverifiedCoords.length === members.length) flags.push('全件が目視未確認');

  return {
    members,
    pairs,
    cities,
    prefs,
    minDecimals,
    flags,
    maxKm: pairs.length ? pairs[pairs.length - 1].km : 0,
    minKm: pairs.length ? pairs[0].km : 0,
  };
});

// 疑わしいものから並べる。フラグの数 → 最も近いペアが近い順
analyzed.sort((a, b) => b.flags.length - a.flags.length || a.minKm - b.minKm);

// ── Markdown を書く ─────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const lines = [];

lines.push('# 座標クラスタ検出レポート');
lines.push('');
lines.push(`生成日: ${today}（\`node scripts/coord-cluster-check.js\` で再生成できる）`);
lines.push('');
lines.push('本栖湖周辺の4件がまとめて湖の真ん中を指していた件を受けて、');
lines.push('同じように一括投入で寄せられた塊が他にないかを洗い出したもの。');
lines.push('');
lines.push('**密集していること自体は誤りではない。** 同じ湖畔や谷筋にキャンプ場が並ぶのは普通にある。');
lines.push('妥当な密集か、寄せられた塊かを判断できる材料を並べるところまでをこのレポートの範囲とする。');
lines.push('');
lines.push('## 条件');
lines.push('');
lines.push(`- 施設間の距離が **${LINK_KM}km 以内**なら隣接とみなす`);
lines.push(`- 隣接でつながった塊の構成数が **${MIN_MEMBERS}件以上**なら報告する`);
lines.push('- 単連結でまとめるので、谷筋に沿って数珠つなぎになった塊も1つになる。');
lines.push('  実際に固まっているのか帯状に伸びているのかは「最遠ペア」を見て判断する');
lines.push('- 座標が 0,0 の件（座標未取得）は、全部が同じ点に集まってしまうので対象外');
lines.push('');
lines.push('## 判断の手がかり');
lines.push('');
lines.push('| 手がかり | 意味 |');
lines.push('|---|---|');
lines.push(`| 最も近いペアが ${TOO_CLOSE_KM * 1000}m 未満 | 別施設としては近すぎる。同一地点へ寄せられたか、二重登録の疑い |`);
lines.push('| 市区町村が揃っていない | 隣接自治体にまたがるだけのこともあるが、寄せられた塊のサインにもなる |');
lines.push('| 座標の小数が3桁以下 | 手で丸めた値の疑い。小数3桁は約100mの粒度 |');
lines.push('| GSI検証を通っていない件を含む | 塊ごと壊れている可能性');
lines.push('| 全件が目視未確認 | 誰も地図上で見ていない塊 |');
lines.push('');
lines.push('## サマリ');
lines.push('');
lines.push(`- 対象: ${points.length}件（座標を持つもの。全${camps.length}件のうち 0,0 の${camps.length - points.length}件を除く）`);
lines.push(`- 検出した塊: **${analyzed.length}個**、のべ **${analyzed.reduce((s, c) => s + c.members.length, 0)}件**`);
lines.push(`- 手がかりが1つ以上付いた塊: **${analyzed.filter((c) => c.flags.length).length}個**`);
lines.push('');
lines.push('| # | 施設数 | 最近ペア | 最遠ペア | 市区町村 | 手がかり |');
lines.push('|---|---|---|---|---|---|');
analyzed.forEach((c, i) => {
  lines.push(
    `| ${i + 1} | ${c.members.length} | ${fmtM(c.minKm)} | ${fmtM(c.maxKm)} | ${c.cities.join('・') || '（不明）'} | ${c.flags.length ? c.flags.length + '件' : '—'} |`,
  );
});
lines.push('');
lines.push('---');
lines.push('');

analyzed.forEach((c, i) => {
  lines.push(`## クラスタ ${i + 1} — ${c.members.length}件（${c.cities.join('・') || '市区町村不明'}）`);
  lines.push('');
  if (c.flags.length) {
    lines.push('**手がかり**');
    lines.push('');
    c.flags.forEach((f) => lines.push(`- ${f}`));
  } else {
    lines.push('手がかりなし。距離・住所とも自然な密集に見える。');
  }
  lines.push('');
  lines.push('### 構成');
  lines.push('');
  lines.push('| slug | 施設 | 住所 | 座標 | 目視 | GSI | 状態 |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const m of c.members) {
    const v = verdictBySlug.get(m.slug) ?? '—';
    lines.push(
      `| \`${m.slug}\` | ${m.name} | ${m.address || '（なし）'} | ${m.lat}, ${m.lng} | ${m.coordsVerified === true ? '済' : '—'} | ${v} | ${m.status} |`,
    );
  }
  lines.push('');
  lines.push('### 相互距離');
  lines.push('');
  lines.push('| 距離 | A | B |');
  lines.push('|---|---|---|');
  for (const p of c.pairs) {
    lines.push(`| ${fmtM(p.km)} | ${p.a.name} | ${p.b.name} |`);
  }
  lines.push('');
});

lines.push('---');
lines.push('');
lines.push('## 使い方');
lines.push('');
lines.push('手がかりの付いた塊から順に、次を確かめる。');
lines.push('');
lines.push('1. 住所が同じ湖畔・同じ谷筋を指しているか（指していれば密集は妥当）');
lines.push('2. 最も近いペアが数十mなら、`scripts/coord-tool.html` で2件を地図上に並べて見る');
lines.push('3. 座標の小数が粗い件は、一括投入時の丸めが残っている可能性がある');
lines.push('');

// マーカー以降は人が書いた所感。再生成で消さずに引き継ぐ。
const KEEP_MARKER = '<!-- 手で書いた所感 ここから（再生成しても残る） -->';
let kept = '';
try {
  const existing = fs.readFileSync(OUT_PATH, 'utf-8');
  const at = existing.indexOf(KEEP_MARKER);
  if (at !== -1) kept = existing.slice(at);
} catch {
  // 初回は既存ファイルが無い
}
if (kept) {
  lines.push('---');
  lines.push('');
  lines.push(kept.trimEnd());
  lines.push('');
}

fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf-8');
if (kept) console.log('（既存の所感セクションを引き継いだ）');

console.log(`対象 ${points.length}件（0,0 の ${camps.length - points.length}件は除外）`);
console.log(`塊 ${analyzed.length}個 / のべ ${analyzed.reduce((s, c) => s + c.members.length, 0)}件を検出`);
analyzed.forEach((c, i) => {
  console.log(
    `  ${String(i + 1).padStart(2)}. ${String(c.members.length).padStart(2)}件  最近 ${fmtM(c.minKm).padStart(7)}  最遠 ${fmtM(c.maxKm).padStart(7)}  ${c.cities.join('・') || '(不明)'}${c.flags.length ? '  ← ' + c.flags.join(' / ') : ''}`,
  );
});
console.log(`\n→ ${path.relative(process.cwd(), OUT_PATH)}`);
