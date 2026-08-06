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

const { isOutOfBounds, describeBounds } = require(path.join(__dirname, 'prefecture-bounds.js'));
const { normalizeName, levenshtein, similarity } = require(path.join(__dirname, 'name-match.js'));

const DATA_PATH    = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH  = path.join(__dirname, 'audit-report.md');
const SUSPECT_PATH = path.join(__dirname, 'suspect-list.md');

// ── (a) 地名 → 想定される県 ──────────────────────────────────────────────────
const PLACE_RULES = [
  // 山梨（道志系は下の DOSHI ルールで別途扱う）
  ['山梨', /富士五湖|本栖|精進|西湖|河口湖|山中湖|清里|北杜|南アルプス|甲府|山梨市|富士川町|大柳川/],
  // 静岡
  ['静岡', /朝霧高原|富士宮|伊豆|沼津|川根|浜松|磐田|御前崎|静岡市/],
  // 神奈川
  ['神奈川', /丹沢|宮ヶ瀬|箱根|相模湖|秦野|厚木|愛川|三浦|相模原/],
];

// ── 道志の扱い ──────────────────────────────────────────────────────────────
// 道志川は神奈川側にも流れているが、以前は「エリアが道志川なら神奈川で確定」と
// 広く除外していたため「道志ふれあいの森キャンプ場（神奈川・道志川）」のような
// 要確認データが素通りしていた。
//
// 変更後は「道志」を含むものは原則すべて山梨候補として警告し、
// 神奈川側と確定できる地名が明示されている場合だけ警告を抑止する。
const DOSHI_ANY = /道志/;
// とくに山梨（道志村）を強く示す名前
const DOSHI_YAMANASHI_STRONG = /道志の森|道志村|道志渓谷/;
// 神奈川側と確定できる地名（相模原市緑区side）
const KANAGAWA_CONFIRMED = /青野原|青根|両国橋/;

// ── 監査 ────────────────────────────────────────────────────────────────────
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const targets = camps.filter(c => c.coordsVerified !== true);
const verified = camps.filter(c => c.coordsVerified === true);

const findings = [];   // { slug, name, prefecture, area, issues: [{text, severity}] }

