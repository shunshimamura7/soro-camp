/**
 * 第2弾候補のうち未掲載だった7件を追加する（2026-10-06・フェーズ3）。
 *
 * ## 掲載の門（4つすべて満たしたものだけ入れる）
 *
 *   1. 施設公式 or 自治体公式があり、施設名と住所（市町村）が一致
 *   2. そのページか公式予約先に「予約方法」か「料金」がある（名前のヒットだけは不可）
 *   3. 今季の休業・閉鎖告知が無い（季節営業は可。営業期間は cautions に書く）
 *   4. 観光協会・DMO・予約サイト単独・口コミだけの施設は入れない
 *
 * **7件とも通過した。**各レコードの `source` が根拠。
 *
 * ## 座標は7件とも入れない（`needsCoord: true`）
 *
 * 採ってよいのは「公式ページ埋め込み地図の**ピン**座標で、`verify-coords-gsi.js` を
 * 通ったもの」だけ。**7件とも公式ページからピン座標を取り出せなかった。**
 * 住所ジオコーディングは使わない決まりなので、`data/candidate-batch2-geocode-proposals-2026-08-26.json`
 * があっても採らない。`lat/lng` は 0 のままにして `needsCoord: true` を立てる
 * （`hasUsableCoord()` が false を返し、**地図にピンが出ない**）。
 * 7件とも `knownGaps` に「実ピン確認」と書かれていた通りの状態で、しゅんの目視待ち。
 *
 * ## scores は中立の 3 で置く。**評価ではない**
 *
 * `validate-data.js` の必須フィールドに `scores` があるので省けない。
 * しかし公式ページから静けさ・景観を採点する根拠は得られないので、
 * **全項目 3（中立）を置き、`scoresVerified: false` を立てる。**
 * 画面には「評価確認中」が出る。**3 は「普通という評価」ではなく「未評価」の置き字。**
 *
 * ## features は公式で確認できたものだけ
 *
 * `boolean` の未指定が「未確認」、`false` は公式に「なし・不可」と書いてあった場合だけ。
 * 埋めなかったキーは**書かない**（`undefined` のまま）。
 *
 * ## 料金は7件とも公式で取れた（`priceVerified: true`）
 *
 * `priceMin` は**ソロ1名の総額**。入場料・施設利用料・車両料が別建ての施設は合算してある。
 * `priceNote` の先頭に課金方式を書く。
 *
 * ## 安全装置
 *
 * - **`--write --force` の二重ガード**
 * - **重複ガード。**slug が既にある／施設名＋市町村が既存レコードと一致する場合は中止
 * - **必須フィールドガード。**追加するレコードに id/slug/name/prefecture/area/scores が
 *   揃っているか、scores が 1〜5 の整数かを**書く前に**検査
 * - **整形ガード。**無変更の往復が原本と一致しなければ中止（改行は原本に合わせる）
 *
 *   node scripts/apply-batch2-remaining-2026-10-06.js                  # dry run
 *   node scripts/apply-batch2-remaining-2026-10-06.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');
const TODAY = '2026-10-06';

/** 未評価の置き字。**採点ではない**（scoresVerified: false とセットでのみ使う） */
const NEUTRAL = { quietness: 3, scenery: 3, value: 3, access: 3, facility: 3 };

const base = (o) => ({
  type: 'campground',
  status: 'active',
  lat: 0,
  lng: 0,
  needsCoord: true,
  scores: { ...NEUTRAL },
  scoresVerified: false,
  priceVerified: true,
  lastVerified: TODAY,
  ...o,
});

