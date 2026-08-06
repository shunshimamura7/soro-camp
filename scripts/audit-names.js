/**
 * 未検証データ（coordsVerified !== true）の名称・県・実在性を監査する。
 *
 * campgrounds.json は読むだけで一切変更しない。
 * 結果は scripts/audit-report.md に Markdown の表で書き出す。
 *
 * 使い方: node scripts/audit-names.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH   = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'audit-report.md');

// ── (a) 地名 → 想定される県 ──────────────────────────────────────────────────
// 「道志」単体では引っかけない。道志川流域は神奈川側にも及ぶため、
// 山梨と断定できる「道志村」「道志の森」だけを対象にする。
const PLACE_RULES = [
  // 山梨
  ['山梨', /道志村|道志の森|富士五湖|本栖|精進|西湖|河口湖|山中湖|清里|北杜|南アルプス|甲府|山梨市|富士川町|大柳川/],
  // 静岡
  ['静岡', /朝霧高原|富士宮|伊豆|沼津|川根|浜松|磐田|御前崎|静岡市/],
  // 神奈川
  ['神奈川', /丹沢|宮ヶ瀬|箱根|相模湖|秦野|厚木|愛川|三浦|相模原/],
];

// 道志川流域でも神奈川で正しい地名。これらを含む場合は山梨判定を打ち消す。
const KANAGAWA_DOSHI = /青野原|青根|両国橋/;

// ── (d) 県ごとの座標 bounds ─────────────────────────────────────────────────
const BOUNDS = {
  '神奈川': { latMin: 35.1, latMax: 35.7, lngMin: 138.9, lngMax: 139.8 },
  '山梨':   { latMin: 35.2, latMax: 35.9, lngMin: 138.2, lngMax: 139.2 },
  '静岡':   { latMin: 34.6, latMax: 35.4, lngMin: 137.4, lngMax: 139.2 },
};

// ── 正規化 ──────────────────────────────────────────────────────────────────
/** カタカナ→ひらがな。表記ゆれ（ロッジ/ろっじ 等）を吸収する。 */
function kataToHira(s) {
  return s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function normalizeName(s) {
  if (!s) return '';
  let t = String(s).normalize('NFKC');
  t = t.replace(/\([^)]*\)/g, '');      // 括弧内（NFKC 後は半角）
  t = t.replace(/\[[^\]]*\]/g, '');
  t = t.replace(/【[^】]*】/g, '');
  t = t.replace(/オートキャンプ場/g, '');
  t = t.replace(/キャンプ場/g, '');
  t = t.replace(/オートキャンプ/g, '');
  t = t.replace(/キャンプ/g, '');
  t = t.replace(/場/g, '');
  t = t.replace(/[\s・･]/g, '');
  t = kataToHira(t);
  return t.toLowerCase();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * 近いとみなすか。近ければ { kind, distance } を返し、そうでなければ null。
 *
 * 日本語の短い名前では編集距離1が「全く別の施設」を意味することが多い
 * （井川 / 早川 / 黒川、大野山 / 大室山）。漢字1文字の情報量が大きいため、
 * 3文字以下は完全一致のみを疑い、長い名前ほど距離を許容する。
 */
function similarity(a, b) {
  if (!a || !b) return null;
  if (a.length < 2 || b.length < 2) return null;
  const d = levenshtein(a, b);
  if (d === 0) return { kind: '完全一致', distance: 0 };
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 3) return null;            // 短い名前は完全一致のみ
  if (maxLen <= 6) return d <= 1 ? { kind: '類似', distance: d } : null;
  return d <= 2 ? { kind: '類似', distance: d } : null;
}

// ── 監査 ────────────────────────────────────────────────────────────────────
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const targets = camps.filter(c => c.coordsVerified !== true);
const verified = camps.filter(c => c.coordsVerified === true);

const findings = [];   // { slug, name, prefecture, area, issues: [{text, severity}] }

