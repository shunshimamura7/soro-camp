/**
 * lastVerified が一括投入時のプレースホルダ日付のままのものを洗い出す。
 *
 * "2025-01-01" は batch 投入時に一律で入れた値で、実際に情報を確認した日ではない。
 * 削除済みの重複データ（朝霧高原 英知の杜、大野山キャンプ場）がいずれもこの日付
 * だったことから、実在性・内容とも未確認とみなす。
 *
 * データは読むだけで変更しない。
 * 使い方: node scripts/unverified-list.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH   = path.join(__dirname, '../data/campgrounds.json');
const REPORT_PATH = path.join(__dirname, 'unverified-list.md');

const PLACEHOLDER = '2025-01-01';

const isEmpty = v => v == null || String(v).trim() === '';
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

const placeholder = camps.filter(c => c.lastVerified === PLACEHOLDER);
const empty = camps.filter(c => isEmpty(c.lastVerified));

const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const mark = v => (isEmpty(v) ? 'なし' : 'あり');

function table(list) {
  let s = '| slug | name | prefecture | area | tel | officialUrl |\n';
  s += '| --- | --- | --- | --- | --- | --- |\n';
  for (const c of list) {
    s += `| \`${c.slug}\` | ${esc(c.name)} | ${c.prefecture} | ${esc(c.area)} | ${mark(c.tel)} | ${mark(c.officialUrl)} |\n`;
  }
  return s;
}

const bothMissing = placeholder.filter(c => isEmpty(c.tel) && isEmpty(c.officialUrl));

let md = '';
md += '# 情報未確認のデータ\n\n';
md += `\`lastVerified\` が **${PLACEHOLDER}** のものは、batch 投入時に一律で入れたプレースホルダで、\n`;
md += '実際に情報を確認した日ではない。二重登録として削除した2件\n';
md += '（朝霧高原 英知の杜キャンプ場、大野山キャンプ場）がいずれもこの日付だったため、\n';
md += '**実在性・内容とも未確認**として扱う。\n\n';
md += `- 全 ${camps.length}件中、プレースホルダ日付: **${placeholder.length}件**\n`;
md += `- うち tel と officialUrl がどちらもないもの: **${bothMissing.length}件**（裏取りの手がかりなし）\n`;
md += `- \`lastVerified\` が空: ${empty.length}件\n\n`;
md += '※ 判定のみ。data/campgrounds.json は変更していない。\n\n';

md += `## プレースホルダ日付（${PLACEHOLDER}）の ${placeholder.length}件\n\n`;
md += placeholder.length ? table(placeholder) : '該当なし。\n';

if (empty.length) {
  md += `\n## lastVerified が空の ${empty.length}件\n\n`;
  md += '野営地など、そもそも確認日を持たないもの。\n\n';
  md += table(empty);
}

fs.writeFileSync(REPORT_PATH, md);

console.log(`全${camps.length}件`);
console.log(`  lastVerified = ${PLACEHOLDER}（プレースホルダ）: ${placeholder.length}件`);
console.log(`    うち tel・officialUrl 両方なし: ${bothMissing.length}件`);
console.log(`  lastVerified が空: ${empty.length}件`);
console.log(`  実際に確認済みの日付: ${camps.length - placeholder.length - empty.length}件`);
console.log(`出力: ${path.relative(process.cwd(), REPORT_PATH)}`);
