/**
 * wild-sites-check.md フェーズ2の反映。
 *
 * RESTRICTED 判定のうち、期間限定で条件が変わる2件に restrictions を付ける。
 *   wadanagahama-kaigan    … 海水浴場開設期間中は焚き火・火気調理器具が禁止
 *   kofu-shinrinyoku-hiroba … 冬期林道通行止で休館。あわせて利用対象が甲府市民限定
 *
 * 判定はビルド時ではなく閲覧時に public/restrictions.js が行う。
 * ここで入れるのは期間・理由・出典だけ。
 *
 * 使い方: node scripts/apply-phase2-restrictions.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const KOFU_KARTE =
  'https://www.city.kofu.yamanashi.jp/file_summary/shisetu_karte/3-10.pdf';

function find(slug) {
  const c = camps.find((x) => x.slug === slug);
  if (!c) throw new Error(`slug "${slug}" が見つからない`);
  return c;
}

const log = [];

// ── 和田長浜海岸 ────────────────────────────────────────────────────────────
// 三浦市海水浴場ルール第25条。第1条の対象海水浴場に和田海水浴場が明記されている。
// 令和8年の開設期間は 7/3〜8/31。開設日は年により数日前後するので reason に断りを入れる。
{
  const c = find('wadanagahama-kaigan');
  c.restrictions = [
    {
      type: 'bonfire',
      from: '07-03',
      to: '08-31',
      reason:
        '海水浴場の開設期間中は、三浦市海水浴場ルール第25条により焚き火および火気を使用する調理器具が使用できない（焚き火台も不可。開設日は年により数日前後する）',
      source:
        '三浦市海水浴場ルール第25条【令和7年度】 https://www.pref.kanagawa.jp/documents/122025/r7miurashi.pdf',
    },
  ];
  log.push(`wadanagahama-kaigan: restrictions 1件（bonfire 07-03〜08-31）`);
}

// ── 甲府市 森林浴広場 ──────────────────────────────────────────────────────
// 施設カルテ 3-10（基準日 令和7年3月31日）の休館日と利用対象者。
{
  const c = find('kofu-shinrinyoku-hiroba');
  c.restrictions = [
    {
      type: 'access',
      from: '12-10',
      to: '04-25',
      reason: '冬期林道通行止期間のため休館（甲府市 施設カルテの休館日）',
      source: `甲府市 施設カルテ 3-10（基準日 令和7年3月31日） ${KOFU_KARTE}`,
    },
  ];
  c.eligibility = {
    label: '甲府市民限定',
    note: '施設カルテの利用対象者は「甲府市民」',
    source: `甲府市 施設カルテ 3-10 ${KOFU_KARTE}`,
  };
  log.push('kofu-shinrinyoku-hiroba: restrictions 1件（access 12-10〜04-25）+ eligibility');

  // season が "通年" のままだと、同じページで休館期間を出しながら通年営業と言うことになる
  const prevSeason = c.season;
  c.season = '通年（冬期林道通行止期間 12/10〜4/25 は休館）';
  log.push(`kofu-shinrinyoku-hiroba: season "${prevSeason}" → "${c.season}"`);
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log('フェーズ2: データ反映');
log.forEach((l) => console.log(`  - ${l}`));
