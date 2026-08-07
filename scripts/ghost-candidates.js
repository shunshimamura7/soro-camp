/**
 * 実在しない施設（ゴースト）の候補を洗い出す。
 *
 * これまでに3件、実在しない施設が見つかっている。
 *   sanogawa-camp      … 佐野川河川公園。キャンプ禁止だった
 *   ito-marine-town-camp … 道の駅のキャンプ場紹介ページを施設そのものと取り違え
 *   makiba-kogen-camp  … まきば公園はキャンプ場ではない公園。住所は隣の記録からの流用
 *
 * 3件とも「実在する何か」の名前や住所を借りて作られていた。
 * 1件ずつ潰すのは効率が悪いので、共通する特徴を条件にして候補を並べる。
 *
 * データは読むだけで変更しない。書き込み先は scripts/ghost-candidates.md だけ。
 * 使い方: node scripts/ghost-candidates.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const OUT_PATH = path.join(__dirname, 'ghost-candidates.md');

const PLACEHOLDER_DATE = '2025-01-01';

/** soloComment に出てくる逃げ表現。裏が取れていないまま書かれたサイン */
const HEDGE = /未確認|要確認|要現地確認|要問合せ|要問い合わせ|不明|確認中|possibly|かもしれない/;

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const isEmpty = (v) => v == null || String(v).trim() === '';

/** 全角数字を半角に direし、空白と記号のゆれを吸収する */
function normalizeAddress(addr) {
  if (isEmpty(addr)) return '';
  return String(addr)
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[－ー−‐]/g, '-')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * 住所を「番地より前」「番地」「枝番」に割る。
 *   山梨県北杜市高根町清里3545-5 → { head: '山梨県北杜市高根町清里', banchi: '3545', eda: '5' }
 * 先頭の数字（丁目など）は住所の一部として head に残したいので、
 * 最後に現れる「数字（-数字）*」の並びを番地とみなす。
 */
function splitAddress(addr) {
  const a = normalizeAddress(addr);
  if (!a) return null;
  const m = a.match(/^(.*?)(\d+(?:-\d+)*)$/);
  if (!m) return { head: a, banchi: null, eda: null };
  const nums = m[2].split('-');
  return { head: m[1], banchi: nums[0], eda: nums.slice(1).join('-') || null };
}

// ── 住所の突き合わせ ────────────────────────────────────────────────────────
// 強: 番地まで同じで枝番だけ違う（makiba-kogen-camp のケース）
// 弱: 番地の直前まで同じ（同じ集落に複数の施設。正常なことも多い）
const parsed = camps.map((c) => ({ camp: c, addr: splitAddress(c.address) }));
const edaTwins = new Map();   // slug -> [相手の説明]
const headTwins = new Map();

for (let i = 0; i < parsed.length; i++) {
  for (let j = i + 1; j < parsed.length; j++) {
    const A = parsed[i], B = parsed[j];
    if (!A.addr || !B.addr || !A.addr.head || !B.addr.head) continue;
    if (A.addr.head !== B.addr.head) continue;

    const sameBanchi = A.addr.banchi && A.addr.banchi === B.addr.banchi;
    const differentEda = A.addr.eda !== B.addr.eda;

    const push = (map, x, y) => {
      if (!map.has(x.camp.slug)) map.set(x.camp.slug, []);
      map.get(x.camp.slug).push(`${y.camp.slug}（${y.camp.address}）`);
    };

    if (sameBanchi && differentEda) {
      push(edaTwins, A, B);
      push(edaTwins, B, A);
    } else {
      push(headTwins, A, B);
      push(headTwins, B, A);
    }
  }
}

