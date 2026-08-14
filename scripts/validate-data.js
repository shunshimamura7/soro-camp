/**
 * データの整合性検査。エラーが1件でもあれば exit 1 でビルドを止める。
 *
 * package.json の prebuild に登録してあるので、npm run build / deploy の前に必ず走る。
 * 使い方: node scripts/validate-data.js
 */
const fs = require('fs');
const path = require('path');

const { PREFECTURE_BOUNDS, isOutOfBounds, describeBounds } = require(path.join(__dirname, 'prefecture-bounds.js'));
// 期間限定制限の日付ロジックは public/restrictions.js が唯一の実装。
// 閲覧時に実際に走るコードと同じ関数で検査するため、ここから直接読み込む。
const { isValidMD } = require(path.join(__dirname, '../public/restrictions.js'));

const DATA_PATH = path.join(__dirname, '../data/campgrounds.json');
const REQUIRED = ['id', 'slug', 'name', 'prefecture', 'area', 'scores'];
const SCORE_KEYS = ['quietness', 'scenery', 'value', 'access', 'facility'];
const PREFECTURES = Object.keys(PREFECTURE_BOUNDS);

/**
 * lib/camp.ts の calcSoloScore と同じ式（静けさ・絶景を2倍）。
 * 料金が未確認の施設はコスパを中立値3として扱うところまで揃える。
 */
function calcSoloScore(camp) {
  const s = camp.scores;
  const value = camp.priceVerified === true ? s.value : 3;
  return Math.round(((s.quietness * 2 + s.scenery * 2 + value + s.access + s.facility) / 7) * 10) / 10;
}

/**
 * value（コスパ）を価格帯で揃えるための帯。2026-08-13 決定。
 *
 * 発端は本栖湖キャンプ場。2026年の料金改定でソロ1,500円→3,000円になったのに
 * value が 5 のまま残っていた（priceVerified は「確認した時点」の記録でしかなく、
 * 料金改定では無言で腐る。scripts/manus-batch1-2026-08.md ★）。
 * 同じ本栖湖・同じ3,000円の浩庵が value 4、ふもとっぱら3,000円も value 4 で、
 * 同条件・同価格が別のスコアになっていた。同じことが起きたら機械で気づけるようにする。
 *
 * ## 帯
 *   value 5 … priceMin 2,500円以下
 *   value 4 … priceMin 1,500〜4,000円
 *   value 3 … priceMin 2,500円以上
 *
 * **帯はわざと重ねてある。**2,500円は 3/4/5 のどれでも通る。
 * コスパは価格だけで一意に決まるものではない（設備・立地・料金に含まれる範囲が効く）ので、
 * 拾いたいのは「明らかにズレている」ものだけ。境界の1件ずつを揺らすための基準ではない。
 *
 * ## 検査しないもの
 * - **priceVerified が true でないレコード。** 未検証の施設は表示側でコスパを中立値3として
 *   扱う運用（この上の calcSoloScore と lib/camp.ts の calcSoloScore）なので、
 *   JSON の value が何であれ画面に出ない。帯を当てても直す動機が無い。
 *   帯の value 3 に「または未検証」が入るのはこの運用のことで、
 *   その分岐はスコープの側（下の条件）で既に落ちている。
 * - **closed / suspended。** 掲載を続ける状態（active / unverified）だけを見る。
 *   priceNote の検査と同じ理由で、閉鎖済みの料金を今の相場と突き合わせても意味がない。
 * - **priceMin が 0（無料）。** wild の value は価格以外の性質で付いている。
 * - **value 1 と 2。帯を定義しない**（2026-08-14 の判断。「まだ決めていない」ではない）。
 *   **2 と 3 は価格で分離できない。**実データで両者の価格帯は重なっていて、
 *   同じ5,000円のレコードが 2 にも 3 にも居る。両者を分けているのは価格そのものではなく
 *   「その値段に見合うか」で、そこには設備・立地・料金に含まれる範囲が効く。
 *   機械が引ける線が無い以上、**割高感の判断はまだ人が持つ。**
 *   したがって「帯違反0件」は value 1・2 のレコードについて何も言っていない。
 *
 * ## 自動修正はしない
 * 帯から外れたとき、腐っているのが value なのか priceMin なのかは一次情報を見ないと
 * 決められない（本栖湖は priceMin が正しく value のほうが腐っていた）。
 * だからこれは**ズレの検出**に留める。直すのは人の仕事。
 */
const VALUE_BANDS = {
  5: { min: 0, max: 2500 },
  4: { min: 1500, max: 4000 },
  3: { min: 2500, max: Infinity },
};

