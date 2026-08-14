/**
 * value を VALUE_BANDS の帯に揃える（2026-08-14）。
 *
 *   node scripts/apply-value-band-2026-08-14.js
 *
 * ## なぜ直すか
 *
 * `validate-data.js` に value と価格帯の整合検査を入れた（2026-08-13 決定の帯）。
 * 入れた時点で12件が帯から外れていた。**本栖湖の4件とは無関係の、以前からのズレ。**
 * 帯を決めた以上、既存データもその帯で揃っていないと検査が意味を持たない
 * （警告が常時12件出ている状態は「警告が読まれなくなる」§18-11 と同じ道）。
 *
 * ## 価格側は動かさない
 *
 * **12件すべて priceVerified が true。**料金は一次情報で裏が取れているので、
 * 帯から外れているのは value のほう、と判断できる。
 * 本栖湖（priceMin が正しく value が腐っていた）と同じ形。
 * よってこの適用は value だけを動かす。priceMin / priceMax には触れない。
 *
 * ## soloComment
 *
 * 「フィールドを直したら soloComment も見る」の家訓に従い12件すべて読んだ。
 * 価格評価の表現があったのは2件で、どちらも新しい value と矛盾しないので本文は変えていない。
 *
 * - `shosenkyo-auto-camp`「独り占めできる贅沢なロケーション」
 *   … 「贅沢」はロケーションの形容で価格の主張ではない（機械検出の誤検知。
 *      「覚円峰」の「円」も引っかかる）
 * - `kiyosato-oka`「2,820円〜という公営ならではの価格で…揃う」
 *   … value 5→4。どちらも good 側の評価で、この文は最安・格安を主張していない。
 *      金額 2,820円 は priceMin と一致していて事実としても正しい
 *
 * ## 一度きり
 *
 * 帯そのものは `validate-data.js` の VALUE_BANDS が持ち続けるので、
 * このスクリプトは適用済みなら何もしない（from と一致しなければ中止する）。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');

/** slug → { from, to, priceMin, why }。priceMin は取り違え防止の照合用 */
const CHANGES = [
  // value 4 なのに 4,000円超 → 3
  { slug: 'aone',                from: 4, to: 3, priceMin: 4800 },
  { slug: 'hakushu-ojiro-camp',  from: 4, to: 3, priceMin: 4100 },
  { slug: 'shosenkyo-auto-camp', from: 4, to: 3, priceMin: 5000 },
  { slug: 'marubi-auto',         from: 4, to: 3, priceMin: 5500 },
  { slug: 'naminokomura',        from: 4, to: 3, priceMin: 5600 },
  { slug: 'hidamari-yamakita',   from: 4, to: 3, priceMin: 6000 },
  // value 3 なのに 2,500円未満 → 4
  { slug: 'narakoko',            from: 3, to: 4, priceMin: 1500 },
  { slug: 'oishii-camp',         from: 3, to: 4, priceMin: 1800 },
  { slug: 'ugusu-camp',          from: 3, to: 4, priceMin: 2200 },
  { slug: 'asagiri-foodpark',    from: 3, to: 4, priceMin: 2400 },
  // 帯の境界をまたいでいた2件
  { slug: 'kiyosato-oka',        from: 5, to: 4, priceMin: 2820 },
  { slug: 'hikenkayama',         from: 4, to: 5, priceMin: 1210 },
];

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const applied = [];
for (const ch of CHANGES) {
  const c = data.find((x) => x.slug === ch.slug);
  if (!c) throw new Error(`${ch.slug} が見つからない`);

  if (c.scores.value === ch.to) {
    console.log(`${ch.slug}: すでに value ${ch.to}。飛ばす`);
    continue;
  }
  if (c.scores.value !== ch.from) {
    throw new Error(`${ch.slug}: value が ${ch.from} でなく ${c.scores.value}。手で動いている。中止する`);
  }
  // 価格は動かさない前提。想定と違うなら帯の判断ごと作り直しになる
  if (Number(c.priceMin) !== ch.priceMin) {
    throw new Error(`${ch.slug}: priceMin が ${ch.priceMin} でなく ${c.priceMin}。料金が動いている。中止する`);
  }
  if (c.priceVerified !== true) {
    throw new Error(`${ch.slug}: priceVerified が true でない。帯の対象外のはず。中止する`);
  }

  c.scores.value = ch.to;
  applied.push(ch);
}

if (!applied.length) {
  console.log('変更なし（適用済み）');
  process.exit(0);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

console.log(`value を帯に揃えた: ${applied.length}件`);
for (const ch of applied) {
  console.log(`  ${ch.slug}: value ${ch.from} → ${ch.to}（priceMin ${ch.priceMin.toLocaleString()}円）`);
}