const ADD = [
  base({
    id: 'sugari-camp',
    slug: 'sugari-camp',
    name: 'キャンプすがり',
    prefecture: '静岡',
    area: '浜松・天竜',
    address: '静岡県浜松市天竜区横川741-2',
    priceMin: 1500,
    priceMax: 2500,
    priceNote:
      'サイト単位課金（ソロ専用プラン）。通常期1,500円/泊〜、ハイシーズン2,500円/泊〜。' +
      '公式のソロキャンプ専用ページに単独利用の料金として掲載',
    features: {
      bonfire: true,
      bonfireNote: '直火が可能なサイトがあると公式に記載',
      reservation: '要',
      reservationNote: '24時間オンライン予約。4ヶ月前から受付',
    },
    season: '要確認（公式に営業期間の記載なし。予約カレンダーで確認）',
    soloComment:
      '天竜の山あいにあるソロ専用プランを持つキャンプ場。直火が可能なサイトがあり、22時以降は静粛のルール。チェックイン・アウトとも12時。',
    officialUrl: 'https://sugari.camp/lp/solo-camp.php',
    tel: null,
    cautions: [
      '**22時以降は静粛**のルールが公式に明記されている',
      '予約は24時間オンライン受付（4ヶ月前から）。公式ページから予約システムへ遷移する',
      '**座標が未取得。**地図にピンを出していない。公式の案内図で場所を確認すること',
    ],
    source: ['https://sugari.camp/lp/solo-camp.php'],
  }),

  base({
    id: 'fuji-anmo-camp',
    slug: 'fuji-anmo-camp',
    name: '富士山あんもの森Camp Field',
    prefecture: '静岡',
    area: '富士宮',
    address: '静岡県富士宮市山宮3690',
    priceMin: 2500,
    priceMax: 3000,
    priceNote:
      'プラン単位課金（定員つき）。**ソロバイク2,500円／ソロ（車）3,000円**、いずれも定員1名。' +
      'デュオ4,000円（2名）、ファミリー5,500円（3〜5名）。日帰り大人1,000円・小学生以下無料',
    features: {
      bonfire: true,
      bonfireNote: '焚き火台と焚き火シートが必須。**直火不可**',
      carIn: false,
      carInNote: '荷物の積み下ろし時のみサイトへ車両を入れられる。常時の乗り入れは不可',
      reservation: '要',
      reservationNote: '問い合わせフォーム・公式Instagram DM・公式LINE のいずれかで事前予約',
      garbage: 'ゴミ・灰は指定場所へ',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '富士宮の全フリーサイトのキャンプ場。ソロはバイクと車で別プランがあり、どちらも定員1名。焚き火は焚き火台と焚き火シートが必須で直火は不可。21時以降は静粛。',
    officialUrl: 'https://fuji-anmonomori.com/menu/',
    tel: '070-9198-2521',
    cautions: [
      '**全フリーサイト。**サイトへの車両進入は荷物の積み下ろし時のみ',
      '**21時以降は静粛**のルールが公式に明記されている',
      '予約は問い合わせフォーム・公式Instagram DM・公式LINE から。**電話予約の案内は公式に無い**',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://fuji-anmonomori.com/menu/'],
  }),

  base({
    id: 'okitsugawa-auto',
    slug: 'okitsugawa-auto',
    name: 'おきつがわオートキャンプ場',
    prefecture: '静岡',
    area: '清水・オクシズ',
    address: '静岡県静岡市清水区茂野島1100',
    priceMin: 3000,
    // 公式が示すのは下限だけ（サイト料「1,500円〜」）。**上限が公開されていない。**
    // `priceMax` は型が必須なので、既存29件と同じく priceMin と同値を置く
    // （`kannogawa` `takizawaso` `okudoshi-auto` など、公式が単一額・下限しか出さない施設の扱い）。
    // 上限を推測して入れると、根拠のない金額が詳細ページと構造化データに出る。
    priceMax: 3000,
    priceNote:
      '人数課金＋サイト課金の合算。**施設利用料 16才以上1,500円**（小中学生500円）＋**サイト料1,500円〜**（区画サイズによる）で、' +
      'ソロ1名1泊3,000円〜。日帰りは施設利用料1,000円＋サイト1,000円（土曜・ハイシーズンは3,000円）',
    features: {
      carIn: true,
      carInNote: '全区画オートサイト',
      shower: true,
      showerNote: '温水シャワー無料',
      toilet: '洋式',
      toiletNote: '洋式水洗',
      reservation: '要',
      reservationNote: 'LINE公式アカウント・なっぷ・じゃらんから予約',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '興津川沿いの全区画オートサイトのキャンプ場。温水シャワーが無料で洋式水洗トイレ・給湯つきの流し台がある。21時以降はクワイエットタイム。静岡市街から約40分。',
    officialUrl: 'https://camp-joe.com/okitsugawa/',
    tel: '050-3575-7202',
    cautions: [
      '**21時以降はクワイエットタイム**が公式に設定されている',
      '悪天候時は施設の判断で閉鎖することがあると公式に記載',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://camp-joe.com/okitsugawa/'],
  }),

  base({
    id: 'kaaji-no-mori',
    slug: 'kaaji-no-mori',
    name: 'カージの杜',
    prefecture: '千葉',
    area: '君津',
    address: '千葉県君津市馬登729',
    priceMin: 2500,
    // 公式はキャンプ1人1泊2,500円の単一額のみ。上限の記載が無いので priceMin と同値を置く
    priceMax: 2500,
    priceNote:
      '人数課金。**キャンプ 1人1泊2,500円**（連泊は1泊2,000円）。デイキャンプ・BBQ は1人1,500円（3名以上）。' +
      '宿泊棟1棟1,500円、薪500円',
    features: {
      firewood: true,
      firewoodNote: '薪の販売あり（500円）',
      reservation: '要',
      reservationNote: 'メールまたは電話で受付',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '君津の小規模なキャンプ場で、公式が「ソロはもちろん」と案内している。最大30名程度の規模。薪の販売があり、チェックイン・アウトとも正午。',
    officialUrl: 'https://www.tschiba.com/kaaji/plan.html',
    tel: '0439-52-7734',
    cautions: [
      '**公式サイトの住所表記が「君津市君野729」になっているが、併記の郵便番号 299-1115 は君津市' +
        '「馬登」のもの。**ここでは郵便番号と一致する馬登729 を採っている。訪問前に施設へ確認すること',
      '運営はカントリー館の木（同一サイト内の施設）。予約はメールまたは電話',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://www.tschiba.com/kaaji/plan.html', 'https://www.tschiba.com/kaaji/'],
  }),

  base({
    id: 'seiwa-kenminnomori',
    slug: 'seiwa-kenminnomori',
    name: '千葉県立清和県民の森キャンプ場',
    prefecture: '千葉',
    area: '君津',
    address: '千葉県君津市豊英660',
    priceMin: 600,
    priceMax: 900,
    priceNote:
      'サイト単位課金。**小型テントサイト（2.5×4.2m）600円/泊、大型（4.0×4.2m）900円/泊。**' +
      '最少人数の条件は公式に無いのでソロ1名600円から。レンタルテントは小型（4人用）800円・大型（6人用）1,000円',
    features: {
      bonfire: true,
      bonfireNote: '指定エリアで焚き火台を使用',
      carIn: false,
      carInNote: '荷下ろし時のみサイト近くまで車・バイクを入れ、その後は林間広場駐車場へ移動',
      reservation: '要',
      reservationNote: 'なっぷまたは電話（0439-38-2222）で受付',
    },
    season: '要確認（バーベキューサイトは通年と公式に記載。テントサイトの期間は明記なし）',
    soloComment:
      '千葉県立の県民の森にある全10サイトのキャンプ場。各サイトにかまどとベンチテーブルがある。小型サイト600円から。焚き火は指定エリアで焚き火台を使う。',
    officialUrl: 'https://www.seiwanomori.jp/%E5%90%84%E6%96%BD%E8%A8%AD%E3%81%AE%E7%89%B9%E5%BE%B4%E3%81%A8%E3%81%94%E6%A1%88%E5%86%85/',
    reservationUrl: 'https://www.nap-camp.com/chiba/11961',
    tel: '0439-38-2222',
    cautions: [
      '千葉県立の施設。**指定管理者は千葉県森林組合**',
      '**車・バイクは荷下ろし時のみ**サイト近くまで。その後は林間広場駐車場へ移動する',
      '全10サイトと小規模。予約はなっぷまたは電話',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: [
      'https://www.seiwanomori.jp/%E5%90%84%E6%96%BD%E8%A8%AD%E3%81%AE%E7%89%B9%E5%BE%B4%E3%81%A8%E3%81%94%E6%A1%88%E5%86%85/',
      'https://www.pref.chiba.lg.jp/shinrin/kenminnomori/seiwa.html',
    ],
  }),

  base({
    id: 'fruits-village',
    slug: 'fruits-village',
    name: 'オートキャンプ・フルーツ村',
    prefecture: '千葉',
    area: '君津',
    address: '千葉県君津市旅名96',
    priceMin: 3000,
    priceMax: 6000,
    priceNote:
      'サイト単位課金。**平日限定のソロ割引（大人1名・車1台）で電源なし3,000円／電源付き4,000円。**' +
      '**通常のオートサイトは6,000円。**週末・祝祭日・GW・お盆・年末年始はソロ割引の対象外',
    features: {
      carIn: true,
      carInNote: 'オートサイト',
      reservation: '要',
      reservationNote: 'インターネット予約と電話（0439-38-2255、8:00〜18:00）',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '君津のオートキャンプ場。平日限定で大人1名・車1台のソロ割引があり、電源なし3,000円。週末・祝祭日・GW・お盆・年末年始は割引の対象外で通常料金になる。',
    officialUrl: 'http://fruitsvillage.com/custom11.html',
    tel: '0439-38-2255',
    cautions: [
      '**ソロ割引は平日限定。**週末・祝祭日・GW・お盆・年末年始は対象外で、通常のオートサイト6,000円になる',
      '対象は「大人1名・車1台」のみと公式に明記',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['http://fruitsvillage.com/custom11.html'],
  }),

  base({
    id: 'laqlaq-garden',
    slug: 'laqlaq-garden',
    name: '楽々ガーデン',
    prefecture: '千葉',
    area: '千葉市若葉区',
    address: '千葉県千葉市若葉区中野町2050',
    priceMin: 3000,
    priceMax: 4000,
    priceNote:
      'サイト単位課金。**オートキャンプ 平日3,000円／休日・休前日4,000円。大人1名・車1台を含む**ので、ソロ1名は平日3,000円',
    features: {
      carIn: true,
      carInNote: 'オートキャンプ。1区画140㎡以上',
      reservation: '要',
      reservationNote: 'なっぷから予約',
    },
    season: '要確認（公式に営業期間の記載なし）',
    soloComment:
      '千葉市若葉区のオートキャンプ場。1区画140㎡以上と広く、フリーサイトも予約数を絞って間隔を確保している。平日3,000円に大人1名・車1台が含まれる。中野ICから車で約3分。',
    officialUrl: 'https://laqlaqgarden.com/',
    reservationUrl: 'https://www.nap-camp.com/chiba/15124',
    tel: null,
    cautions: [
      '**公式サイトは2026年の夏から秋にかけて変更予定**と告知されている。料金・予約方法が変わる可能性がある',
      '予約はなっぷ経由。公式に電話番号の記載が無い',
      '**座標が未取得。**地図にピンを出していない',
    ],
    source: ['https://laqlaqgarden.com/'],
  }),
];

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);

if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない。整形が想定と違う');
  process.exit(1);
}

// ── ガード ──────────────────────────────────────────────────────────────────
const muni = (a) => {
  const s = String(a || '').replace(/^.{2,3}[都道府県]/, '');
  const m = s.match(/^(.+?郡)?(.+?[市町村])/);
  if (!m) return null;
  const ku = s.slice(m[0].length).match(/^(.+?区)/);
  return m[2] + (ku ? ku[1] : '');
};
const bySlug = new Map(list.map((c) => [c.slug, c]));
const errors = [];

for (const r of ADD) {
  for (const k of ['id', 'slug', 'name', 'prefecture', 'area', 'scores']) {
    if (r[k] === undefined || r[k] === null || r[k] === '') errors.push(`${r.slug}: 必須フィールド "${k}" が無い`);
  }
  for (const [k, v] of Object.entries(r.scores || {})) {
    if (!Number.isInteger(v) || v < 1 || v > 5) errors.push(`${r.slug}: scores.${k} が1〜5の整数でない（${v}）`);
  }
  if (r.scoresVerified !== false) errors.push(`${r.slug}: scoresVerified を false 以外にしない`);
  if (r.needsCoord !== true || r.lat !== 0 || r.lng !== 0) {
    errors.push(`${r.slug}: 座標を入れていないので needsCoord:true / lat:0 / lng:0 でなければならない`);
  }
  if (r.priceVerified === true && !String(r.priceNote || '').trim()) {
    errors.push(`${r.slug}: priceVerified が true なのに priceNote が空`);
  }
  // `lib/types.ts` の priceMax は**必須**。詳細ページが `camp.priceMax.toLocaleString()` を
  // 無条件で呼ぶので、欠けると**そのページだけ build が落ちる**（実際に落とした）。
  // 上限が公開されていない施設は priceMin と同値を置く決まりなので、ここで欠落を止める。
  if (typeof r.priceMin !== 'number' || typeof r.priceMax !== 'number') {
    errors.push(`${r.slug}: priceMin/priceMax は必須の数値（priceMin=${r.priceMin} priceMax=${r.priceMax}）`);
  } else if (r.priceMax < r.priceMin) {
    errors.push(`${r.slug}: priceMax が priceMin を下回っている（${r.priceMin} > ${r.priceMax}）`);
  }
  if (bySlug.has(r.slug)) errors.push(`${r.slug}: 同じ slug が既にある（${bySlug.get(r.slug).name}）。二重登録しない`);
  const m = muni(r.address);
  const dup = list.find((c) => c.name === r.name && muni(c.address) === m);
  if (dup) errors.push(`${r.slug}: 施設名「${r.name}」＋市町村「${m}」が既存の ${dup.slug} と一致。二重登録の疑い`);
}
const slugs = ADD.map((r) => r.slug);
if (new Set(slugs).size !== slugs.length) errors.push('追加リスト内で slug が重複している');

if (errors.length) {
  console.error(`中止: ガードに ${errors.length} 件ひっかかった。1バイトも書いていない\n  ` + errors.join('\n  '));
  process.exit(1);
}

for (const r of ADD) {
  console.log(`${WRITE ? '書込' : 'dry '} ${r.slug.padEnd(22)} ${r.name} / ${r.prefecture} ${muni(r.address)}`);
  console.log(`      priceMin=${r.priceMin} priceVerified=${r.priceVerified} needsCoord=${r.needsCoord} scoresVerified=${r.scoresVerified}`);
  console.log(`      根拠: ${r.officialUrl}`);
}

if (WRITE) {
  fs.writeFileSync(DATA, serialize([...list, ...ADD]));
  console.log(`\n書き込んだ: ${ADD.length}件を追加（${list.length} → ${list.length + ADD.length}）`);
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