/** 帯を警告文に出すための表示。上限・下限が無い側は書かない */
function describeBand(b) {
  if (b.max === Infinity) return `${b.min.toLocaleString()}円以上`;
  if (b.min === 0) return `${b.max.toLocaleString()}円以下`;
  return `${b.min.toLocaleString()}〜${b.max.toLocaleString()}円`;
}

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// batch 一括投入時のプレースホルダ。実際の確認日ではないので未確認として数える
const PLACEHOLDER_DATE = '2025-01-01';

// soloComment に順位・ランクの主張を書かない方針の検出用。
// 帰属が明示されているもの（ギネス記録、自治体の公称、「〜と言われる」等）は許容する。
const SUPERLATIVE = /日本一|全国一|国内一|世界一|最高峰|最強|随一|No\.?1|ナンバーワン|全国第?\d+位|日本随一|屈指/;
const ATTRIBUTED  = /と言われ|と言われる|と称され|と呼ばれ|公称|ギネス|認定|指定/;

/** null / undefined / 空白のみ を空とみなす */
const isEmpty = (v) => v == null || String(v).trim() === '';

/** 最上級表現を含み、かつ同じ文に帰属表現がない文を返す */
function unsourcedSuperlatives(text) {
  if (!text) return [];
  return String(text)
    .split(/(?<=。)/)
    .filter(sentence => SUPERLATIVE.test(sentence) && !ATTRIBUTED.test(sentence))
    .map(s => s.trim());
}

// ── 掲載状態と features の整合性 ──────────────────────────────────────────────
const STATUSES = ['active', 'closed', 'unverified', 'suspended'];
/**
 * status が closed のときの内訳。詳細ページの警告の文面がこれで変わる。
 *
 * closed は「かつて営業していたが今は無い」だけでなく、
 * **「そもそもキャンプ場として存在しなかった（誤登録）」も含む。**
 * 前者は abolished / closed_business、後者は prohibited が受け持つ。
 * どちらなのかは closedNote に必ず書くこと（一覧から消えるだけで詳細ページは残るため、
 * 訪問者が「潰れたのか」「元から無いのか」を読み取れる必要がある）。
 *
 * - prohibited      … その場所でのキャンプ・火気が禁じられている。施設の廃止とは限らず、
 *                     「キャンプ場として運営された記録が無い誤登録」もここに入る。
 *                     例: sanogawa-camp（南部町が河川公園でのキャンプ・火気を不可）、
 *                         yadoriki-camp（神奈川県が水源林で「たき火禁止」「キャンプ等禁止」）
 * - abolished       … 設置者が施設として廃止した。例: hinata-camp（伊勢原市が用途廃止）
 * - closed_business … 事業者が営業を終了した。例: hakonesono-auto（公式が営業終了を掲示）
 */
const CLOSED_REASONS = ['prohibited', 'abolished', 'closed_business'];

/**
 * closed のレコードの season を書き始めてよい語。
 *
 * season は「営業期間」として表に出るので、閉鎖済みなら一目でそう分かる語で始める。
 * 「閉業（旧: 通年）」のように旧期間を括弧に残す形が既存の書き方。
 * 営業実績そのものが無い誤登録（yadoriki-camp）は旧期間を書けないので
 * 「営業実績なし」、キャンプが禁じられた場所（sanogawa-camp）は「利用不可」を使う。
 */
const CLOSED_SEASON_WORDS = ['閉業', '廃止', '閉館', '閉鎖', '利用不可', '営業実績なし'];
const CLOSED_SEASON_PREFIX = new RegExp(`^(?:${CLOSED_SEASON_WORDS.join('|')})`);

/** eligibility.type が取りうる値 */
const ELIGIBILITY_TYPES = ['exclusive', 'discount', 'priority', 'membership'];

/** 閉鎖施設の soloComment に書いてはいけない、利用を促す語 */
const INVITING = /焚き火|直火|泊まれ|泊まる|野営できる|キャンプできる|設営/;

/** 「できない」側の文脈。これがあれば焚き火への言及は否定文として扱う */
const DENIAL = /禁止|不可|できない|できません|厳禁|NG|不許可|お断り|ご遠慮|控え|不可能/;
/** 可否を断定していない文脈。肯定とも否定とも取らない */
const NEUTRAL = /可否|要確認|不明|確認中|要問合せ/;

/**
 * 焚き火・直火に「肯定的に」言及している文だけを返す。
 * 「直火禁止」「焚き火の可否は要確認」のような文は肯定とみなさない。
 */
