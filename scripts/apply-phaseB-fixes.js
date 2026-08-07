/**
 * フェーズB: zero-coord-check.md の「データ修正候補」のうち、
 * ソースURLが明記されている行を data/campgrounds.json に反映する。
 *
 * 安全策として各項目に「現在の値」(expect) を持たせ、
 * 実データと食い違ったら1件も書かずに中断する。
 *
 * 反映しないもの:
 *  - 出典が割れている2件（ugusu-camp の season / fukushigawa-auto の address）
 *  - sanogawa-camp の soloComment（フェーズCの担当）
 *
 * 使い方: node scripts/apply-phaseB-fixes.js [--dry]
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'campgrounds.json');
const DRY = process.argv.includes('--dry');

/**
 * slug / field / expect(現在の値) / value(正しい値) / src(ソースURL) / note(判断メモ)
 * 住所は既存データの規約に合わせ 〒 を付けない（205件中 〒 を含むものは0件）。
 */
const FIXES = [
  // --- omuroyama-camp ---
  {
    slug: 'omuroyama-camp',
    field: 'name',
    expect: '大室山キャンプ場（伊東市営）',
    value: '伊東市青少年キャンプ場',
    src: 'https://www.city.ito.shizuoka.jp/gyosei/soshikikarasagasu/shogaigakushuka/kanko/2379.html',
    note: 'slug は変更しない（既存リンク維持）',
  },
  {
    slug: 'omuroyama-camp',
    field: 'address',
    expect: '静岡県伊東市富戸',
    value: '静岡県伊東市池字柏戸676-1',
    src: 'https://www.navitime.co.jp/poi?spot=02022-1192407',
    note: '国土地理院の逆ジオコーディングでも当該座標は「伊東市 池」を返す',
  },

  // --- takadabashi-kasenjiki ---
  {
    slug: 'takadabashi-kasenjiki',
    field: 'name',
    expect: '高田橋河川敷',
    value: '高田橋多目的広場',
    src: 'https://www.pref.kanagawa.jp/docs/u5r/cnt/f550/tabi-140_trachi.html',
  },
  {
    slug: 'takadabashi-kasenjiki',
    field: 'address',
    expect: '神奈川県相模原市中央区',
    value: '神奈川県相模原市中央区水郷田名4-11-23',
    src: 'https://rakucamp.net/free-camp-kasenjiki/',
    note: '〒252-0244 は既存規約に合わせて外した',
  },

  // --- kamioshima-camp ---
  {
    slug: 'kamioshima-camp',
    field: 'priceMin',
    expect: 0,
    value: 1000,
    src: 'https://www.city.sagamihara.kanagawa.jp/kurashi/shisetsu/kouen_kankou/recreation/1003112.html',
  },
  {
    slug: 'kamioshima-camp',
    field: 'priceMax',
    expect: 0,
    value: 2000,
    src: 'https://www.city.sagamihara.kanagawa.jp/kurashi/shisetsu/kouen_kankou/recreation/1003112.html',
  },
  {
    slug: 'kamioshima-camp',
    field: 'priceNote',
    expect: '要問合せ',
    value: 'デイキャンプ1〜10人1,000円／宿泊1泊2日1〜10人2,000円（人数10人ごとに加算）',
    src: 'https://www.city.sagamihara.kanagawa.jp/kurashi/shisetsu/kouen_kankou/recreation/1003112.html',
  },
  {
    slug: 'kamioshima-camp',
    field: 'address',
    expect: '神奈川県相模原市緑区大島3657',
    value: '神奈川県相模原市緑区大島3657付近',
    src: 'https://www.city.sagamihara.kanagawa.jp/kurashi/shisetsu/kouen_kankou/recreation/1003112.html',
  },
  {
    slug: 'kamioshima-camp',
    field: 'season',
    expect: '3月〜11月',
    value: '3月1日〜11月30日（宿泊は4〜6月・10〜11月の土日祝と7/1〜9/30に限定）',
    src: 'https://www.city.sagamihara.kanagawa.jp/kurashi/shisetsu/kouen_kankou/recreation/1003112.html',
  },

  // --- ugusu-camp（season は出典が割れているため対象外） ---
  {
    slug: 'ugusu-camp',
    field: 'address',
    expect: '静岡県賀茂郡西伊豆町宇久須',
    value: '静岡県賀茂郡西伊豆町宇久須2102-13',
    src: 'https://www.nishiizu-kankou.com/stay/ugusucanp',
  },

  // --- fukushigawa-seishonen ---
  {
    slug: 'fukushigawa-seishonen',
    field: 'name',
    expect: '福士川渓谷青少年旅行村',
    value: '福士川渓谷青少年旅行村奥山キャンプ場',
    src: 'https://www.nap-camp.com/yamanashi/11261',
    note: '南部町公式は「青少年旅行村(キャンプ場)」。現行名を含み識別しやすい なっぷ表記を採用',
  },
  {
    slug: 'fukushigawa-seishonen',
    field: 'address',
    expect: '山梨県南巨摩郡南部町',
    value: '山梨県南巨摩郡南部町福士26842',
    src: 'https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html',
  },
  {
    slug: 'fukushigawa-seishonen',
    field: 'priceMin',
    expect: 0,
    value: 2200,
    src: 'https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html',
  },
  {
    slug: 'fukushigawa-seishonen',
    field: 'priceMax',
    expect: 0,
    value: 4400,
    src: 'https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html',
  },
  {
    slug: 'fukushigawa-seishonen',
    field: 'priceNote',
    expect: '要問合せ',
    value: '1名2,200円／2〜4名3,300円／5名以上4,400円（いずれも1泊）・要予約',
    src: 'https://www.town.nanbu.yamanashi.jp/kankou/leisure/Camp-Okuyama.html',
  },

  // --- fukushigawa-auto（address は出典が割れているため対象外） ---
  {
    slug: 'fukushigawa-auto',
    field: 'season',
    expect: '4月〜11月',
    value: '4月1日〜12月31日',
    src: 'https://www.nap-camp.com/yamanashi/11260',
  },

  // --- turkeys-house ---
  {
    slug: 'turkeys-house',
    field: 'name',
    expect: 'ターキーズハウス',
    value: 'ターキーズハウス 江ノ電に泊まれるキャンプ場',
    src: 'https://www.nap-camp.com/yamanashi/11259',
  },
  {
    slug: 'turkeys-house',
    field: 'officialUrl',
    expect: undefined,
    value: 'http://www.turkeyshouse.com/',
    src: 'http://www.turkeyshouse.com/',
  },

  // --- lumberjack-nanbu ---
  {
    slug: 'lumberjack-nanbu',
    field: 'officialUrl',
    expect: 'https://www.lumberjacktaimo.jp/',
    value: '',
    src: 'https://web.archive.org/web/20260115181321/https://www.lumberjacktaimo.jp/',
    note: 'ドメイン失効。現在は無関係の漫画サイトを返すため空文字にする',
  },
  {
    slug: 'lumberjack-nanbu',
    field: 'address',
    expect: '山梨県南巨摩郡南部町',
    value: '山梨県南巨摩郡南部町福士16407',
    src: 'https://web.archive.org/web/20260115181321/https://www.lumberjacktaimo.jp/',
  },
  {
    slug: 'lumberjack-nanbu',
    field: 'tel',
    expect: null,
    value: '0556-66-3110',
    src: 'https://web.archive.org/web/20260115181321/https://www.lumberjacktaimo.jp/',
  },
  {
    slug: 'lumberjack-nanbu',
    field: 'telNote',
    expect: undefined,
    value: '携帯 090-4763-6987',
    src: 'https://web.archive.org/web/20260115181321/https://www.lumberjacktaimo.jp/',
    note: '携帯番号は既存規約に合わせ telNote へ分離',
  },

  // --- nekumasanso-auto ---
  {
    slug: 'nekumasanso-auto',
    field: 'address',
    expect: '山梨県南巨摩郡南部町',
    value: '山梨県南巨摩郡南部町福士15854',
    src: 'https://hukusshigawacamp.eyado.net/map.html',
  },
  {
    slug: 'nekumasanso-auto',
    field: 'tel',
    expect: null,
    value: '0556-66-3241',
    src: 'https://hukusshigawacamp.eyado.net/map.html',
  },
  {
    slug: 'nekumasanso-auto',
    field: 'officialUrl',
    expect: undefined,
    value: 'https://hukusshigawacamp.eyado.net/',
    src: 'https://hukusshigawacamp.eyado.net/',
  },

  // --- sanogawa-camp（soloComment はフェーズCの担当なのでここでは触らない） ---
  {
    slug: 'sanogawa-camp',
    field: 'name',
    expect: '佐野川キャンプ場',
    value: '佐野川河川公園',
    src: 'https://camp.tabinchuya.com/yamanashi/sanogawa.html',
    note: '「キャンプ場としては廃止」は status:"closed" が担うので名前には含めない',
  },

  // --- nishizato-camp-tekichi ---
  {
    slug: 'nishizato-camp-tekichi',
    field: 'soloComment',
    expect:
      '興津川沿いの無料適地。トイレと水場があるのに静かで、標高140mと夏も過ごしやすい。車は入れないので荷物は絞って徒歩で運ぶ。',
    value:
      '興津川沿いの無料適地。トイレと水場があるのに静かで、標高約130mと夏も過ごしやすい。車は入れないので荷物は絞って徒歩で運ぶ。',
    src: '国土地理院 標高API（35.1249393, 138.4407838 で照会。実測 128.6m）',
    note: '「標高140m」が実測と食い違うため約130mに修正',
  },
];

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const bySlug = new Map(camps.map((c) => [c.slug, c]));