// ── 条件 ────────────────────────────────────────────────────────────────────
// weight は「これまで見つかった3件がどれだけ当てはまったか」で決めている。
const CONDITIONS = [
  {
    key: 'noContact',
    label: '連絡先なし（tel も officialUrl も空）',
    weight: 3,
    hit: (c) => isEmpty(c.tel) && isEmpty(c.officialUrl),
    note: '実在すれば電話か公式サイトのどちらかは持つのが普通。野営地は例外になりうる',
  },
  {
    key: 'edaTwin',
    label: '住所が他の施設と枝番だけ違う',
    weight: 3,
    hit: (c) => edaTwins.has(c.slug),
    detail: (c) => edaTwins.get(c.slug).join(' / '),
    note: 'makiba-kogen-camp の決め手になった条件。隣の記録から住所を流用した疑い',
  },
  {
    key: 'noVerified',
    label: 'lastVerified が空、または一括投入時のプレースホルダ',
    weight: 2,
    hit: (c) => isEmpty(c.lastVerified) || c.lastVerified === PLACEHOLDER_DATE,
    note: '誰も一次情報に当たっていない',
  },
  {
    key: 'noGsi',
    label: 'coordsGsiChecked が立っていない',
    weight: 2,
    hit: (c) => c.coordsGsiChecked !== true,
    note: '座標が県外・海上・湖面を指しているか、そもそも取れていない',
  },
  {
    key: 'hedge',
    label: 'soloComment に逃げ表現が入っている',
    weight: 1,
    hit: (c) => HEDGE.test(String(c.soloComment || '')),
    note: '裏が取れないまま書かれた文章のサイン',
  },
  // ここから下は指示に無いが、これまでの3件で実際に効いた特徴として足したもの
  {
    key: 'noAddress',
    label: '住所が空（追加条件）',
    weight: 3,
    hit: (c) => isEmpty(c.address),
    note: 'ginga-momiji-camp が該当していた。住所を持たない施設は同定できない',
  },
  {
    key: 'noPriceNote',
    label: '料金の内訳（priceNote）が無い（追加条件）',
    weight: 2,
    hit: (c) => isEmpty(c.priceNote),
    note: '料金を調べた人は必ず内訳を書く。値だけあって内訳が無いのは生成値の疑い',
  },
  {
    key: 'headTwin',
    label: '住所が他の施設と番地の直前まで同じ（追加条件・弱）',
    weight: 1,
    hit: (c) => headTwins.has(c.slug),
    detail: (c) => headTwins.get(c.slug).slice(0, 3).join(' / '),
    note: '同じ集落に複数の施設が並ぶのは普通にある。単独では根拠にならない',
  },
];

const MAX_SCORE = CONDITIONS.reduce((s, c) => s + c.weight, 0);

const scored = camps.map((c) => {
  const hits = CONDITIONS.filter((cond) => cond.hit(c));
  return {
    camp: c,
    hits,
    score: hits.reduce((s, h) => s + h.weight, 0),
  };
});

scored.sort((a, b) => b.score - a.score || a.camp.slug.localeCompare(b.camp.slug));

// ── Markdown ───────────────────────────────────────────────────────────────
const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const today = new Date().toISOString().slice(0, 10);
const L = [];

L.push('# 実在しない施設の候補');
L.push('');
L.push(`生成日: ${today}（\`node scripts/ghost-candidates.js\` で再生成できる）`);
L.push('');
L.push('これまでに実在しない施設が3件見つかっている。');
L.push('');
L.push('| slug | 何だったか |');
L.push('|---|---|');
L.push('| `sanogawa-camp` | 佐野川河川公園。キャンプが禁止されていた |');
L.push('| `ito-marine-town-camp` | 道の駅のキャンプ場**紹介ページ**を施設そのものと取り違えていた |');
L.push('| `makiba-kogen-camp` | まきば公園はキャンプ場ではない公園。住所は隣の記録からの流用 |');
L.push('');
L.push('3件に共通する特徴を条件にして、残り全件から候補を並べたもの。');
L.push('**スコアが高い＝実在しない、ではない。** 野営地のように連絡先を持たないのが正常な施設もある。');
L.push('上から順に確認していくための優先順位として使う。');
L.push('');
L.push('## 条件と重み');
L.push('');
L.push('| 条件 | 重み | ヒット数 | 補足 |');
L.push('|---|---|---|---|');
for (const cond of CONDITIONS) {
  const n = camps.filter((c) => cond.hit(c)).length;
  L.push(`| ${cond.label} | ${cond.weight} | **${n}件** | ${cond.note} |`);
}
L.push('');
L.push(`満点は ${MAX_SCORE} 点。対象は全 ${camps.length} 件。`);
L.push('');

