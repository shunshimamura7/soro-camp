/**
 * 既定表示から隠れていたキャンプ場に、一次情報の URL を入れる（2026-10-06・フェーズ1）。
 *
 * ## なぜ必要か
 *
 * `hasEvidence()` は非 wild のレコードを `officialUrl` / `reservationUrl` /
 * `source[]` / `cautions` のURLだけで判定する。active 159件のうち22件は
 * **この4つがすべて空**で、営業していて座標もあるのに既定表示から外れていた。
 * 施設が無いのではなく、**こちらが出典を記録していなかった**だけ。
 *
 * ## 一次情報の優先順位（このバッチで使った順）
 *
 *   1. 自治体公式（市区町村・村役場のドメイン）
 *   2. 施設公式（運営者自身のサイト。Copyright や運営表記で確認したもの）
 *   3. 公式予約先（自治体が「予約はこちら」として指しているページ）
 *
 * **観光協会・DMO・予約サイト単独・口コミサイトは使っていない。**
 * 山北町観光協会（yamakita.net）と川根本町観光協会（okuooi.gr.jp）しか
 * 見つからなかった2件は、この基準で落として未発見にしてある。
 *
 * ただし**運営者が観光協会である場合は別**で、それは「施設公式」にあたる。
 * `motosu-shore-camp` の motosuko-camp.com は本栖湖観光協会が**運営者として**
 * 出しているキャンプ場自身のサイトなので採った。
 *
 * ## 料金には触れない
 *
 * `validate-data.js` が書いている通り、既存の `priceVerified: true` 126件は
 * 9fd15e3 が **priceNote の有無だけを見て機械的に立てた**もので、人の確認記録ではない。
 * 一方で今回の取得は1ページ1回の読み取りで、`motosu-shore-camp` の料金ページでは
 * 実際に桁が壊れて返ってきた（テント1張が「10,000〜」と読めた）。
 * **弱い根拠で検証済みの値を上書きすると、どちらが正しいか誰にも分からなくなる。**
 * 食い違いは報告だけにして、`priceMin` / `priceNote` / `priceVerified` は1件も触らない。
 *
 * ## 安全装置
 *
 * - **`--write --force` の二重ガード。**既定は dry run で1バイトも書かない
 * - **照合ガード。**slug・施設名（完全一致）・住所の市区町村（部分一致）の3つを照合し、
 *   1件でも外れたら**その場で中止**して何も書かない
 * - **上書き禁止ガード。**`officialUrl` に既に値が入っていたら中止。
 *   別のセッションが先に入れていたら黙って潰さない
 *   （`kisarazu-camp-organic` だけは既存値の**移し替え**なので明示的に許可する）
 * - **整形ガード。**無変更の往復（parse → stringify）が原本と一致しなければ中止
 * - **書くフィールドは officialUrl / reservationUrl / lastVerified / status だけ**
 *
 *   node scripts/apply-officialurl-2026-10-06.js                  # dry run（既定）
 *   node scripts/apply-officialurl-2026-10-06.js --write --force  # 実際に書く
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'campgrounds.json');
const WRITE = process.argv.includes('--write') && process.argv.includes('--force');
const ASKED_WRITE = process.argv.includes('--write');

const TODAY = '2026-10-06';

/**
 * 入れる値。
 *
 *   slug / 期待する施設名（完全一致）/ 期待する市区町村（address に含まれること）
 *   / officialUrl / 出典の種別 / 一致箇所の引用
 */
