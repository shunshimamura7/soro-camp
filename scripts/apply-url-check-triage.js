/**
 * officialUrl 死活チェック（scripts/url-check-2026-08.md 第2回）の精査結果の反映。
 *
 * **DEAD 3件のうち、閉業していたのは1件だけだった。**残り2件はURLが変わっただけ。
 * 「サイトが落ちている」は閉業の証拠にならない、という前提どおりの結果になった。
 *
 * CLOSED_HINT 4件と CLOSED_HINT_NEWS 1件は**全て誤検出**で、5件とも営業を確認した。
 * データは変更していない。
 *
 * 一度きりの適用スクリプト。実行済み。
 */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DATE = '2026-08-07';
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// validate-data.js の USABLE_FEATURES と同じ並び
const USABLE_FEATURES = [
  'bonfire', 'pet', 'shower', 'bath', 'carIn', 'soloPlan',
  'convenience', 'shop', 'wifi', 'firewood', 'ice', 'alcohol',
];

// ── URL_MOVED 2件 ──────────────────────────────────────────
// どちらも施設は営業中で、officialUrl が古かっただけ。

{
  // takizawaso.com は DNS も引けない。公式は takizawaen.com（「園」＝en）。
  // 電話 0463-75-0900 が一致し、2026年の受付案内も出ている。
  const c = data.find((x) => x.slug === 'takizawaso');
  c.officialUrl = 'https://takizawaen.com/';

  // ⚠ 公式サイトの住所が「〒259-1306 神奈川県秦野市戸川1445」で、
  //   データの「秦野市堀山下1513」と食い違っていた。
  //   決め手は第3の情報。**保存されている座標を逆ジオにかけると「秦野市戸川」**を指す。
  //   座標と公式サイトが一致し、address だけがずれている（引き継ぎ §6-11 と同じ形）。
  c.address = '神奈川県秦野市戸川1445';

  c.lastVerified = DATE;
  console.log('URL_MOVED  takizawaso -> https://takizawaen.com/（address も戸川1445に修正）');
}

{
  // 綴りが違っただけ。greenpa ではなく grinpa。
  // 2026年度の営業案内とオンライン予約が動いている。
  const c = data.find((x) => x.slug === 'pica-fuji-greenpa');
  c.officialUrl = 'https://www.pica-resort.jp/grinpa/';
  c.lastVerified = DATE;
  console.log('URL_MOVED  pica-fuji-greenpa -> https://www.pica-resort.jp/grinpa/');
}

// ── REALLY_CLOSED 1件 ──────────────────────────────────────
{
  // 運営（プリンスホテル）の公式ページに閉業が明記されている。
  //   「箱根園コテージキャンピングは営業を終了いたしました。
  //     長い間ご愛顧いただき誠にありがとうございました。」
  // なっぷの箱根一覧でも施設名が「【R5/9現在 閉鎖】箱根園コテージキャンピング」になっている。
  // 令和5年9月＝2023年9月時点で既に閉鎖。
  const c = data.find((x) => x.slug === 'hakonesono-auto');
  if (!c) throw new Error('slug not found: hakonesono-auto');

  c.status = 'closed';
  c.closedReason = 'closed_business';
  c.closedNote =
    'プリンスホテルが運営していた「箱根園コテージ キャンピング」。' +
    '公式サイトに「営業を終了いたしました」と掲示されており、なっぷの箱根一覧でも' +
    '施設名が「【R5/9現在 閉鎖】箱根園コテージキャンピング」になっている ' +
    'https://www.princehotels.co.jp/hakone-en/';
  // 旧URL（/hakonesono/camp/）は404。閉業の告知が出ている現行ページに差し替える
  c.officialUrl = 'https://www.princehotels.co.jp/hakone-en/';
  c.season = '閉業（旧: 3月〜11月）';

  c.priceMin = 0;
  c.priceMax = 0;
  delete c.priceVerified;
  delete c.priceNote;
  delete c.needsPrice;

  // 旧: 「芦ノ湖畔の高規格キャンプ場。箱根園温泉・遊覧船・水族館と複合リゾート施設が隣接。
  //      設備は完璧だが価格は高め。富士山・芦ノ湖の絶景と温泉を一度に楽しめる贅沢なソロ旅に最適。」
  c.soloComment =
    '芦ノ湖畔の箱根園にあったプリンスホテル運営のキャンプ施設で、正式名称は「箱根園コテージ キャンピング」。' +
    '箱根園温泉・遊覧船・水族館に隣接する高規格な場所だったが、現在は営業を終了している。' +
    '同じ箱根園の「コテージ ウエスト」も営業を終えている。';

  const dropped = USABLE_FEATURES.filter((k) => c.features[k] === true);
  dropped.forEach((k) => {
    c.features[k] = false;
  });

  c.lastVerified = DATE;
  console.log(
    `REALLY_CLOSED  hakonesono-auto -> status: closed / closedReason: closed_business（features ${dropped.length}件を false に）`
  );
}

// ── FALSE_POSITIVE 5件 ─────────────────────────────────────
// CLOSED_HINT 4件と CLOSED_HINT_NEWS 1件。**データは一切変更しない。**
// 一致した語が閉業と無関係だったことを、その場で確かめられるように残す。
const falsePositives = {
  'asagiri-eichinomori': '「閉鎖」はキャンセル規約の「当キャンプ場の判断で施設を閉鎖する場合を除き」',
  'motosu-lakeside': '「閉鎖」は「夜間ゲート閉鎖について」',
  'wellcamp-nishitanzawa': '「廃止」は「ドッグシャワーが廃止になりました（2024/07/19）」',
  'tenshino-mori-camp': '「営業終了」は営業カレンダーの年末表記「1月1-3日、本営業終了(FINAL)」',
  'narakoko': '「閉館」は温泉の「閉館時間が21：00になります」',
};
for (const [slug, why] of Object.entries(falsePositives)) {
  if (!data.find((x) => x.slug === slug)) throw new Error(`slug not found: ${slug}`);
  console.log(`FALSE_POSITIVE  ${slug}（変更なし）… ${why}`);
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('\n3件を更新した（URL_MOVED 2 / REALLY_CLOSED 1）。誤検出5件は変更なし。');