// スコア分布
const dist = new Map();
scored.forEach((s) => dist.set(s.score, (dist.get(s.score) || 0) + 1));
L.push('## スコア分布');
L.push('');
L.push('| スコア | 件数 |');
L.push('|---|---|');
[...dist.keys()].sort((a, b) => b - a).forEach((k) => L.push(`| ${k} | ${dist.get(k)}件 |`));
L.push('');

const flagged = scored.filter((s) => s.score > 0);
L.push(`条件に1つ以上当てはまったのは **${flagged.length}件**。`);
L.push('');
L.push('---');
L.push('');

// ── 共起の内訳 ──────────────────────────────────────────────────────────────
// 単独のヒット数だけ見ても優先順位にならない。どれとどれが重なっているかを出す。
const hasHit = (c, key) => CONDITIONS.find((x) => x.key === key).hit(c);
const countIf = (fn) => camps.filter(fn).length;

L.push('## 共起の内訳');
L.push('');
L.push('条件を単独で数えても優先順位にならないので、重なりを見る。');
L.push('');
L.push('| 組み合わせ | 件数 |');
L.push('|---|---|');
L.push(`| 住所が空 かつ 連絡先なし | ${countIf((c) => hasHit(c, 'noAddress') && hasHit(c, 'noContact'))}件 |`);
L.push(`| 住所が空 かつ 連絡先なし かつ 未確認 | **${countIf((c) => hasHit(c, 'noAddress') && hasHit(c, 'noContact') && hasHit(c, 'noVerified'))}件** |`);
L.push(`| 上記3つ かつ GSI未通過 | ${countIf((c) => hasHit(c, 'noAddress') && hasHit(c, 'noContact') && hasHit(c, 'noVerified') && hasHit(c, 'noGsi'))}件 |`);
L.push(`| 住所はあるが連絡先なし | ${countIf((c) => !hasHit(c, 'noAddress') && hasHit(c, 'noContact'))}件 |`);
L.push(`| 野営地（type: wild）を除いた住所が空 | ${camps.filter((c) => c.type !== 'wild' && hasHit(c, 'noAddress')).length}件 |`);
L.push('');

// ── 重点候補 ────────────────────────────────────────────────────────────────
const priority = camps.filter(
  (c) => hasHit(c, 'noAddress') && hasHit(c, 'noContact') && hasHit(c, 'noVerified'),
);
L.push('## 重点候補 — 住所も連絡先も確認日も無い');
L.push('');
L.push('**一括投入で入ったまま、誰も一次情報に当たっていない記録。**');
L.push('実在しない施設が紛れているとしたら、まずこの中にある可能性が高い。');
L.push('');
L.push('| slug | 施設 | 県/エリア | type | 料金 | 座標 |');
L.push('|---|---|---|---|---|---|');
priority
  .slice()
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .forEach((c) => {
    L.push(
      `| \`${c.slug}\` | ${esc(c.name)} | ${c.prefecture}/${esc(c.area)} | ${c.type || 'campground'} | ${c.priceMin}〜${c.priceMax} | ${c.lat}, ${c.lng} |`,
    );
  });
L.push('');
L.push(`計 **${priority.length}件**。`);
L.push('');
L.push('---');
L.push('');
L.push('## ランキング');
L.push('');
L.push('スコア順。同点は slug 順。');
L.push('');

