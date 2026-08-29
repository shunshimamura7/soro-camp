/**
 * 野営地に `wildStatus` を付ける（2026-08-29）。
 *
 * いままで「公認なし」の表示は `cautions` の文字列（「黙認」など）で判定していた。
 * **文言を書き換えると判定が静かに壊れ、公認された無料開放地と黙認の河川敷が
 * 同じ顔で並ぶ。**利用者が負う責任が違うので、フィールドに持たせて固定する。
 *
 * 判定の根拠は各エントリの `why` に、レコードのどの記述を読んだかで書いてある。
 *
 * ## 安全装置
 *
 * - **`--write --force` の二重ガード。**既定は dry run で1バイトも書かない
 * - **照合ガード。**対象が `type: "wild"` でない／既に `wildStatus` を持つ／
 *   slug が見つからない場合はその場で中止。別のセッションが先に付けていたら上書きしない
 * - **整形ガード。**無変更の往復（parse → stringify）が原本と一致しなければ中止
 * - **書くフィールドは `wildStatus` だけ。**status・lat・lng・cautions は触らない
 *
 *   node scripts/apply-wildstatus-2026-08-29.js                  # dry run（既定）
 *   node scripts/apply-wildstatus-2026-08-29.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');

/** [slug, wildStatus, 根拠] */
const SET = [
  ['omuroyama-camp', '公認',
    'officialUrl が伊東市公式（city.ito.shizuoka.jp の組織ページ配下）。cautions「伊東市営のため運用変更・有料化の可能性あり」「要事前予約（伊東市民体育センター）」。市が運用し予約を受けている'],
  ['numazu-shimin-no-mori', '公認',
    'officialUrl が沼津市公式（kurashi/shisetsu 配下＝市の施設として案内）。cautions「事前予約必須」「チェックイン10:00〜16:00…管理棟に立ち寄ること」'],

  ['ogurabashi-kasenjiki', '黙認',
    'cautions「自治体が公認した野営地ではない（黙認）。相模原市はキャンプについて市営キャンプ場を案内している」'],
  ['takadabashi-kasenjiki', '黙認',
    'cautions 同文に加え「管理区分により火気の扱いが異なる可能性がある。事前に相模原市へ確認を推奨（公園課）」＝市は野営地として案内していない'],
  ['nishizato-camp-tekichi', '黙認',
    'cautions「静岡市の『キャンプ適地』だが、市の利用ルールのページは現在閲覧できず、公認の裏付けは取れていない（黙認）」'],
  ['tsuchimura', '黙認',
    'cautions 同文。管理主体は土村自治会（「管理は土村自治会」「自治会管理の無料開放」）で自治体ではない。自治会の案内が一次情報で取れれば公認に上げられる'],

  ['nakatsugawa-kasenjiki', '不明',
    'cautions「無料開放のため…」とあるが開放主体の記載がなく officialUrl / source / tel すべて無し。運動公園と河川敷の管理区分も未確定（「田代運動公園の設備が使えるかは要現地確認」）'],
  ['sumida-ohashi-kasenjiki', '不明',
    '中津川河川敷と同型。開放主体の記載なし、URL類なし'],
  ['hasugebashi-kasenjiki', '不明',
    '中津川河川敷と同型。開放主体の記載なし、URL類なし'],
  ['wadanagahama-kaigan', '不明',
    '「無料開放」の記述すらない。「海岸は原則直火禁止」「海水浴シーズンは利用制限の可能性あり」＝制限の存在は書かれているが、野営が認められているかは書かれていない'],
  ['kofu-shinrinyoku-hiroba', '不明',
    'cautions「甲府市の無料開放」「市の台帳上あるが」と市のものと断定しているのに、officialUrl も source も無く出典が記録されていない。甲府市の該当ページが取れれば公認に上がる'],
];

/**
 * `closed` の野営地は対象外。
 * `sanogawa-camp`（佐野川河川公園）はキャンプ禁止が確認済みで、
 * 公認/黙認/不明のどれを入れても意味が誤りになる。closedNote が理由を持っている。
 */
const SKIP = ['sanogawa-camp'];

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);

// 整形ガード
if (JSON.stringify(list, null, 2) + '\n' !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない。整形が想定と違う');
  process.exit(1);
}

const bySlug = new Map(list.map((c) => [c.slug, c]));
const errors = [];
for (const [slug, val] of SET) {
  const c = bySlug.get(slug);
  if (!c) { errors.push(`${slug}: レコードが無い`); continue; }
  if (c.type !== 'wild') { errors.push(`${slug}: type が "wild" ではない（${c.type ?? '未指定'}）`); continue; }
  if (c.wildStatus !== undefined) { errors.push(`${slug}: 既に wildStatus="${c.wildStatus}" が入っている。上書きしない`); continue; }
}
// 取りこぼし検査：SET と SKIP で wild を網羅しているか
const covered = new Set([...SET.map(([s]) => s), ...SKIP]);
for (const c of list) {
  if (c.type === 'wild' && !covered.has(c.slug)) errors.push(`${c.slug}: wild なのに SET にも SKIP にも無い`);
}
if (errors.length) {
  console.error('中止:\n  ' + errors.join('\n  '));
  process.exit(1);
}

for (const [slug, val, why] of SET) {
  const c = bySlug.get(slug);
  console.log(`${WRITE ? '書込' : 'dry'} ${slug.padEnd(26)} wildStatus=${val}`);
  console.log(`     根拠: ${why}`);
  if (WRITE) c.wildStatus = val;
}
for (const slug of SKIP) console.log(`skip ${slug.padEnd(26)} closed のため対象外`);

if (WRITE) {
  fs.writeFileSync(DATA, JSON.stringify(list, null, 2) + '\n');
  console.log(`\n書き込んだ: ${SET.length}件`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