function positiveBonfireMentions(text) {
  if (!text) return [];
  return String(text)
    .split(/(?<=。)|、/)
    .filter((s) => /焚き火|直火/.test(s) && !DENIAL.test(s) && !NEUTRAL.test(s))
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 焚き火そのものを禁じている表現。
 * 「直火禁止」は焚き火台ならOKという意味で bonfire:true と両立するので含めない。
 */
const BONFIRE_BANNED = /焚き火[^。、]{0,6}(?:禁止|不可|できません|できない)|火気厳禁/;

/** restrictions.type が取りうる値 */
const RESTRICTION_TYPES = ['bonfire', 'camping', 'access'];

/**
 * restrictions の期間が古びていないか見張る日数。
 *
 * MM-DD は毎年同じ日付を指すが、根拠のほうは年ごとに動く。
 * 和田長浜の海水浴場開設期間（令和8年は 7/3〜8/31）が典型で、
 * 開設日は年により数日前後する。放っておくと誰も気づかないまま
 * ずれた期間で「制限中」を出し続けることになるので、
 * 確認から1年が過ぎたらビルドのたびに警告を出す。
 */
const RESTRICTION_STALE_DAYS = 365;

/** lastVerified から今日までの日数。日付として読めなければ null */
function daysSince(dateStr, today) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return Math.floor((today - t) / 86400000);
}

const TODAY_UTC = Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');

/** 利用可能であることを示す真偽値の features。閉鎖・未確認の施設に true で残っていたら不整合 */
const USABLE_FEATURES = [
  'bonfire', 'pet', 'shower', 'bath', 'carIn', 'soloPlan',
  'convenience', 'shop', 'wifi', 'firewood', 'ice', 'alcohol',
];

const errors = [];
const warnings = [];
let unsetCoords = 0;
let placeholderVerified = 0;
let emptyVerified = 0;
const superlativeHits = [];
const bandMismatches = [];

// ── slug の重複 ─────────────────────────────────────────────────────────────
const seen = new Map();
for (const c of camps) {
  if (!c.slug) continue;
  if (seen.has(c.slug)) errors.push(`slug 重複: "${c.slug}"（${seen.get(c.slug)} と ${c.name}）`);
  else seen.set(c.slug, c.name);
}