const SET = [
  {
    slug: 'sagamiko-kyuyomura',
    name: '相模湖休養村キャンプ場',
    muni: '相模原市緑区',
    officialUrl: 'https://midori.city.sagamihara.kanagawa.jp/2023/02/15/kyuyou-camp/',
    tier: '自治体公式',
    quote: '「相模湖休養村キャンプ場」「相模原市緑区寸沢嵐すわらし3574」。サイト運営は相模原市緑区役所地域振興課（© ミドナビ 2026）',
  },
  {
    slug: 'ryuyo-marine',
    name: '竜洋海洋公園オートキャンプ場',
    muni: '磐田市',
    officialUrl: 'https://www.city.iwata.shizuoka.jp/shisetsu_guide/koen_shisetsu/kouen/1005910.html',
    tier: '自治体公式',
    quote: '磐田市公式ウェブサイトの施設ガイド。「竜洋海洋公園オートキャンプ場」「〒438-0233　磐田市駒場6866-10」「年中無休」',
  },
  {
    slug: 'shojiko-camping',
    name: '精進湖キャンピングコテージ',
    muni: '富士河口湖町',
    officialUrl: 'https://shojiko.jp/',
    tier: '施設公式',
    quote: '「精進湖キャンピングコテージ」「〒401-0336 山梨県南都留郡富士河口湖町精進495」「0555-87-2005」。営業期間「2026年度　3月13日(金)〜」',
  },
  {
    slug: 'tsubakiso-auto',
    name: '椿荘オートキャンプ場',
    muni: '道志村',
    officialUrl: 'https://doushi-tsubakiso.com/',
    tier: '施設公式',
    quote: '「椿荘 オートキャンプ場」「〒402-0205 山梨県南都留郡道志村4150」「0554-52-2056」「通年営業」',
  },
  {
    slug: 'kiyosato-oka',
    name: '清里丘の公園キャンプ場',
    muni: '北杜市高根町',
    officialUrl: 'https://kiyosato-okanokouen.net/',
    tier: '施設公式',
    quote: '「〒407-0301　山梨県北杜市高根町清里3545-5」「tel 0551-48-2300（キャンプ場）」',
  },
  {
    slug: 'doshi-keikoku',
    name: '道志渓谷キャンプ場',
    muni: '道志村',
    officialUrl: 'https://doushi-keikoku.jp/',
    tier: '施設公式',
    quote: '「道志渓谷キャンプ場」「〒402-0201 山梨県南都留郡道志村43」「042-787-0088」。道志村役場の観光情報サイトも同じ名称・住所・電話で掲載',
  },
  {
    slug: 'motosu-shore-camp',
    name: '本栖湖キャンプ場',
    muni: '富士河口湖町',
    officialUrl: 'https://www.motosuko-camp.com/',
    tier: '施設公式',
    quote: '「本栖湖キャンプ場」「〒409-3714」（＝富士河口湖町本栖）「Tel 0555-87-2306」。本栖湖観光協会が運営者として出しているキャンプ場自身のサイト',
  },
  {
    slug: 'doshigawa-kanko-noen',
    name: '道志川観光農園オートキャンプ場',
    muni: '道志村',
    officialUrl: 'https://www.doshi-kanko.jp/camp/kanko-nouen/',
    tier: '自治体公式',
    quote: '道志村役場観光情報サイト（© 2024 DOSHI VILLAGE）。「観光農園オートキャンプ場」「山梨県南都留郡道志村9240」「0554-52-2365」。休業期間「11月中旬〜3月末」',
  },
  {
    slug: 'tsukiyono-doshi-camp',
    name: '月夜野キャンプ場',
    muni: '道志村',
    officialUrl: 'https://www.doshi-kanko.jp/camp/tsukiyono/',
    tier: '自治体公式',
    quote: '道志村役場観光情報サイト。「月夜野キャンプ場」「山梨県南都留郡道志村950」「0554-52-2461」',
  },
  {
    slug: 'naminokomura',
    name: 'なみのこ村',
    muni: '小田原市',
    officialUrl: 'https://www.naminokomura.jp/',
    tier: '施設公式',
    quote: '「オートキャンプ＆バーベキュー　なみのこ村」「Copyright (C) 2008 naminokomura」。料金表が既存 priceNote と円単位で一致（オート1泊1台4,800円＋入村料 大人800円＝5,600円）',
  },
  {
    slug: 'kamioshima-camp',
    name: '上大島キャンプ場',
    muni: '相模原市緑区',
    officialUrl: 'https://www.city.sagamihara.kanagawa.jp/kurashi/shisetsu/kouen_kankou/recreation/1003112.html',
    tier: '自治体公式',
    quote: '相模原市公式の施設案内。「上大島キャンプ場」「〒252-0135　緑区大島3657付近」「042-760-6066」。開設期間「3月1日から12月20日（冬季閉鎖）」',
  },
  {
    slug: 'hayato-hakone',
    name: 'HAYATO 箱根キャンプ場',
    muni: '箱根町',
    officialUrl: 'https://hayatohakoneguesthouse.com/page/hakone-camp/',
    tier: '施設公式',
    quote: '「HAYATO 箱根キャンプ場」「神奈川県足柄下郡箱根町湯本茶屋70」「0460-83-8351」「通年営業」',
  },
  {
    slug: 'nagomino-sato-tsuru',
    name: '都留戸沢の森 和みの里キャンプ場',
    muni: '都留市',
    officialUrl: 'https://www.nagomi-camp.com',
    tier: '施設公式',
    quote: '「和みの里キャンプ場」「〒402-0022 山梨県都留市戸沢１１２６」「Tel：0554-46-0753」。旧サイト（sites.google.com/fuyo-kensetsu.co.jp）から移転告知あり',
  },
];

