/**
 * batch76-check.md の反映 フェーズ2 — VERIFIED 27件。
 *
 * priceMin / priceMax には**ソロ1名が実際に払う総額**を入れる。
 * 入場料・駐車料・渡船料・管理費などの必須実費を含めた金額。
 * priceNote には内訳と**課金方式**を書く。サイト単位課金は
 * 「ソロでも定員込みの満額」と分かる書き方にする。
 *
 * 使い方: node scripts/apply-batch76-phase2.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const VERIFIED_DATE = '2026-08-07';

/**
 * 反映するデータ。fields はそのまま代入、features は features 配下に代入。
 * priceNote の先頭に課金方式を書く方針で統一している。
 */
const RECORDS = [
  {
    slug: 'yanagishima',
    fields: {
      address: '神奈川県茅ヶ崎市柳島海岸1592番1地先',
      tel: '0467-87-1385',
      officialUrl: 'https://www.yanagishima-camp.com/',
      priceMin: 3200, priceMax: 3700,
      priceNote: 'サイト単位課金（1サイト定員5名。ソロ1名でも同額）。テントサイト1泊 通常期3,200円／繁忙期3,700円。日帰りは通常期2,700円／繁忙期3,200円',
      season: '通年（年末年始12/29〜1/3も開場）',
      closedDays: '火曜（7・8月を除く）。火曜が休日の場合は開場し、翌日以降の直近平日',
    },
    features: { bonfireNote: '各サイトの耐火タイルの上でのみ可。灰は炭捨て場へ' },
  },
  {
    slug: 'toyanosawa',
    fields: {
      name: 'とやの沢キャンプ場',
      address: '山梨県南都留郡道志村長又12704',
      tel: '0554-52-1610',
      priceMin: 2900, priceMax: 2900,
      priceNote: '人数課金＋サイト料。キャンプ2,000円＋入場料 大人900円・子供700円 → ソロ1名1泊2,900円。デイキャンプ1,000円＋入場料大人500円。バンガロー8,000〜10,000円',
      season: '4月中旬〜11月下旬',
    },
  },
  {
    slug: 'suigennnomori',
    fields: {
      name: '水源の森 キャンプ・ランド',
      address: '山梨県南都留郡道志村馬場5821-2',
      tel: '070-2673-1122',
      officialUrl: 'https://www.doshisuigen-mori.com/',
      priceMin: 8800, priceMax: 16500,
      priceNote: '区画課金。テントサイト16,500円〜（ソロ使用時8,800円〜）、キャビン13,200円〜（ソロ使用時8,800円〜）。全サイト120㎡以上、24時間無料のシャワー室あり',
      closedDays: '不定休',
    },
  },
  {
    slug: 'minoishtaki',
    fields: {
      address: '神奈川県相模原市緑区若柳1628',
      tel: '042-685-0330',
      officialUrl: 'https://camp-minoishi.com/',
      priceMin: 2970, priceMax: 2970,
      priceNote: '人数課金。往復渡船料 大人1,320円＋宿泊料（入場料込）大人1,650円 → ソロ1名1泊2,970円。道路・鉄道では行けず渡し船のみなので渡船料は必須。子供は渡船660円＋宿泊1,100円',
    },
  },
  {
    slug: 'hikenkayama',
    fields: {
      address: '静岡県菊川市富田3126-6',
      tel: '0537-35-0936',
      officialUrl: 'https://www.hitsurugi-camp.com/',
      priceMin: 1210, priceMax: 2530,
      priceNote: '区画課金＋人数課金。キャンプサイト1区画1泊1,100円＋小学生以上1人110円 → ソロ1名1泊1,210円。バンガロー1棟2,420円。日帰りはサイト550円・バンガロー1,210円＋加算50円。完全予約制（使用日の14日前まで）',
    },
  },
  {
    slug: 'narakoko',
    fields: {
      address: '静岡県掛川市居尻179番地',
      tel: '0537-25-2055',
      officialUrl: 'https://www.narakoko.info/',
      priceMin: 1500, priceMax: 4000,
      priceNote: '区画課金＋人数課金。入場料 大人500円・子供150円＋サイト使用料 オートフリー大人1,000円〜 → ソロ1名1泊1,500円〜。オートAC電源付1区画3,500円〜、オート林間1区画2,500円〜。3シーズン制。※公式に「令和8年4月からの新料金」の掲示あり',
      season: '通年（4〜10月は無休、11〜3月は第1火曜と年始が休み）',
      closedDays: '11月〜3月の第1火曜（祝日の場合は翌日）、年始',
    },
  },
  {
    slug: 'asagiri-foodpark',
    fields: {
      name: 'AFPオートキャンプ場（スタイルキャビンあさぎり）',
      address: '静岡県富士宮市根原449-11',
      tel: '0544-29-5101',
      officialUrl: 'https://asagiri-foodpark.com/afp.html',
      priceMin: 2400, priceMax: 4400,
      priceNote: '人数課金＋車両料金。入場料 大人1,000円・小学生500円＋車両料金（バイク1,400円／普通車2,400円／キャンプ仕様車3,400円）→ ソロ1名1泊 バイク2,400円・普通車3,400円。電源付サイト（1・2・3番）は別途500円/日',
      season: '通年（冬期12〜2月は毎週木曜休）',
      closedDays: '冬期（12〜2月）毎週木曜',
    },
    features: { bonfireNote: '直火禁止' },
  },
  {
    slug: 'tsukiyono-doshi-camp',
    fields: {
      address: '山梨県南都留郡道志村950',
      tel: '0554-52-2461',
      priceMin: 2500, priceMax: 2500,
      priceNote: 'サイト単位課金。テントサイト2,500円〜（1区画・1泊・大人1名・車1台込み）。追加は大人1名1,000円・子供800円、車1台1,000円。※加算の起点が公式で明示されておらず要確認',
      season: '3月1日〜11月下旬',
    },
  },
  {
    slug: 'hananomori-camp',
    fields: {
      address: '山梨県南都留郡道志村9709-1',
      tel: '0554-52-2776',
      officialUrl: 'https://www.hananomori.jp/',
      priceMin: 6000, priceMax: 6000,
      priceNote: 'サイト単位課金。オート1区画6,000円で4人まで込みのため、ソロ1名でも6,000円（人数割にならない）。AC電源1,300円、追加1人1,300円、平日割引あり。コテージ23,100〜26,300円、キャビン12,700円・13,900円',
    },
  },
  {
    slug: 'fujisan-genshijin',
    fields: {
      address: '静岡県富士宮市上井出2527番地の1',
      tel: '080-3689-0045',
      officialUrl: 'https://genshijin-fujinomiya.com/',
      priceMin: 7700, priceMax: 7700,
      priceNote: 'サイト単位課金。AC電源付オートサイト7,700円で5名・ペット2匹・車2台まで込みのため、ソロ1名でも7,700円（人数割にならない）。追加は大人1,100円・小中学生550円・ペット550円。シャワーは15分500円/人が別途',
      season: '通年（年中無休）',
    },
  },
  {
    slug: 'granpapa-solo-bocchi',
    fields: {
      address: '静岡県富士宮市猪之頭26-1',
      officialUrl: 'https://www.gran-papa.com/site/solo/',
      priceMin: 3000, priceMax: 4500,
      priceNote: '区画課金（ソロ専用区画）。富士山眺望ぼっち区画 1名3,000円/泊、奥芝ぼっち区画 1名4,500円/泊（いずれも人数追加1名+1,000円、〜2名）。駐車・駐輪は1区画1台無料、2台目以降500円/台',
      season: '土・GW・お盆・年末年始・連休のみ営業（平日は営業しない）。冬期は年始営業後〜3月中旬ごろ休業',
    },
  },
  {
    slug: 'tenshino-mori-camp',
    fields: {
      address: '静岡県富士宮市佐折631',
      tel: '0544-54-1543',
      officialUrl: 'https://tenshinomori.net/',
      priceMin: 5100, priceMax: 5600,
      priceNote: 'サイト単位課金＋入場料。テントサイト（4名まで）4,500円＋入場料 大人600円・子供400円 → ソロ1名1泊5,100円。ハイシーズンは+500円。BBQサイト（11:00〜16:00）3,000円',
      season: '4月1日〜11月30日',
    },
    features: { bonfireNote: '可。消火器や水バケツを用意して初期消火に備えること' },
  },
  {
    slug: 'nelo-gotemba',
    fields: {
      name: 'NELO Gotemba',
      area: '小山町',
      address: '静岡県駿東郡小山町新柴字道端672-1',
      officialUrl: 'https://challengeoutdoor.co/nelogotemba/',
      priceMin: 2500, priceMax: 5500,
      priceNote: '区画課金＋人数課金。サイト1,000〜4,000円（変動制）＋大人1,500円/人・子供500円/人（3歳未満無料）→ ソロ1名1泊2,500円〜',
    },
  },
  {
    slug: 'marubi-auto',
    fields: {
      address: '静岡県御殿場市印野1379-1',
      tel: '0550-88-5335',
      officialUrl: 'https://marubi.main.jp/',
      priceMin: 5500, priceMax: 6600,
      priceNote: 'サイト単位課金。オートサイト5,500円で大人2人＋小人2人＋車1台まで込みのため、ソロ1名でも5,500円（人数割にならない）。AC電源使用料1,100円。予約は利用日の2ヶ月前から',
      season: '3月1日〜12月31日',
    },
  },
  {
    slug: 'otome-forest-camp',
    fields: {
      address: '静岡県御殿場市深沢2190',
      tel: '0550-82-2090',
      officialUrl: 'https://www.gotemba-otome.jp/',
      priceMin: 3000, priceMax: 3000,
      priceNote: '区画課金＋人数課金。テントサイト（駐車場あり・定員5名）1泊1区画2,000円＋入場料 大人最大1,000円 → 市外からのソロ1名は最大3,000円。駐車場なしの区画は1,000円。御殿場市民は区画800円／400円',
      season: '3月〜11月',
      closedDays: '7〜9月を除く月曜',
      eligibility: {
        type: 'discount',
        label: '御殿場市民は料金が2.5倍安い',
        note: '市民料金はテントサイト800円（市外2,000円）。総利用人数の半数以上が御殿場市内在住の場合に適用されるため、ソロなら本人が市民であることが条件',
        source: '乙女森林公園キャンプ場 料金のご案内 https://www.gotemba-otome.jp/',
      },
    },
  },
  {
    slug: 'magic-hour-camp',
    fields: {
      address: '静岡県静岡市清水区由比入山3497',
      tel: '090-9206-5788',
      priceMin: 7000, priceMax: 10000,
      priceNote: 'サイト単位課金。オートキャンプサイト7,000円〜で1サイト10人まで込みのため、ソロ1名でも7,000円〜（人数割にならない）。ティピー1棟＋オートサイト10,000円〜',
      season: '通年（定休日なし）',
    },
  },
  {
    slug: 'ikawa-auto',
    fields: {
      name: '南アルプス井川オートキャンプ場',
      address: '静岡県静岡市葵区田代449-2',
      tel: '054-260-2322',
      officialUrl: 'https://www.city.shizuoka.lg.jp/shisetsu/s0001021.html',
      priceMin: 3800, priceMax: 4800,
      priceNote: '区画課金＋人数課金。サイト使用料1区画3,500円＋利用料 大人300円・小人100円 → ソロ1名1泊3,800円。AC電源1日1,000円。温泉入浴料300円、カヌー貸出30分500円',
      season: '4月の第4土曜日〜11月末（期間内無休）。12月〜4月中旬は休業',
    },
  },
  {
    slug: 'hayato-hakone',
    fields: {
      address: '神奈川県足柄下郡箱根町湯本茶屋70',
      tel: '0460-83-8351',
      priceMin: 2750, priceMax: 6600,
      priceNote: 'サイト単位課金だが1名向けの区分がある。小サイト12㎡2,750円（1名含む）／中15㎡4,400円（2名含む）／大19㎡6,600円（3名含む）。追加1名ごと2,200円 → ソロ1名1泊2,750円。全10サイト',
    },
  },
  {
    slug: 'akiyamagawa-camp',
    fields: {
      address: '神奈川県相模原市緑区名倉25',
      tel: '042-687-2030',
      officialUrl: 'http://www.akikawaya.co.jp/',
      priceMin: 2170, priceMax: 2170,
      priceNote: '区画課金＋人数課金。入場料 大人1,050円・小人840円＋清掃料60円/人＋駐車料 普通車530円＋サイト使用料1区画530円 → ソロ1名1泊2,170円（車利用時）。バンガロー3,900〜29,500円、レイクハウス43,000〜47,300円',
    },
  },
  {
    slug: 'hachibanaen-miroku',
    fields: {
      name: '蜂花苑 寄・中津川 源流の郷キャンプ場',
      area: '松田町・寄',
      address: '神奈川県足柄上郡松田町寄7138番',
      officialUrl: 'https://houkaen.jp/',
      priceMin: 4000, priceMax: 4000,
      priceNote: '人数課金。施設利用料 1人1泊 大人（中学生以上）4,000円・小学生2,000円・小学生未満無料 → ソロ1名1泊4,000円。10組限定',
    },
  },
  {
    slug: 'camp-bean-izu',
    fields: {
      address: '静岡県伊豆市大平1499-2',
      officialUrl: 'https://www.campbean.jp/',
      priceMin: 2000, priceMax: 2000,
      priceNote: '人数課金＋車両料金。大人1,500円（未就学児無料）＋車500円（バイク・自転車は無料）→ ソロ1名1泊2,000円',
      season: '通年',
    },
    features: { bonfireNote: '指定場所で直火が可能' },
  },
  {
    slug: 'ecopa-inagako',
    fields: {
      address: '山梨県南アルプス市上市之瀬1760',
      tel: '055-283-8700',
      officialUrl: 'https://ecopa-inagako.jp/',
      priceMin: 500, priceMax: 3600,
      priceNote: '区画課金＋人数課金。テント専用（グリーンロッジ）1人200円＋1区画300円（未就学児無料）→ ソロ1名1泊500円。オート1区画（北伊奈ヶ湖オートキャンプ場）3,600円。コテージ6人用15,000円・10人用25,000円。予約は利用日の6ヶ月前の1日から',
    },
  },
  {
    slug: 'yamanakako-minami-auto',
    fields: {
      address: '山梨県南都留郡山中湖村平野520-45',
      tel: '0555-65-8859',
      officialUrl: 'https://www.minami-camp.com/',
      priceMin: 4400, priceMax: 4400,
      priceNote: 'サイト単位課金。富士ビューフリーサイト 通常4,400円/予約で、ソロ1名でも同額（人数割にならない）',
    },
  },
  {
    slug: 'shinozawa-ootaki-camp',
    fields: {
      address: '山梨県北杜市白州町大坊1181',
      tel: '0551-35-3131',
      officialUrl: 'https://shinozawa-ootaki-camp.com/',
      priceMin: 6900, priceMax: 7900,
      priceNote: '区画課金＋人数課金。オート1区画6,600円〜が5人まで込みのため、ソロ1名でも管理費300円を足して6,900円（人数割にならない）。犬1頭500円、AC電源1,000円、バンガロー13,200円〜',
      season: '3月中旬〜12月末（状況により変動。期間外は要問合せ）',
    },
  },
  {
    slug: 'oishii-camp',
    fields: {
      name: '富士ヶ嶺・おいしいキャンプ場',
      address: '山梨県南都留郡富士河口湖町富士ヶ嶺696',
      tel: '080-2627-7364',
      officialUrl: 'https://oic-camp.com/',
      priceMin: 1800, priceMax: 8000,
      priceNote: '区画課金。ソロキャンプサイト1区画1,800円〜。オート小AC付5,500円〜、オートAC付7,000円〜、ウッドデッキサイト8,000円〜。予約はHPからのみで利用日の4ヶ月前から',
    },
  },
  {
    slug: 'nagomino-sato-tsuru',
    fields: {
      name: '都留戸沢の森 和みの里キャンプ場',
      address: '山梨県都留市戸沢1126',
      tel: '0554-46-0753',
      priceMin: 3500, priceMax: 4000,
      priceNote: 'サイト単位課金。オートサイト1区画3,500円〜が小学生以上4人まで込みのため、ソロ1名でも3,500円〜（人数割にならない）。AC電源500円、追加は小学生以上1人800円（最大6人）。コテージ6人まで16,500円。天然温泉「芭蕉月待ちの湯」を割引利用可',
      season: '通年',
    },
  },
  {
    slug: 'fuji-midori-kyuka-auto',
    fields: {
      area: '鳴沢村',
      address: '山梨県南都留郡鳴沢村8532-5',
      priceMin: 5280, priceMax: 8580,
      priceNote: 'サイト単位課金＋人数課金。1サイト 平日4,400円／休前日5,500円／特別日7,700円＋入場料 大人880円・小人660円 → ソロ1名は平日5,280円。河口湖駅から無料送迎あり（事前予約制）',
    },
  },
];

