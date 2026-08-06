/**
 * 野営地9件の cautions を、以下5観点が必ず含まれるよう整理する。
 *   直火の可否 / トイレ・水場の有無 / 地形リスク / ゴミの扱い / 閉鎖・有料化のリスク
 *
 * 裏が取れていないものは「要現地確認」と明記する（推測で断定しない）。
 * data/campgrounds.json と scripts/batch-wild.json の両方を同期する。
 *
 * 使い方: node scripts/update-wild-cautions.js
 */
const fs = require('fs');
const path = require('path');

const RIVER_FLOOD = '増水時は立入危険。上流の降雨でも急増水することがある';
const GARBAGE = 'ゴミは完全持ち帰り';
const FREE_CLOSURE = '無料開放のため、マナー違反により閉鎖・規制強化の恐れあり';

const CAUTIONS = {
  'nakatsugawa-kasenjiki': [
    '直火禁止（焚き火台必須）',
    'トイレ・水場なし（田代運動公園の設備が使えるかは要現地確認）',
    RIVER_FLOOD,
    GARBAGE,
    FREE_CLOSURE,
  ],
  'sumida-ohashi-kasenjiki': [
    '直火禁止（焚き火台必須）',
    '簡易トイレあり。水場なし（設置状況は要現地確認）',
    RIVER_FLOOD,
    GARBAGE,
    FREE_CLOSURE,
  ],
  'hasugebashi-kasenjiki': [
    '直火禁止（焚き火台必須）',
    'トイレ・水場なし',
    RIVER_FLOOD,
    GARBAGE,
    FREE_CLOSURE,
  ],
  'wadanagahama-kaigan': [
    '海岸は原則直火禁止（焚き火台と養生シート必須）',
    'トイレ・水場なし（周辺の公衆トイレの有無は要現地確認）',
    '高波・強風時は立入危険。満潮時の浸水にも注意',
    GARBAGE,
    '海水浴シーズンは利用制限の可能性あり。要現地確認',
  ],
  'kofu-shinrinyoku-hiroba': [
    '直火の可否は要現地確認（焚き火台持参が無難）',
    'トイレ・水道なし',
    '熊の出没注意。落石・倒木の恐れもあり、悪天時は入山を避ける',
    GARBAGE,
    '甲府市の無料開放。マナー違反で閉鎖の恐れ',
    '上級者向け',
  ],
  'ogayanagawa-keikoku': [
    '正式名称・営業状況とも未確認。要現地確認',
    '直火禁止（焚き火台必須）',
    '水場・男女別トイレあり（現況は要現地確認）',
    '渓谷沿いのため増水・落石に注意',
    GARBAGE,
    '営業状況が未確認。閉鎖・有料化の可能性あり',
  ],
  'tsuchimura': [
    '直火禁止（焚き火台必須）',
    'トイレ・水場なし。管理棟・受付もなし',
    '増水・落石などの地形リスクは要現地確認',
    GARBAGE,
    '管理者不在の無料開放。閉鎖・有料化の可能性あり',
    '売店・薪なし、全て持参',
    '場所により四駆でないと乗り入れ不可',
  ],
  'kurokawa-shizuoka': [
    '直火禁止（焚き火台必須）',
    '洋式トイレあり。水場の有無は要現地確認',
    '増水・落石などの地形リスクは要現地確認',
    GARBAGE,
    '公園の運営方針により利用制限・有料化の可能性あり。要現地確認',
  ],
  'omuroyama-camp': [
    '1日1団体限定',
    '要事前予約（伊東市民体育センター）',
    '管理人不在・解錠施錠は利用者',
    '酒類持込禁止',
    '直火禁止（焚き火台必須）',
    '洋式トイレあり。水場の有無は要現地確認',
    '地形リスクは要現地確認',
    GARBAGE,
    '伊東市営のため運用変更・有料化の可能性あり',
    '座標が未確定。場所は要現地確認',
  ],
};

for (const p of ['data/campgrounds.json', 'scripts/batch-wild.json']) {
  const full = path.join(__dirname, '..', p);
  if (!fs.existsSync(full)) { console.log(`${p}: なし`); continue; }
  const d = JSON.parse(fs.readFileSync(full, 'utf-8'));
  let n = 0;
  for (const c of d) {
    const next = CAUTIONS[c.slug];
    if (!next) continue;
    const before = (c.cautions || []).length;
    c.cautions = next;
    n++;
    if (p.startsWith('data/')) {
      console.log(`  ${c.slug}: ${before} → ${next.length}項目`);
    }
  }
  fs.writeFileSync(full, JSON.stringify(d, null, 2) + (p.includes('batch') ? '\n' : ''));
  console.log(`${p}: ${n}件更新`);
}