for (const c of camps) {
  const id = c.slug || c.id || c.name || '(識別子なし)';

  // ── 必須フィールド ──
  for (const key of REQUIRED) {
    const v = c[key];
    if (v == null || (typeof v === 'string' && v.trim() === '')) {
      errors.push(`${id}: 必須フィールド "${key}" が欠損`);
    }
  }

  // ── scores ──
  if (c.scores && typeof c.scores === 'object') {
    for (const k of SCORE_KEYS) {
      const v = c.scores[k];
      if (!Number.isInteger(v) || v < 1 || v > 5) {
        errors.push(`${id}: scores.${k} が1〜5の整数でない（${JSON.stringify(v)}）`);
      }
    }
  }

  // ── soloScore は派生値。JSON に残っていたら計算値と突き合わせる ──
  if ('soloScore' in c && c.scores) {
    const expected = calcSoloScore(c);
    if (Math.abs(c.soloScore - expected) > 0.05) {
      warnings.push(`${id}: soloScore ${c.soloScore} は計算値 ${expected} と一致しない（再計算した値を使用）`);
    } else {
      warnings.push(`${id}: soloScore は派生値。JSON から削除してよい`);
    }
  }

  // ── prefecture ──
  if (c.prefecture && !PREFECTURES.includes(c.prefecture)) {
    errors.push(`${id}: prefecture "${c.prefecture}" は ${PREFECTURES.join('/')} のいずれでもない`);
  }

  // ── soloComment の最上級表現（エラーにはしない） ──
  const sup = unsourcedSuperlatives(c.soloComment);
  if (sup.length) superlativeHits.push({ slug: c.slug || id, sentences: sup });

  // ── lastVerified の鮮度（エラーにはしない） ──
  if (c.lastVerified === PLACEHOLDER_DATE) placeholderVerified++;
  else if (c.lastVerified == null || String(c.lastVerified).trim() === '') emptyVerified++;

  // ── lat/lng ──
  const latOk = typeof c.lat === 'number' && Number.isFinite(c.lat);
  const lngOk = typeof c.lng === 'number' && Number.isFinite(c.lng);
  if (!latOk || !lngOk) {
    errors.push(`${id}: lat/lng が数値でない（lat=${JSON.stringify(c.lat)} lng=${JSON.stringify(c.lng)}）`);
  } else if (c.lat === 0 || c.lng === 0) {
    unsetCoords++;   // 未設定は別集計。エラーにしない
  } else if (isOutOfBounds(c.prefecture, c.lat, c.lng)) {
    errors.push(`${id}: 座標が${c.prefecture}の範囲外 lat ${c.lat} / lng ${c.lng}（想定 ${describeBounds(c.prefecture)}）`);
  }

  // ── status ──
  if (!STATUSES.includes(c.status)) {
    errors.push(`${id}: status が ${STATUSES.join('/')} のいずれでもない（${JSON.stringify(c.status)}）`);
  }

  // ── 座標未取得は needsCoord での明示を必須にする ──
  // 閉鎖施設は訪問させない前提なので座標を持つ意味がなく、対象外にする。
  // （閉鎖施設に needsCoord を付けると「今後座標を取得すべき対象」という誤ったシグナルになる）
  if (c.lat === 0 && c.lng === 0 && c.status !== 'closed' && !c.needsCoord) {
    errors.push(`${id}: 座標が 0,0 のまま。取得できていないなら needsCoord: true を付けること`);
  }

  const f = c.features || {};
  const cautionsText = Array.isArray(c.cautions) ? c.cautions.join(' ') : '';

  // ── 閉鎖施設の soloComment に利用を促す記述を残さない ──
  if (c.status === 'closed') {
    const hits = (String(c.soloComment || '').match(new RegExp(INVITING, 'g')) || []);
    if (hits.length) {
      errors.push(`${id}: status が closed なのに soloComment が利用を促している（該当語: ${[...new Set(hits)].join('・')}）`);
    }
  }

  // ── bonfire:false なのに焚き火を肯定的に書いていないか ──
  if (f.bonfire === false) {
    const hits = [...positiveBonfireMentions(c.soloComment), ...positiveBonfireMentions(cautionsText)];
    if (hits.length) {
      errors.push(`${id}: features.bonfire が false なのに焚き火・直火が肯定的に書かれている → ${hits.join(' / ')}`);
    }
  }

  // ── bonfire:true なのに焚き火禁止と書いていないか ──
  // 「直火禁止」は焚き火台ならOKという意味なので対象外。
  if (f.bonfire === true && BONFIRE_BANNED.test(String(c.soloComment || ''))) {
    errors.push(`${id}: features.bonfire が true なのに soloComment が焚き火を禁じている`);
  }

  // ── 閉鎖施設に「利用可能」を示す true が残っていないか ──
  // closed のみを対象にする。unverified は「設備が無い」ではなく「今も営業しているか
  // 分からない」という意味なので、features を false に倒すと別の誤情報になる。
  // （最後に確認できた設備情報は残し、注意喚起は詳細ページの警告バナーが担う）
  if (c.status === 'closed') {
    const left = USABLE_FEATURES.filter((k) => f[k] === true);
    if (left.length) {
      errors.push(`${id}: status が closed なのに features に利用可能を示す true が残っている（${left.join(', ')}）`);
    }
  }

  // ── priceVerified（料金の裏取り） ──
  // 内訳を書けないのに「確認した」とは言えない。実質的な判定基準は priceNote の有無。
  if (c.priceVerified === true && (c.priceNote == null || String(c.priceNote).trim() === '')) {
    errors.push(`${id}: priceVerified が true なのに priceNote が空。料金の内訳を書けないなら確認済みにしない`);
  }

  // ── priceVerified が true なのに出典が1つも無い ──
  //
  // priceVerified の定義は lib/types.ts を見ること。「一次情報で確認し、その出典が
  // officialUrl / tel / cautions のいずれかに記録されている」が条件。
  //
  // このフラグの126件は 2026-08-07 の 9fd15e3 が apply-price-verified.js で
  // **priceNote の有無だけを見て機械的に立てたもの**で、人が1件ずつ確認した結果ではない。
  // priceNote 自体が生成されていた場合（yadoriki-camp の「大人500円+サイト500円〜」）、
  // 生成された内訳が確認済みフラグの根拠になる循環が起きる。
  // 出典が1つも無いレコードは、その循環から抜け出せていない可能性が高い。
  //
  // 無料開放（type:wild / priceNote が無料開放）は出典が無くて当然なので対象外。
  const priceIsFree = c.type === 'wild' || /無料開放/.test(String(c.priceNote || ''));
  const hasPriceSource =
    !isEmpty(c.officialUrl) ||
    !isEmpty(c.tel) ||
    (Array.isArray(c.cautions) && c.cautions.some((x) => /https?:\/\//.test(String(x))));
  if (c.priceVerified === true && !priceIsFree && !hasPriceSource) {
    warnings.push(
      `${id}: priceVerified が true だが出典が1つも無い（officialUrl / tel / cautions のURL）。` +
        `このフラグは 9fd15e3 が priceNote の有無から機械的に付けたもので、人が確認した記録ではない。` +
        `一次情報に当たり直して出典を記録するか、priceVerified を false にして priceMin/priceMax を 0 に落とすこと`
    );
  }
  // 掲載を続ける状態（active / unverified）だけを対象にする。closed / suspended で料金が
  // 未検証なのは正常で、警告に従って priceVerified を立て直すと誤りになる（yadoriki-camp で実際に起きた）。
  // 新しい status を足したときは、警告を出すかどうかをここで明示的に決めること。
  const priceNoteChecked = c.status === 'active' || c.status === 'unverified';
  if (priceNoteChecked && c.priceVerified !== true && c.priceNote != null && String(c.priceNote).trim() !== '') {
    warnings.push(`${id}: priceNote があるのに priceVerified が立っていない（付け忘れの疑い）`);
  }

  // ── value（コスパ）が価格帯と噛み合っているか ──
  // 帯の定義と、何を検査しないかは上の VALUE_BANDS のコメント。
  // 自動修正はしない（どちらが腐っているかは機械には決められない）。
  //
  // **warnings には積まない。**warnings は表示が20件で打ち切られるので、
  // 混ぜると「1件ずつ出す」という趣旨が件数次第で欠ける（実際に欠けた）。
  // 独立したセクションで全件出す。
  if (priceNoteChecked && c.priceVerified === true && Number(c.priceMin) > 0 && c.scores) {
    const band = VALUE_BANDS[c.scores.value];
    const price = Number(c.priceMin);
    if (band && (price < band.min || price > band.max)) {
      bandMismatches.push({ slug: c.slug || id, value: c.scores.value, band, price });
    }
  }

  // ── needsPrice（探したが料金が公開されていなかった） ──
  // 根拠のない数字を残したままにすると、priceVerified を立て直した瞬間にその数字が表に出る。
  // 「調べたが出なかった」という結論と、値を持っている状態は両立しない。
  if (c.needsPrice === true) {
    if (Number(c.priceMin) !== 0 || Number(c.priceMax) !== 0) {
      errors.push(
        `${id}: needsPrice が立っているのに priceMin/priceMax に数字が入っている（${c.priceMin}/${c.priceMax}）。料金が取れなかったなら 0 に落とす`
      );
    }
    if (c.priceVerified === true) {
      errors.push(`${id}: needsPrice と priceVerified が同時に立っている。どちらか一方しか成り立たない`);
    }
  }

  // ── restrictions（期間限定の制限） ──
  if ('restrictions' in c && c.restrictions != null) {
    if (!Array.isArray(c.restrictions)) {
      errors.push(`${id}: restrictions は配列でなければならない`);
    } else if (c.restrictions.length === 0) {
      errors.push(`${id}: restrictions が空配列。制限がないならフィールドごと削除する`);
    } else {
      c.restrictions.forEach((r, i) => {
        const at = `${id}: restrictions[${i}]`;
        if (!r || typeof r !== 'object') {
          errors.push(`${at} がオブジェクトでない`);
          return;
        }
        if (!RESTRICTION_TYPES.includes(r.type)) {
          errors.push(`${at}.type が ${RESTRICTION_TYPES.join('/')} のいずれでもない（${JSON.stringify(r.type)}）`);
        }
        for (const key of ['from', 'to']) {
          if (!isValidMD(r[key])) {
            errors.push(`${at}.${key} が MM-DD 形式の実在する日付でない（${JSON.stringify(r[key])}）`);
          }
        }
        for (const key of ['reason', 'source']) {
          if (typeof r[key] !== 'string' || r[key].trim() === '') {
            errors.push(`${at}.${key} が空。制限は根拠と理由を必ず持つこと`);
          }
        }
        // 出典URLのない制限は、あとから裏を取り直せない
        if (typeof r.source === 'string' && !/https?:\/\//.test(r.source)) {
          warnings.push(`${at}.source に URL がない（${r.source}）`);
        }
        // 焚き火が元から不可なら「期間限定で制限される」は成り立たない
        if (r.type === 'bonfire' && f.bonfire === false) {
          errors.push(`${at}: type が bonfire だが features.bonfire が false。通年不可なら期間制限にしない`);
        }
      });

      // 制限の期間そのものが古びていないか。エラーではなく警告にする
      // （期間が動いたと決まったわけではなく、確認しに行くべきという合図）
      const age = daysSince(c.lastVerified, TODAY_UTC);
      if (age === null) {
        warnings.push(
          `${id}: restrictions を持つが lastVerified が未設定（${JSON.stringify(c.lastVerified)}）。` +
            `期間が年により変動する可能性。出典を再確認`,
        );
      } else if (age >= RESTRICTION_STALE_DAYS) {
        warnings.push(
          `${id}: restrictions を持つが lastVerified が ${c.lastVerified}（${age}日前）。` +
            `期間が年により変動する可能性。出典を再確認`,
        );
      }
    }
  }

  // ── eligibility（利用できる人の制限） ──
  if ('eligibility' in c && c.eligibility != null) {
    const e = c.eligibility;
    if (typeof e !== 'object' || Array.isArray(e)) {
      errors.push(`${id}: eligibility はオブジェクトでなければならない`);
    } else {
      for (const key of ['label', 'source']) {
        if (typeof e[key] !== 'string' || e[key].trim() === '') {
          errors.push(`${id}: eligibility.${key} が空`);
        }
      }
      if (!ELIGIBILITY_TYPES.includes(e.type)) {
        errors.push(`${id}: eligibility.type が ${ELIGIBILITY_TYPES.join('/')} のいずれでもない（${JSON.stringify(e.type)}）`);
      }
      if (typeof e.source === 'string' && !/https?:\/\//.test(e.source)) {
        warnings.push(`${id}: eligibility.source に URL がない（${e.source}）`);
      }
    }
  }

  // ── suspended（再開予定のある休業） ──
  // 「今は行けないが将来復活する」という主張なので、根拠を必ず持たせる。
  if (c.status === 'suspended') {
    if (c.suspendedNote == null || String(c.suspendedNote).trim() === '') {
      errors.push(`${id}: status が suspended なのに suspendedNote が空。休業理由と再開見込みを出典付きで書くこと`);
    } else if (!/https?:\/\//.test(String(c.suspendedNote))) {
      warnings.push(`${id}: suspendedNote に URL がない（${c.suspendedNote}）`);
    }
  }
  if (c.status !== 'suspended' && c.suspendedNote != null) {
    warnings.push(`${id}: status が suspended でないのに suspendedNote が残っている`);
  }

  // ── needsVerify（実在・同定の裏取りが要る） ──
  // フラグだけでは「まだ調べていない」のか「調べたが確認できなかった」のか分からず、
  // 次に見た人が同じ調査を最初からやり直す。何を探して何が無かったかを必ず残させる。
  if (c.needsVerify === true) {
    if (c.needsVerifyNote == null || String(c.needsVerifyNote).trim() === '') {
      errors.push(
        `${id}: needsVerify が true なのに needsVerifyNote が空。何を探して何が無かったかを出典付きで書くこと`
      );
    } else if (!/https?:\/\//.test(String(c.needsVerifyNote))) {
      warnings.push(`${id}: needsVerifyNote に URL がない（${c.needsVerifyNote}）`);
    }
  }
  if (c.needsVerify !== true && c.needsVerifyNote != null) {
    warnings.push(`${id}: needsVerify が立っていないのに needsVerifyNote が残っている`);
  }

  // ── closed の内訳 ──
  // 詳細ページの赤い警告の文面が closedReason で変わる。未設定だと
  // 「キャンプが禁止されています」側にフォールバックするので、
  // 廃止・閉業の施設に誤った警告が出る。だから警告ではなくエラーにする。
  if (c.status === 'closed') {
    if (!CLOSED_REASONS.includes(c.closedReason)) {
      errors.push(
        `${id}: status が closed なのに closedReason が ${c.closedReason == null ? '無い' : `不正（${c.closedReason}）`}。${CLOSED_REASONS.join(' / ')} のどれかを付けること`
      );
    }
    if (c.closedNote == null || String(c.closedNote).trim() === '') {
      warnings.push(`${id}: closedNote が空。いつ・誰が・何をしたかを出典付きで1文書くこと`);
    } else if (c.closedReason !== 'prohibited' && !/https?:\/\//.test(String(c.closedNote))) {
      // prohibited は現地の掲示・管理者への確認が根拠になることがあり、URL を必須にしない
      warnings.push(`${id}: closedNote に URL がない（${c.closedNote}）`);
    }

    // ── closed の season が現在形のまま残っていないか ──
    // season は詳細ページのヘッダ・「営業期間」行・meta description の3箇所に出る。
    // 閉鎖済みなのに「4月〜11月」と書いてあると、赤い警告のすぐ下に営業期間が並ぶ。
    // yadoriki-camp で実際に表示まで通ったので機械で止める。
    if (!CLOSED_SEASON_PREFIX.test(String(c.season || '').trim())) {
      warnings.push(
        `${id}: status が closed なのに season が「${c.season}」。閉鎖済みと分かる書き方にすること（${CLOSED_SEASON_WORDS.join(' / ')} のいずれかで始める。例「閉業（旧: 通年）」）`
      );
    }
  }
  if (c.status !== 'closed' && (c.closedReason != null || c.closedNote != null)) {
    warnings.push(`${id}: status が closed でないのに closedReason/closedNote が残っている`);
  }
}

// ── coordsVerified の裏付け ─────────────────────────────────────────────────
//
// **`coordsVerified` は「人が地図上で目視確認した」と定義しているが、
// cc751ab 以前に立った分は `apply-mark-verified-2026-08.js` の推定で付いている。**
// 判定基準は「batch6/batch7 由来でなく、座標が 0 でない」＝確認済みと見なす、というもので、
// 人が1件ずつ見た記録ではない（§17-3 の `priceVerified` と同型。§18-11）。
//
// ## 警告を段階に分ける理由
//
// 該当は83件ある。**全部を警告にすると `npm run validate` が毎回83行出て、
// 警告そのものが読まれなくなる。**位置が誤っているのが確定している4件だけを強い警告にし、
// 残りは件数のサマリに留める。
//
//   ① verdict が OK でない       … 目視したはずなのに機械検証を通っていない → **1件ずつ警告**
//   ② 小数3桁以下                … 粒度が100m〜1km。位置が特定できていない → 件数のみ
//   ③ 住所と2km以上離れている     … 機械検証は通るが遠い → 件数のみ（**距離だけでは判定できない。§6-15**）
//   ④ それ以外                   … 位置は妥当。フラグの意味付けだけの問題 → **出さない**
//
// ## slug をハードコードしない
//
// 「どの83件か」を焼き込むと、座標を直しても一覧から消えない。
// `coord-worklist.js` でまさにそれをやらかしている（5本のハードコードのうち4本が腐っていた。§18-3）。
// **判定は `coord-report.json` と小数桁と距離という現在値だけから出す。**
// git 履歴は使わない（`prebuild` で毎回走るので遅すぎる）。

const decimals = (n) => {
  const s = String(n);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};

const cvTiers = { strong: [], coarse: [], far: [], unmeasured: [], ok: 0 };
let cvNote = null;

try {
  const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'coord-report.json'), 'utf-8'));
  const verdictOf = new Map(report.map((r) => [r.slug, r.verdict]));

  // 住所と座標の距離は `verify-address-gsi.js` の出力にしかない。無ければ ③ は測らない。
  // **黙って飛ばさない。**測っていないことを出力に書く。
  // パーサは `coordsverified-triage.js` と共通（md の書式変更で片方だけ壊れるのを防ぐ。§18-3）
  const { readDistances } = require('./lib/address-check-md');
  const distRead = readDistances();
  const distOf = distRead.distances.size ? distRead.distances : null;

  for (const c of camps) {
    if (c.coordsVerified !== true) continue;
    const v = verdictOf.get(c.slug);
    if (v === undefined) continue; // レポートに無い。coord-worklist.js 側で拾う
    if (v !== 'OK') {
      cvTiers.strong.push({ slug: c.slug, status: c.status, verdict: v, km: distOf?.get(c.slug) ?? null });
    } else if (Math.min(decimals(c.lat), decimals(c.lng)) <= 3) {
      cvTiers.coarse.push(c.slug);
    } else if (!distOf || !distOf.has(c.slug)) {
      // **「距離が測れていない」を「距離0」と同一視しない。**
      // 旧実装は `?? 0` で ④「位置は妥当」に落としていた（md に行が無い＝検証後に
      // 入ったレコードが、無検査のまま「妥当」という**肯定の主張**にカウントされていた。
      // 2026-08-13 のレビューで発覚）
      cvTiers.unmeasured.push(c.slug);
    } else if (distOf.get(c.slug) >= 2) {
      cvTiers.far.push(c.slug);
    } else {
      cvTiers.ok++;
    }
  }
  if (distRead.note) cvNote = distRead.note;
} catch {
  cvNote = '`coord-report.json` が読めないので coordsVerified の裏付けを検査していない。`node scripts/verify-coords-gsi.js` を回すこと';
}

