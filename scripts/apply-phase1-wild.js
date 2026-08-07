/**
 * wild-sites-check.md フェーズ1の反映。
 *
 * 現地で金銭トラブル・門前払いになる2件だけを直す。
 *   1. ogayanagawa-keikoku（大柳川）… 2023年8月に有料化。無料開放・予約不要のまま掲載していた
 *   2. kurokawa-shizuoka（黒川）  … 要予約（オクシズばった）。予約不要のまま掲載していた
 *
 * 出典:
 *   大柳川 https://ooyanagawa-camp.com/
 *          https://ooyanagawa-camp.com/施設案内-ご利用料金新料金/
 *   黒川   https://www.city.shizuoka.lg.jp/okushizuoka/spot/s000093.html （2024-03-19更新）
 *
 * 使い方: node scripts/apply-phase1-wild.js
 * 事前に data/campgrounds.backup2.json を取ってあること。
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const changes = [];

/** 値を差し替え、変更前後を記録する。存在しないパスは作らない（typo の握りつぶし防止） */
function set(camp, pathStr, next) {
  const keys = pathStr.split('.');
  let obj = camp;
  for (const k of keys.slice(0, -1)) {
    if (obj[k] == null) throw new Error(`${camp.slug}: パス "${pathStr}" の途中 "${k}" が存在しない`);
    obj = obj[k];
  }
  const last = keys[keys.length - 1];
  const prev = obj[last];
  if (prev === next) {
    changes.push({ slug: camp.slug, field: pathStr, prev, next, note: '変更なし' });
    return;
  }
  obj[last] = next;
  changes.push({ slug: camp.slug, field: pathStr, prev, next });
}

/** cautions から1件を取り除く。見つからなければエラー（データが想定と違う） */
function dropCaution(camp, text) {
  const i = camp.cautions.indexOf(text);
  if (i === -1) throw new Error(`${camp.slug}: cautions に "${text}" が見つからない`);
  camp.cautions.splice(i, 1);
  changes.push({ slug: camp.slug, field: 'cautions[削除]', prev: text, next: '(削除)' });
}

/** cautions に1件を追加する（重複は追加しない） */
function addCaution(camp, text) {
  if (camp.cautions.includes(text)) return;
  camp.cautions.push(text);
  changes.push({ slug: camp.slug, field: 'cautions[追加]', prev: '(なし)', next: text });
}

function find(slug) {
  const c = camps.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug "${slug}" が見つからない`);
  return c;
}

// ── 1. 大柳川渓流キャンプ場 ──────────────────────────────────────────────────
// 2023年8月より有料。前日までに要予約。管理型のキャンプ場に変わっている。
{
  const c = find('ogayanagawa-keikoku');

  set(c, 'name', '大柳川渓流キャンプ場');
  set(c, 'type', 'campground');

  // priceMin = 最安（デイキャンプ大人 1,100円）
  // priceMax = テント泊大人 1,800円 + オートサイト オンシーズン 2,000円 = 3,800円
  //            グランピング（+13,200円）は別カテゴリなので priceNote に回す
  set(c, 'priceMin', 1100);
  set(c, 'priceMax', 3800);
  set(
    c,
    'priceNote',
    '2023年8月より有料。入場料はテント泊が大人1,800円・小中学生900円、デイキャンプが大人1,100円・小中学生550円（幼児は無料）。' +
      'オートサイトはオンシーズン+2,000円、駐車代は無料。グランピング（ロータスベルテント）はオンシーズン+13,200円',
  );

  set(c, 'features.reservation', '要');
  set(c, 'features.reservationNote', '前日までに要予約');

  // 有料化が確定した以上、「無料開放が続いているかもしれない」前提の注意書きは誤情報になる
  dropCaution(c, '正式名称・営業状況とも未確認。要現地確認');
  dropCaution(c, '営業状況が未確認。閉鎖・有料化の可能性あり');
  addCaution(c, '2023年8月に有料化。前日までに要予約');

  set(
    c,
    'soloComment',
    '5つの滝と10の吊り橋が連なる渓谷の入口に建つ、予約制のキャンプ場。' +
      '2023年8月に無料開放を終えて有料になり、テント泊は大人1,800円。' +
      'サウナやグランピング棟もあり、渓谷歩きの拠点として使える。前日までの予約を忘れずに。',
  );
}

// ── 2. 黒川キャンプ場（清水森林公園） ────────────────────────────────────────
// 無料だが「オクシズばった」での予約が必須。管理棟あり・33区画の管理型キャンプ場。
{
  const c = find('kurokawa-shizuoka');

  set(c, 'type', 'campground');

  set(c, 'features.reservation', '要');
  set(c, 'features.reservationNote', '「オクシズばった」で要予約。管理棟 054-395-2999（9:00〜17:00）');

  set(c, 'season', '通年（年末年始休）');
  set(c, 'closedDays', 'キャンプ場は年末年始（12/29〜1/5）。受付管理棟は毎週月曜（祝日の場合はその翌平日）');

  set(
    c,
    'soloComment',
    '森林公園の中にある無料のキャンプ場。33区画に炊事場とトイレが整い、隣はやませみの湯。' +
      '無料でも「オクシズばった」での予約が要ることと、受付管理棟が月曜休みな点だけ押さえておきたい。',
  );
}

// ── 書き出し ────────────────────────────────────────────────────────────────
fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`フェーズ1: ${changes.length}件の変更を適用\n`);
let current = '';
for (const ch of changes) {
  if (ch.slug !== current) {
    current = ch.slug;
    console.log(`── ${current}`);
  }
  const prev = typeof ch.prev === 'string' ? `"${ch.prev}"` : JSON.stringify(ch.prev);
  const next = typeof ch.next === 'string' ? `"${ch.next}"` : JSON.stringify(ch.next);
  console.log(`  ${ch.field}`);
  console.log(`    - ${prev}`);
  console.log(`    + ${next}`);
}