for (const c of targets) {
  const issues = [];
  const haystack = `${c.name} ${c.area}`;

  // (a) 県とエリアの整合性
  for (const [expected, re] of PLACE_RULES) {
    const m = haystack.match(re);
    if (!m) continue;
    if (expected === c.prefecture) continue;
    issues.push({
      severity: '高',
      text: `県の不一致: 「${m[0]}」は${expected}を示すが prefecture は${c.prefecture}`,
    });
  }

  // (a-2) 道志系。神奈川側と確定できる地名がなければ山梨候補として警告する
  if (DOSHI_ANY.test(haystack) && c.prefecture !== '山梨') {
    if (!KANAGAWA_CONFIRMED.test(haystack)) {
      const strong = haystack.match(DOSHI_YAMANASHI_STRONG);
      issues.push({
        severity: '高',
        text: strong
          ? `県の不一致: 「${strong[0]}」は山梨（道志村）を示すが prefecture は${c.prefecture}`
          : `県の不一致の疑い: 「道志」を含むが神奈川側と確定できる地名（青野原・青根・両国橋）がない。prefecture は${c.prefecture}。道志村（山梨）の施設でないか要確認`,
      });
    }
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
  if (hasCoords && isOutOfBounds(c.prefecture, c.lat, c.lng)) {
    issues.push({
      severity: '高',
      text: `座標が${c.prefecture}の想定範囲外: lat ${c.lat} / lng ${c.lng}（想定 ${describeBounds(c.prefecture)}）`,
    });
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

// ── 実在性が疑わしい候補の抽出 → suspect-list.md ────────────────────────────
// tel と officialUrl が両方空のもの（野営地は連絡先がないのが正常なので除外）から、
// さらに次のいずれかに当てはまるものを列挙する。判定のみで削除はしない。
const VAGUE_WORDS = /要確認|要現地確認|未確認|不明|要問合せ|要問い合わせ|閉鎖|営業状況/;

const noContact = targets.filter(c => {
  if (c.type === 'wild') return false;                       // 野営地9件は対象外
  const noTel = !c.tel || String(c.tel).trim() === '';
  const noUrl = !c.officialUrl || String(c.officialUrl).trim() === '';
  return noTel && noUrl;
});

const suspects = [];
for (const c of noContact) {
  const reasons = [];

  // 1) soloComment に「要確認」等
  const vague = (c.soloComment || '').match(VAGUE_WORDS);
  if (vague) reasons.push(`soloComment に「${vague[0]}」`);

  // 2) 既存の確認済みデータと1文字違い（＝有名施設の綴り違い・別名の疑い）
  const nName = normalizeName(c.name);
  const oneOff = verified
    .filter(v => {
      const nv = normalizeName(v.name);
      return nv.length >= 3 && nName.length >= 3 && levenshtein(nName, nv) === 1;
    })
    .map(v => `${v.name}（${v.slug}）`);
  if (oneOff.length) reasons.push(`確認済みデータと1文字違い: ${oneOff.join('、')}`);

  // 3) 価格が両方 0 または未設定
  const pMin = c.priceMin, pMax = c.priceMax;
  const priceMissing =
    pMin == null || pMax == null || (Number(pMin) === 0 && Number(pMax) === 0);
  if (priceMissing) reasons.push(`価格が未設定または0（priceMin=${pMin} / priceMax=${pMax}）`);

  if (reasons.length) suspects.push({ c, reasons });
}

let sm = '';
sm += '# 実在性が疑わしい候補\n\n';
sm += `電話番号と公式サイトがどちらも空の **${noContact.length}件**（野営地 \`type: "wild"\` は連絡先がないのが正常なため除外）から、\n`;
sm += 'さらに次のいずれかに該当するものを抽出した。\n\n';
sm += '1. `soloComment` に「要確認」等の文言がある\n';
sm += '2. 施設名が確認済みデータと1文字違い（綴り違い・別名の疑い）\n';
sm += '3. `priceMin` / `priceMax` が両方 0 または未設定\n\n';
sm += `**該当: ${suspects.length}件**\n\n`;
sm += '※ 判定のみ。data/campgrounds.json は変更していない。削除・修正は個別に裏取りしてから。\n\n';
const hitVague = noContact.filter(c => VAGUE_WORDS.test(c.soloComment || '')).length;
const hitPrice = noContact.filter(c => {
  const p1 = c.priceMin, p2 = c.priceMax;
  return p1 == null || p2 == null || (Number(p1) === 0 && Number(p2) === 0);
}).length;
const hitOneOff = noContact.filter(c => {
  const n = normalizeName(c.name);
  return n.length >= 3 && verified.some(v => {
    const nv = normalizeName(v.name);
    return nv.length >= 3 && levenshtein(n, nv) === 1;
  });
}).length;

sm += '## 基準ごとの該当数\n\n';
sm += '| 基準 | 該当数 |\n| --- | --- |\n';
sm += `| soloComment に「要確認」等 | ${hitVague} |\n`;
sm += `| 確認済みデータと1文字違い | ${hitOneOff} |\n`;
sm += `| 価格が両方0または未設定 | ${hitPrice} |\n\n`;

if (suspects.length) {
  sm += '## 該当一覧\n\n';
  sm += '| slug | name | prefecture | area | 疑わしい理由 |\n';
  sm += '| --- | --- | --- | --- | --- |\n';
  for (const { c, reasons } of suspects) {
    sm += `| \`${c.slug}\` | ${esc(c.name)} | ${c.prefecture} | ${esc(c.area)} | ${reasons.map(esc).join('<br>')} |\n`;
  }
} else {
  sm += '## 該当なし\n\n';
  sm += '3つの基準はいずれも空振りした。空振りの理由:\n\n';
  sm += '- 「要確認」等の文言は野営地9件の `soloComment` にしかなく、その9件は対象外\n';
  sm += `- 価格は ${noContact.length}件すべてに 0 以外の値が入っている（batch6/batch7 投入時に一律で設定されたため、値の有無は実在性の指標にならない）\n`;
  sm += '- 確認済みデータと1文字違いの名前はなかった\n\n';
  sm += 'つまり **この3基準では実在性を切り分けられない**。\n';
  sm += `連絡先が空の${noContact.length}件はいずれも batch6/batch7 で一括投入されたもので、\n`;
  sm += '欠損は個別の事情ではなく投入時に連絡先を取得しなかったことに起因する。\n';
  sm += '実在性を詰めるなら公式サイト・電話番号の裏取りが必要。\n';
}
fs.writeFileSync(SUSPECT_PATH, sm);

// ── コンソールは件数サマリのみ ──────────────────────────────────────────────
console.log(`対象 ${targets.length}件 / 検出 ${findings.length}件`);
console.log(`深刻度 高: ${high}件（県不一致 ${issueCount(/^県の不一致/)} / 名称類似 ${issueCount(/^名称(類似|が完全一致)/)} / 範囲外 ${issueCount(/^座標が/)}）`);
console.log(`深刻度 中: ${mid}件（tel・公式サイトが両方空）`);
console.log(`深刻度 低: ${low}件`);
console.log(`実在性が疑わしい候補: ${suspects.length}件（連絡先なし ${noContact.length}件中・野営地は除外）`);
console.log(`出力: ${path.relative(process.cwd(), REPORT_PATH)} / ${path.relative(process.cwd(), SUSPECT_PATH)}`);
