/**
 * needsVerify: true の施設のうち、soloComment に断定的な描写が残っているものを検出する。
 *
 * 実在や正式名称が確認できていないのに景観や設備を断定して書くと、
 * 読者は裏付けのある記述と区別できない。ここでは検出だけ行い、
 * 書き換えは行わない（文面の判断は人がする）。
 *
 * データは読むだけで変更しない。
 * 使い方: node scripts/check-unverified-descriptions.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH   = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'unverified-descriptions.md');

// 「確認中である」ことを述べている文（＝断定ではない）。
// ※ で始まる文は編集上の断り書きなので、内容にかかわらず対象外とする
// （「※家山は島田市川根町であり川根本町ではない。」のように、
//   なぜ確認中なのかを説明する文が句点で分かれるため）。
const DISCLAIMER = /^※|確認中|確認できていません|裏付けが取れていません|未確認|要確認|ご確認ください|可能性があります/;
// 断定を避けている言い回し
const HEDGE = /とされ|という|かもしれ|possibly|見込め|ようだ|らしい/;

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const targets = camps.filter(c => c.needsVerify === true);

const rows = [];
for (const c of targets) {
  const sentences = String(c.soloComment || '')
    .split(/(?<=。)/)
    .map(s => s.trim())
    .filter(Boolean);

  const assertive = sentences.filter(s => !DISCLAIMER.test(s) && !HEDGE.test(s));
  const hedged    = sentences.filter(s => !DISCLAIMER.test(s) && HEDGE.test(s));

  rows.push({
    c,
    total: sentences.length,
    assertive,
    hedged,
    clean: assertive.length === 0,
  });
}

const dirty = rows.filter(r => !r.clean);

const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|');

let md = '# 未同定施設に残る断定的な描写\n\n';
md += '`needsVerify: true`（実在・正式名称が確認できていない）施設のうち、\n';
md += '`soloComment` に**裏付けのない断定的な描写**が残っているものの一覧。\n\n';
md += '判定は文単位。「確認中です」「ご確認ください」等の断り書きと、\n';
md += '「〜とされ」「〜という」のような断定を避けた言い回しは対象外とする。\n\n';
md += `- \`needsVerify: true\` の施設: **${targets.length}件**\n`;
md += `- うち断定的な描写が残るもの: **${dirty.length}件**\n`;
md += `- 断り書きのみで問題ないもの: ${rows.length - dirty.length}件\n\n`;
md += '**このレポートは検出のみ。data/campgrounds.json は変更していない。**\n';
md += '書き換えるかどうか、どう書き換えるかは個別に判断すること。\n\n';

if (dirty.length) {
  md += '## 対象\n\n';
  md += '| slug | name | 県・エリア | 断定的な文 |\n| --- | --- | --- | --- |\n';
  for (const r of dirty) {
    md += `| \`${r.c.slug}\` | ${esc(r.c.name)} | ${r.c.prefecture}・${esc(r.c.area)} | ${r.assertive.map(esc).join('<br>')} |\n`;
  }
  md += '\n## soloComment 全文\n\n';
  for (const r of dirty) {
    md += `### ${esc(r.c.name)}（\`${r.c.slug}\`）\n\n`;
    md += `${esc(r.c.soloComment)}\n\n`;
    md += `- 断定的な文 ${r.assertive.length} / 全 ${r.total} 文\n`;
    if (r.hedged.length) md += `- 断定を避けている文: ${r.hedged.map(esc).join(' / ')}\n`;
    md += '\n';
  }
}

md += '## 断り書きのみで問題ないもの\n\n';
const clean = rows.filter(r => r.clean);
if (clean.length) {
  md += '| slug | name | soloComment |\n| --- | --- | --- |\n';
  for (const r of clean) {
    md += `| \`${r.c.slug}\` | ${esc(r.c.name)} | ${esc(r.c.soloComment)} |\n`;
  }
} else {
  md += 'なし。\n';
}

fs.writeFileSync(REPORT_PATH, md);

console.log(`needsVerify: ${targets.length}件`);
console.log(`  断定的な描写が残る: ${dirty.length}件`);
console.log(`  断り書きのみ: ${rows.length - dirty.length}件`);
for (const r of dirty) {
  console.log(`\n  ■ ${r.c.slug}（${r.c.name}）`);
  r.assertive.forEach(s => console.log(`      ${s}`));
}
console.log(`\n出力: ${path.relative(process.cwd(), REPORT_PATH)}`);