for (const t of cvTiers.strong) {
  warnings.push(
    `${t.slug}: coordsVerified が true だが機械検証を通っていない（${t.verdict}${t.km != null ? ` / 住所と ${t.km}km` : ''}）。` +
      'このフラグは cc751ab 以前は apply-mark-verified-2026-08.js が「batch6/batch7 由来でなければ確認済み」と' +
      '推定して付けたもので、人の目視の記録ではない。**実ピンを引き直すこと**（§18-11）'
  );
}

// ── 結果 ────────────────────────────────────────────────────────────────────
console.log(`validate-data: ${camps.length}件を検査`);
console.log(`  座標未設定（lat/lng = 0）: ${unsetCoords}件`);
console.log(`  lastVerified が ${PLACEHOLDER_DATE}（一括投入時のプレースホルダ＝未確認）: ${placeholderVerified}件`);
console.log(`  lastVerified が空: ${emptyVerified}件`);
if (placeholderVerified || emptyVerified) {
  console.log(`  → 未確認 計${placeholderVerified + emptyVerified}件。詳細は node scripts/unverified-list.js`);
}

// coordsVerified の裏付けは件数だけ出す。①は上の警告に1件ずつ出ている
{
  const { strong, coarse, far, unmeasured, ok } = cvTiers;
  const weak = coarse.length + far.length;
  if (strong.length || weak || unmeasured.length || cvNote) {
    console.log(`\n  coordsVerified の裏付け（cc751ab 以前の分は apply-mark-verified-2026-08.js の推定。§18-11）`);
    console.log(`    ① 機械検証を通っていない        ${String(strong.length).padStart(3)}件  ← 上の警告に出ている。**位置が誤っているのが確定**`);
    console.log(`    ② 小数3桁以下（粒度100m〜1km）  ${String(coarse.length).padStart(3)}件${coarse.length ? `  例: ${coarse.slice(0, 3).join(', ')}` : ''}`);
    console.log(`    ③ 住所と2km以上離れている        ${String(far.length).padStart(3)}件${far.length ? `  例: ${far.slice(0, 3).join(', ')}` : ''}`);
    console.log(`    ④ 位置は妥当（警告しない）      ${String(ok).padStart(3)}件`);
    if (unmeasured.length) {
      console.log(`    ⑤ 距離が未計測                  ${String(unmeasured.length).padStart(3)}件  例: ${unmeasured.slice(0, 3).join(', ')}`);
      console.log('      ← 検証後に入った・座標が動いたレコード。node scripts/verify-address-gsi.js を回し直すこと');
    }
    if (cvNote) console.log(`    ⚠ ${cvNote}`);
    if (weak) {
      console.log(`    → ②③は距離だけでは判定できない（§6-15）。仕分けは node scripts/coordsverified-triage.js`);
      console.log('      一覧は node scripts/coord-worklist.js');
    }
  }
}