/**
 * `kisarazu-camp-organic` だけは別扱い。
 *
 * 既に `officialUrl` に きさらづDMO のURLが入っているが、**DMO は一次情報にならない。**
 * 木更津市公式が「予約を受け付けています」と今季営業を出し、そのページが
 * 予約先として DMO のURLを指しているので、
 *
 *   officialUrl    → 木更津市公式（自治体公式）
 *   reservationUrl → きさらづDMO（市が指定した公式予約先）
 *
 * に**移し替える**。URLを捨てるのではなく、役割どおりの欄に移す。
 * あわせて status を unverified → active に上げる。
 */
const KISARAZU = {
  slug: 'kisarazu-camp-organic',
  name: 'きさらづCAMP ORGANIC FIELD in みたて',
  muni: '木更津市',
  officialUrl: 'https://www.city.kisarazu.lg.jp/soshiki/keizai/kankoshinko/1/2377.html',
  expectCurrentOfficialUrl: 'https://kisarazu-dmo.jp/experience/kisarazu-camp-in-mitate/',
  tier: '自治体公式＋公式予約先',
  quote: '木更津市公式「きさらづCAMP in MITATE 予約受付中！」「予約を受け付けています」。予約先として kisarazu-dmo.jp を掲示。※市公式は旧称表記（cautions に記録済み）',
};

const raw = fs.readFileSync(DATA, 'utf8');
const list = JSON.parse(raw);

/**
 * 改行コードは**原本のものをそのまま保存する。**
 *
 * この環境の作業ツリーは git の autocrlf で CRLF でチェックアウトされている。
 * 既存の apply-*.js は LF 決め打ちで往復を比べていたので、いま走らせると
 * 全部この整形ガードで止まる（中身は何も壊れていないのに）。
 * **LF で書き戻すと、データ以外の 1,700 行余りが差分として出てくる。**
 * 判定も書き戻しも原本の改行に合わせる。
 */
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const serialize = (l) => (JSON.stringify(l, null, 2) + '\n').replace(/\n/g, EOL);

// ── 整形ガード ──────────────────────────────────────────────────────────────
if (serialize(list) !== raw) {
  console.error('中止: 無変更の往復が原本と一致しない。整形が想定と違う');
  process.exit(1);
}

const bySlug = new Map(list.map((c) => [c.slug, c]));
const isEmpty = (v) => v == null || String(v).trim() === '';
const errors = [];

// ── 照合ガード ──────────────────────────────────────────────────────────────
for (const e of SET) {
  const c = bySlug.get(e.slug);
  if (!c) { errors.push(`${e.slug}: レコードが無い`); continue; }
  if (c.name !== e.name) {
    errors.push(`${e.slug}: 施設名が違う（データ「${c.name}」/ 期待「${e.name}」）`);
  }
  if (!String(c.address || '').includes(e.muni)) {
    errors.push(`${e.slug}: 住所に「${e.muni}」が無い（データ「${c.address}」）`);
  }
  if (!isEmpty(c.officialUrl)) {
    errors.push(`${e.slug}: 既に officialUrl="${c.officialUrl}" が入っている。上書きしない`);
  }
  if (c.status !== 'active') {
    errors.push(`${e.slug}: status が active ではない（${c.status}）。このバッチは隠れている active だけが対象`);
  }
  if (c.type === 'wild') {
    errors.push(`${e.slug}: type が wild。野営地はフェーズ2の対象で、ここでは触らない`);
  }
}