for (const c of targets) {
  const issues = [];
  const haystack = `${c.name} ${c.area}`;

  // (a) 県とエリアの整合性
  const kanagawaException = KANAGAWA_DOSHI.test(haystack) && c.prefecture === '神奈川';
  for (const [expected, re] of PLACE_RULES) {
    const m = haystack.match(re);
    if (!m) continue;
    if (expected === c.prefecture) continue;
    if (expected === '山梨' && kanagawaException) continue;  // 青野原・青根・両国橋は神奈川で正しい
    issues.push({
      severity: '高',
      text: `県の不一致: 「${m[0]}」は${expected}を示すが prefecture は${c.prefecture}`,
    });
  }

  // (b) 名称の重複・類似
  const nName = normalizeName(c.name);
  const collect = (list, label) =>
    list
      .filter(o => o.slug !== c.slug)
      .map(o => ({ o, sim: similarity(nName, normalizeName(o.name)) }))
      .filter(x => x.sim)
      .map(x => `${x.o.name}（${x.o.slug}／${label}・${x.sim.kind}・編集距離${x.sim.distance}）`);
  const sims = [...collect(verified, '確認済み'), ...collect(targets, '未検証')];
  if (sims.length) {
    const exact = sims.some(s => s.includes('完全一致'));
    issues.push({
      severity: '高',
      text: `${exact ? '名称が完全一致（重複の可能性が高い）' : '名称類似（別名または重複の疑い）'}: ${sims.join('、')}`,
    });
  }

  // (d) 座標の bounds 外れ
  const hasCoords = c.lat !== 0 && c.lng !== 0;
  if (hasCoords) {
    const b = BOUNDS[c.prefecture];
    if (b && (c.lat < b.latMin || c.lat > b.latMax || c.lng < b.lngMin || c.lng > b.lngMax)) {
      issues.push({
        severity: '高',
        text: `座標が${c.prefecture}の想定範囲外: lat ${c.lat} / lng ${c.lng}`,
      });
    }
  }

  // (c) 情報欠損
  const noTel = !c.tel || String(c.tel).trim() === '';
  const noUrl = !c.officialUrl || String(c.officialUrl).trim() === '';
  if (noTel && noUrl) {
    issues.push({ severity: '中', text: '電話番号・公式サイトがどちらも空（実在性未確認）' });
  }

  // その他
  if (!hasCoords) {
    issues.push({ severity: '低', text: '座標未設定（lat/lng = 0）' });
  }
  if (!c.lastVerified || String(c.lastVerified).trim() === '') {
    issues.push({ severity: '低', text: '情報確認日（lastVerified）が空' });
  }

  if (issues.length) {
    findings.push({ slug: c.slug, name: c.name, prefecture: c.prefecture, area: c.area, issues });
  }
}

// ── 集計・ソート ────────────────────────────────────────────────────────────
const RANK = { '高': 0, '中': 1, '低': 2 };
function worst(f) {
  return f.issues.reduce((acc, i) => Math.min(acc, RANK[i.severity]), 9);
}
findings.sort((a, b) => {
  const d = worst(a) - worst(b);
  if (d !== 0) return d;
  return b.issues.length - a.issues.length;
});

const countBy = sev => findings.filter(f => f.issues.some(i => i.severity === sev)).length;
const high = countBy('高');
const mid  = findings.filter(f => worst(f) === RANK['中']).length;
const low  = findings.filter(f => worst(f) === RANK['低']).length;

const issueCount = re => findings.filter(f => f.issues.some(i => re.test(i.text))).length;

// ── レポート出力 ────────────────────────────────────────────────────────────
const esc = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

let md = '';
md += '# 未検証データ 名称・県・実在性 監査レポート\n\n';
md += `- 対象: \`coordsVerified !== true\` の **${targets.length}件**（照合相手の確認済みデータ ${verified.length}件）\n`;
md += `- 何か検出されたもの: **${findings.length}件**\n`;
md += `- 深刻度 高: **${high}件** / 中どまり: ${mid}件 / 低どまり: ${low}件\n\n`;
md += '深刻度の基準 — 高: 県の不一致・名称類似（重複疑い）・座標が県の範囲外 ／ 中: 電話番号と公式サイトが両方空 ／ 低: その他\n\n';
md += '内訳（高の要因別）\n\n';
md += `- 県の不一致: ${issueCount(/^県の不一致/)}件\n`;
md += `- 名称類似: ${issueCount(/^名称(類似|が完全一致)/)}件\n`;
md += `- 座標が範囲外: ${issueCount(/^座標が/)}件\n\n`;
md += '---\n\n';
md += '| 深刻度 | slug | name | prefecture | area | 検出された問題 |\n';
md += '| --- | --- | --- | --- | --- | --- |\n';
for (const f of findings) {
  const sev = ['高', '中', '低'][worst(f)];
  const problems = f.issues
    .slice()
    .sort((x, y) => RANK[x.severity] - RANK[y.severity])
    .map(i => `**[${i.severity}]** ${esc(i.text)}`)
    .join('<br>');
  md += `| ${sev} | \`${f.slug}\` | ${esc(f.name)} | ${f.prefecture} | ${esc(f.area)} | ${problems} |\n`;
}
md += '\n';
md += '※ このレポートは検出結果のみです。data/campgrounds.json は変更していません。\n';

fs.writeFileSync(REPORT_PATH, md);

// ── コンソールは件数サマリのみ ──────────────────────────────────────────────
console.log(`対象 ${targets.length}件 / 検出 ${findings.length}件`);
console.log(`深刻度 高: ${high}件（県不一致 ${issueCount(/^県の不一致/)} / 名称類似 ${issueCount(/^名称(類似|が完全一致)/)} / 範囲外 ${issueCount(/^座標が/)}）`);
console.log(`深刻度 中: ${mid}件（tel・公式サイトが両方空）`);
console.log(`深刻度 低: ${low}件`);
console.log(`出力: ${path.relative(process.cwd(), REPORT_PATH)}`);