const header = ['#', 'スコア', 'slug', '施設', '県/エリア', ...CONDITIONS.map((c) => c.key), '状態'];
L.push('| ' + header.join(' | ') + ' |');
L.push('|' + header.map(() => '---').join('|') + '|');
flagged.forEach((s, i) => {
  const marks = CONDITIONS.map((cond) => (s.hits.includes(cond) ? '●' : ''));
  L.push(
    `| ${i + 1} | **${s.score}** | \`${s.camp.slug}\` | ${esc(s.camp.name)} | ${s.camp.prefecture}/${esc(s.camp.area)} | ` +
      marks.join(' | ') +
      ` | ${s.camp.status} |`,
  );
});
L.push('');
L.push('列の意味: ' + CONDITIONS.map((c) => `\`${c.key}\` = ${c.label}`).join(' / '));
L.push('');
L.push('---');
L.push('');

// 上位の詳細
const TOP = 15;
L.push(`## 上位${TOP}件の詳細`);
L.push('');
for (const s of flagged.slice(0, TOP)) {
  L.push(`### ${s.camp.name} — \`${s.camp.slug}\`（スコア ${s.score}/${MAX_SCORE}）`);
  L.push('');
  L.push(`- 県/エリア: ${s.camp.prefecture} / ${s.camp.area}`);
  L.push(`- 住所: ${s.camp.address || '**（空）**'}`);
  L.push(`- tel: ${s.camp.tel || '**（空）**'} / officialUrl: ${s.camp.officialUrl || '**（空）**'}`);
  L.push(`- 座標: ${s.camp.lat}, ${s.camp.lng}（coordsGsiChecked: ${s.camp.coordsGsiChecked === true ? '通過' : '**未通過**'}）`);
  L.push(`- lastVerified: ${s.camp.lastVerified || '**（空）**'} / status: ${s.camp.status}`);
  L.push(`- type: ${s.camp.type || 'campground'} / 料金: ${s.camp.priceMin}〜${s.camp.priceMax}`);
  L.push('');
  L.push('該当した条件:');
  L.push('');
  for (const h of s.hits) {
    const d = h.detail ? ` — ${esc(h.detail(s.camp))}` : '';
    L.push(`- **${h.label}**（+${h.weight}）${d}`);
  }
  L.push('');
  L.push(`> ${esc(s.camp.soloComment)}`);
  L.push('');
}

L.push('---');
L.push('');
L.push('## 使い方');
L.push('');
L.push('1. スコア上位から、施設名で検索して**予約・料金の情報が出てくるか**を見る。');
L.push('   実在する施設なら、なっぷ・じゃらん・公式のどれかに必ず出る');
L.push('2. `edaTwin` が付いている件は、相手の記録と住所を見比べる。');
L.push('   片方が実在してもう片方が出てこないなら、流用の疑いが濃い');
L.push('3. `noContact` だけが付いている野営地は、連絡先が無いのが正常なので優先度を下げてよい');
L.push('');

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
  L.push('---');
  L.push('');
  L.push(kept.trimEnd());
  L.push('');
}

fs.writeFileSync(OUT_PATH, L.join('\n'), 'utf-8');

console.log(`対象 ${camps.length}件 / 満点 ${MAX_SCORE}点`);
console.log('条件ごとのヒット数:');
for (const cond of CONDITIONS) {
  console.log(`  ${String(camps.filter((c) => cond.hit(c)).length).padStart(3)}件  [重み${cond.weight}] ${cond.label}`);
}
console.log(`\n条件に1つ以上当てはまった: ${flagged.length}件`);
console.log('\n上位15件:');
flagged.slice(0, 15).forEach((s, i) => {
  console.log(
    `  ${String(i + 1).padStart(2)}. スコア${String(s.score).padStart(2)}  ${s.camp.slug.padEnd(28)} ${s.camp.name}`,
  );
  console.log(`      ${s.hits.map((h) => h.key).join(', ')}`);
});
if (kept) console.log('\n（既存の所感セクションを引き継いだ）');
console.log(`\n→ ${path.relative(process.cwd(), OUT_PATH)}`);