{
  const c = bySlug.get(KISARAZU.slug);
  if (!c) {
    errors.push(`${KISARAZU.slug}: レコードが無い`);
  } else {
    if (c.name !== KISARAZU.name) {
      errors.push(`${KISARAZU.slug}: 施設名が違う（データ「${c.name}」/ 期待「${KISARAZU.name}」）`);
    }
    if (!String(c.address || '').includes(KISARAZU.muni)) {
      errors.push(`${KISARAZU.slug}: 住所に「${KISARAZU.muni}」が無い（データ「${c.address}」）`);
    }
    if (c.officialUrl !== KISARAZU.expectCurrentOfficialUrl) {
      errors.push(
        `${KISARAZU.slug}: 現在の officialUrl が想定と違う（データ「${c.officialUrl}」/ 期待「${KISARAZU.expectCurrentOfficialUrl}」）。` +
          '移し替えの前提が崩れているので触らない'
      );
    }
    if (!isEmpty(c.reservationUrl)) {
      errors.push(`${KISARAZU.slug}: 既に reservationUrl="${c.reservationUrl}" が入っている。上書きしない`);
    }
    if (c.status !== 'unverified') {
      errors.push(`${KISARAZU.slug}: status が unverified ではない（${c.status}）。active に上げる前提が崩れている`);
    }
  }
}

if (errors.length) {
  console.error(`中止: 照合ガードに ${errors.length} 件ひっかかった。1バイトも書いていない\n  ` + errors.join('\n  '));
  process.exit(1);
}

// ── 適用 ────────────────────────────────────────────────────────────────────
for (const e of SET) {
  const c = bySlug.get(e.slug);
  console.log(`${WRITE ? '書込' : 'dry '} ${e.slug.padEnd(28)} [${e.tier}]`);
  console.log(`      officialUrl   = ${e.officialUrl}`);
  console.log(`      lastVerified  = ${c.lastVerified} → ${TODAY}`);
  console.log(`      一致箇所: ${e.quote}`);
  if (WRITE) {
    c.officialUrl = e.officialUrl;
    c.lastVerified = TODAY;
  }
}

{
  const c = bySlug.get(KISARAZU.slug);
  console.log(`${WRITE ? '書込' : 'dry '} ${KISARAZU.slug.padEnd(28)} [${KISARAZU.tier}]`);
  console.log(`      officialUrl    = ${KISARAZU.expectCurrentOfficialUrl}`);
  console.log(`                     → ${KISARAZU.officialUrl}`);
  console.log(`      reservationUrl = （空） → ${KISARAZU.expectCurrentOfficialUrl}`);
  console.log(`      status         = ${c.status} → active`);
  console.log(`      lastVerified   = ${c.lastVerified} → ${TODAY}`);
  console.log(`      一致箇所: ${KISARAZU.quote}`);
  if (WRITE) {
    c.reservationUrl = KISARAZU.expectCurrentOfficialUrl;
    c.officialUrl = KISARAZU.officialUrl;
    c.status = 'active';
    c.lastVerified = TODAY;
  }
}

if (WRITE) {
  fs.writeFileSync(DATA, serialize(list));
  console.log(`\n書き込んだ: ${SET.length + 1}件（officialUrl ${SET.length + 1} / reservationUrl 1 / status 1 / lastVerified ${SET.length + 1}）`);
  console.log('料金（priceMin / priceNote / priceVerified）は1件も触っていない');
} else {
  console.log(`\ndry run。書くには --write --force${ASKED_WRITE ? '（--force が足りない）' : ''}`);
}