const problems = [];
const plan = [];

for (const f of FIXES) {
  const camp = bySlug.get(f.slug);
  if (!camp) {
    problems.push(`slug が見つからない: ${f.slug}`);
    continue;
  }
  const current = camp[f.field];
  if (JSON.stringify(current) !== JSON.stringify(f.expect)) {
    problems.push(
      `${f.slug}.${f.field} の現在値が想定と違う: 実際=${JSON.stringify(current)} / 想定=${JSON.stringify(f.expect)}`
    );
    continue;
  }
  if (JSON.stringify(current) === JSON.stringify(f.value)) {
    problems.push(`${f.slug}.${f.field} は既に反映済み（変更不要）`);
    continue;
  }
  plan.push({ camp, ...f, current });
}

console.log('=== フェーズB: データ修正候補の反映 ===\n');
let lastSlug = '';
for (const p of plan) {
  if (p.slug !== lastSlug) {
    console.log(`\n■ ${p.slug}`);
    lastSlug = p.slug;
  }
  console.log(`  ${p.field}`);
  console.log(`     現在: ${JSON.stringify(p.current)}`);
  console.log(`     修正: ${JSON.stringify(p.value)}`);
  console.log(`     出典: ${p.src}`);
  if (p.note) console.log(`     判断: ${p.note}`);
}

if (problems.length) {
  console.error('\n!! 想定と食い違う項目がある。1件も書き込まずに中断する !!');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}

console.log(`\n適用対象: ${plan.length}項目 / ${new Set(plan.map((p) => p.slug)).size}施設`);

if (DRY) {
  console.log('\n--dry のため書き込みなし。');
  process.exit(0);
}

for (const p of plan) p.camp[p.field] = p.value;

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));
console.log('\ndata/campgrounds.json に書き込んだ。');
