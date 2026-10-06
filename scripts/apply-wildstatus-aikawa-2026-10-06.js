/**
 * 愛川町の中津川河川敷3件を `wildStatus: "不明"` → `"黙認"` に上げる（2026-10-06・フェーズ2）。
 *
 * ## 何が変わったか — 出典URLが取れた
 *
 * 3件の `cautions` には以前から「愛川町商工観光課が河川敷利用のルールとして明記」と
 * 書いてあったが、**URLが記録されていなかった**ため裏付けを検算できず `"不明"` のままだった。
 * 今回、愛川町公式の該当ページを特定した。
 *
 *   https://www.town.aikawa.kanagawa.jp/soshiki/kankyou_keizai/syoko/kanko/info/1629185895426.html
 *   「河川敷利用のマナーを守ろう！」愛川町 環境経済部 商工観光課
 *
 * ## なぜ "公認" ではなく "黙認" か
 *
 * `lib/types.ts` の定義は
 *
 *   公認 … 自治体・河川管理者が**管理していることを**一次情報で確認できる
 *   黙認 … 禁止されてはいないが、公認された野営地ではない
 *
 * 町のページがしているのは**マナーの提示だけ**で、管理ではない。
 *
 *   - 「多くの方がキャンプやバーベキュー、釣り、川遊びなどを楽しむ」＝利用実態を認識している
 *   - 「直火は禁止」「焚火台やバーベキューコンロを利用してください」＝守らせたい作法がある
 *   - **キャンプを禁じる文言は無い**
 *   - しかし**予約も料金も区画も無く、野営地として指定・管理してはいない**
 *
 * つまり「禁止の明記なく利用実態のみ」。定義どおり `"黙認"`。
 * **ページが個々の場所（田代運動公園・角田大橋・八菅橋）を名指ししていない**点は弱みだが、
 * 3件とも愛川町内の中津川河川敷で、ページが対象にしている範囲そのものに入る。
 *
 * ## `wadanagahama-kaigan`（三浦市）は触らない
 *
 * 三浦市公式の海水浴場ページ（観光商工課）は和田海水浴場を扱っているが、
 * **キャンプ・テント泊・焚き火について一言も書いていない。**禁止も許可も無い。
 * 神奈川県側にも海岸管理者としての記述が見つからなかった。
 * 「判断材料が見つからない → `"不明"` のまま触らない」に従う。
 *
 * ## cautions に何を足すか
 *
 * `isToleratedWildSite()` は `wildStatus` だけを見るので表示は `wildStatus` で決まるが、
 * **読み手が裏を取れるように出典URLと「公認ではない」旨を本文にも残す。**
 * 既存の5件は消さず、6件目として足す。
 *
 * ## 安全装置
 *
 * - **`--write --force` の二重ガード。**既定は dry run
 * - **照合ガード。**slug・施設名・住所の「愛川町」・`type==="wild"`・
 *   現在の `wildStatus === "不明"` の5点。1つでも外れたら中止
 * - **重複ガード。**足す caution と同じ文言が既にあれば中止
 * - **整形ガード。**無変更の往復が原本と一致しなければ中止（改行は原本に合わせる）
 * - **書くのは `wildStatus` と `cautions` への追記だけ。**座標・status・料金は触らない
 *
 *   node scripts/apply-wildstatus-aikawa-2026-10-06.js                  # dry run
 *   node scripts/apply-wildstatus-aikawa-2026-10-06.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');

const SRC = 'https://www.town.aikawa.kanagawa.jp/soshiki/kankyou_keizai/syoko/kanko/info/1629185895426.html';

/** 足す caution。3件とも同文（根拠が同じページなので） */
const NOTE =
  '**自治体が公認した野営地ではない（黙認）。**愛川町（環境経済部 商工観光課）は' +
  '「河川敷利用のマナーを守ろう！」で、中津川河川敷が「多くの方がキャンプやバーベキュー、釣り、' +
  '川遊びなどを楽しむ」場であることを認めたうえで、直火禁止・ゴミ持ち帰りを求めている。' +
  '**禁止はされていないが、町が野営地として指定・管理しているわけではない**（予約・料金・区画は無い）。' +
  SRC;

/** [slug, 期待する施設名, 住所に含まれる語] */
const SET = [
  ['nakatsugawa-kasenjiki', '中津川河川敷（田代運動公園）', '愛川町'],
  ['sumida-ohashi-kasenjiki', '角田大橋河川敷', '愛川町'],
  ['hasugebashi-kasenjiki', '八菅橋河川敷', '愛川町'],
];

/** 触らないもの。理由を残す */
const SKIP = [
  ['wadanagahama-kaigan',
    '三浦市公式（観光商工課）の海水浴場ページは和田海水浴場の開設期間しか書いておらず、' +
    'キャンプ・テント泊・焚き火について禁止も許可も記載が無い。県側にも海岸管理者としての記述が' +
    '見つからない。判断材料が無いので "不明" のまま'],
];

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);

// 改行は原本に合わせる（この作業ツリーは autocrlf で CRLF）
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);

if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない。整形が想定と違う');
  process.exit(1);
}

const bySlug = new Map(list.map((c) => [c.slug, c]));
const errors = [];

for (const [slug, name, muni] of SET) {
  const c = bySlug.get(slug);
  if (!c) { errors.push(`${slug}: レコードが無い`); continue; }
  if (c.name !== name) errors.push(`${slug}: 施設名が違う（データ「${c.name}」/ 期待「${name}」）`);
  if (!String(c.address || '').includes(muni)) errors.push(`${slug}: 住所に「${muni}」が無い（${c.address}）`);
  if (c.type !== 'wild') errors.push(`${slug}: type が wild ではない（${c.type ?? '未指定'}）`);
  if (c.wildStatus !== '不明') errors.push(`${slug}: wildStatus が "不明" ではない（${c.wildStatus}）。前提が崩れている`);
  if (!Array.isArray(c.cautions)) errors.push(`${slug}: cautions が配列ではない`);
  else if (c.cautions.some((x) => String(x).includes(SRC))) errors.push(`${slug}: 既に同じ出典URLが cautions にある。二重に足さない`);
}

if (errors.length) {
  console.error(`中止: 照合ガードに ${errors.length} 件ひっかかった。1バイトも書いていない\n  ` + errors.join('\n  '));
  process.exit(1);
}

for (const [slug] of SET) {
  const c = bySlug.get(slug);
  console.log(`${WRITE ? '書込' : 'dry '} ${slug.padEnd(26)} wildStatus: ${c.wildStatus} → 黙認`);
  console.log(`      cautions: ${c.cautions.length}件 → ${c.cautions.length + 1}件（出典URLと「公認ではない」旨を追記）`);
  if (WRITE) {
    c.wildStatus = '黙認';
    c.cautions = [...c.cautions, NOTE];
  }
}
for (const [slug, why] of SKIP) {
  const c = bySlug.get(slug);
  console.log(`skip ${slug.padEnd(26)} wildStatus=${c ? c.wildStatus : '?'} のまま`);
  console.log(`      理由: ${why}`);
}

if (WRITE) {
  fs.writeFileSync(DATA, serialize(list));
  console.log(`\n書き込んだ: ${SET.length}件（wildStatus ${SET.length} / cautions 追記 ${SET.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