const changes = [];
for (const rec of RECORDS) {
  const c = camps.find((x) => x.slug === rec.slug);
  if (!c) throw new Error(`slug "${rec.slug}" が見つからない`);

  for (const [k, v] of Object.entries(rec.fields)) {
    if (JSON.stringify(c[k]) !== JSON.stringify(v)) {
      changes.push({ slug: rec.slug, field: k, prev: c[k], next: v });
    }
    c[k] = v;
  }
  if (rec.features) {
    for (const [k, v] of Object.entries(rec.features)) {
      if (c.features[k] !== v) changes.push({ slug: rec.slug, field: `features.${k}`, prev: c.features[k], next: v });
      c.features[k] = v;
    }
  }

  // 内訳を書けたので確認済みにする
  c.priceVerified = true;
  c.lastVerified = VERIFIED_DATE;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2) + '\n', 'utf-8');

console.log(`VERIFIED ${RECORDS.length}件を反映（${changes.length}フィールドを変更）\n`);
console.log('■ 料金の変更');
for (const rec of RECORDS) {
  const pm = changes.find((ch) => ch.slug === rec.slug && ch.field === 'priceMin');
  if (pm) {
    const diff = pm.next - pm.prev;
    const mark = Math.abs(diff) >= 1000 || (pm.prev > 0 && pm.next / pm.prev >= 2) ? ' ←乖離' : '';
    console.log(`  ${rec.slug.padEnd(26)} ${String(pm.prev).padStart(5)} → ${String(pm.next).padStart(5)}  (${diff >= 0 ? '+' : ''}${diff})${mark}`);
  }
}
const verified = camps.filter((c) => c.priceVerified === true).length;
console.log(`\npriceVerified: true  ${verified}件 / 未確認 ${camps.length - verified}件`);