if (superlativeHits.length) {
  console.log(`
警告: soloComment に出典不明の最上級表現 ${superlativeHits.length}件`);
  console.log('  （順位・ランクの主張は使わない方針。帰属が明示できる場合は「〜と言われる」等を添えること）');
  superlativeHits.forEach(h => {
    console.log(`  ! ${h.slug}`);
    h.sentences.forEach(t => console.log(`      ${t}`));
  });
}

// 帯のズレは独立セクションで**全件**出す（下の warnings の20件上限に混ぜない）
if (bandMismatches.length) {
  console.log(`\n警告: 価格とvalueの帯が合わない ${bandMismatches.length}件`);
  console.log('  （帯の定義と対象外の条件は validate-data.js の VALUE_BANDS のコメント。自動修正はしない）');
  bandMismatches.forEach((m) => {
    console.log(
      `  ! ${m.slug}: value ${m.value} の帯は ${describeBand(m.band)} だが priceMin ${m.price.toLocaleString()}円`
    );
  });
  console.log('  → 料金改定で value が取り残されていないか、priceMin の裏が古くないかを一次情報で確かめること');
}

if (warnings.length) {
  console.log(`\n警告 ${warnings.length}件:`);
  warnings.slice(0, 20).forEach(w => console.log(`  ! ${w}`));
  if (warnings.length > 20) console.log(`  … 他 ${warnings.length - 20}件`);
}

if (errors.length) {
  console.error(`\nエラー ${errors.length}件:`);
  errors.forEach(e => console.error(`  x ${e}`));
  console.error('\nビルドを中止します。');
  process.exit(1);
}

console.log('\n検証OK');
