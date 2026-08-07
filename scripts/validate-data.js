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

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// batch 一括投入時のプレースホルダ。実際の確認日ではないので未確認として数える
const PLACEHOLDER_DATE = '2025-01-01';

// soloComment に順位・ランクの主張を書かない方針の検出用。
// 帰属が明示されているもの（ギネス記録、自治体の公称、「〜と言われる」等）は許容する。
const SUPERLATIVE = /日本一|全国一|国内一|世界一|最高峰|最強|随一|No\.?1|ナンバーワン|全国第?\d+位|日本随一|屈指/;
const ATTRIBUTED  = /と言われ|と言われる|と称され|と呼ばれ|公称|ギネス|認定|指定/;

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
  if (c.priceVerified !== true && c.priceNote != null && String(c.priceNote).trim() !== '') {
    warnings.push(`${id}: priceNote があるのに priceVerified が立っていない（付け忘れの疑い）`);
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
}

// ── 結果 ────────────────────────────────────────────────────────────────────
console.log(`validate-data: ${camps.length}件を検査`);
console.log(`  座標未設定（lat/lng = 0）: ${unsetCoords}件`);
console.log(`  lastVerified が ${PLACEHOLDER_DATE}（一括投入時のプレースホルダ＝未確認）: ${placeholderVerified}件`);
console.log(`  lastVerified が空: ${emptyVerified}件`);
if (placeholderVerified || emptyVerified) {
  console.log(`  → 未確認 計${placeholderVerified + emptyVerified}件。詳細は node scripts/unverified-list.js`);
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
