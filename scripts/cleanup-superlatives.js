/**
 * soloComment から出典不明の順位・ランク主張を取り除く。
 *
 * 置き換えの材料は既存データ（価格・priceNote・地形や設備の記述）に限る。
 * 材料がない場合は表現を削るだけに留め、新しい情報は創作しない。
 * 帰属が示せるもの（ギネス記録・自治体の公称）は、帰属語を同じ文に入れて残す。
 *
 * 変更前後は scripts/superlative-cleanup.md に記録する。
 * 使い方: node scripts/cleanup-superlatives.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH  = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'superlative-cleanup.md');

// slug → [置換前の文, 置換後の文, 分類, 根拠]
const FIXES = [
  ['sessokyo-camp',
    '川根本町は澄んだ星空が全国2位。',
    '接岨峡は大井川上流の山あいにあり、空が暗く星がよく見える。',
    '順位削除', '順位を外し、観測できる範囲（空が暗い）の記述に置き換え'],

  ['shindo',
    '予約不要・先着順で道志川沿いを2,000円で楽しめるコスパ最強クラス。',
    '予約不要・先着順で、道志川沿いを2,000円から利用できる。',
    'コスパ最強クラス', '実際の価格帯（¥2,000〜）に置き換え'],

  ['doshi-no-mori',
    '予約不要・先着順、入場料800円+駐車1,000円でソロ1,800円というコスパ最強クラス。',
    '予約不要・先着順で、入場料800円+駐車1,000円のソロ計1,800円。',
    'コスパ最強クラス', '実額はすでに文中にあるため、ランク表現のみ削除'],

  ['doshi-keikoku',
    '直火OKかつ予約不要で1,700円〜という道志随一のコスパを誇るキャンプ場。',
    '直火OKかつ予約不要で1,700円〜（入場700円+駐車1,000円）。',
    '随一', 'priceNote の内訳を明示してランク表現を削除'],

  ['nishitanzawa-mountbridge',
    '西丹沢の深い渓谷美と秋の紅葉は神奈川随一。',
    '西丹沢の深い渓谷に囲まれ、秋は紅葉が見られる。',
    '随一', '同じ内容を比較なしの記述に'],

  ['yataro-camp',
    '場内の露天風呂に浸かりながら渓流の音を聴く体験は神奈川随一。',
    '場内の露天風呂に浸かりながら渓流の音を聴ける。',
    '随一', '同じ内容を比較なしの記述に'],

  ['kumomi-auto',
    '目の前に広がる相模灘と夕日は静岡随一の美しさ。',
    '目の前に相模灘が広がり、夕日が海に沈む。',
    '随一', '見えるものの記述に置き換え'],

  ['okooigawa-lake',
    '接岨湖に囲まれた超絶景は静岡でも随一の秘境感。',
    '接岨湖に囲まれた立地で、周囲に人家がない。',
    '随一', '車でのアクセス不可という既出の情報と整合する記述に'],

  ['mobility-park-izu',
    '静岡随一の高規格キャンプ場として人気が高く、近隣温泉への割引サービスも付いてくる。',
    '高規格キャンプ場として人気が高く、近隣温泉への割引サービスも付いてくる。',
    '随一', '「静岡随一の」を削るだけ。他は既存情報のまま'],

  ['nishi-amagi-kogen',
    '星空の暗さは伊豆随一で天の川が肉眼で見える環境。',
    '空が暗く、天の川が肉眼で見える。',
    '随一', '観測できる事実のみ残す'],

  ['makiba-kogen-camp',
    '夜の満天の星空は山梨随一の評判を誇る。',
    '夜は満天の星空が広がる。',
    '随一', '「評判」も出典がないため削除'],

  ['kofu-shinrinyoku-hiroba',
    '静けさは随一で街から近いのに人の気配がない。',
    '街から近いのに人の気配がなく静か。',
    '随一', '同じ内容を比較なしの記述に'],

  ['fukushigawa-seishonen',
    '静けさは南部町でも随一。',
    '',
    '随一', '置き換えの材料が既存データにないため文ごと削除'],

  ['sankoso-auto',
    '道志川の透明度は神奈川・山梨屈指で夏の川遊びが最高。',
    '道志川の水は澄んでいて、夏は川遊びができる。',
    '屈指', '同じ内容を比較なしの記述に'],

  ['ashinoko-camp-mura',
    '対岸に見える富士山と芦ノ湖の組み合わせは神奈川屈指の絶景。',
    '対岸に富士山が見え、芦ノ湖越しの眺めが開ける。',
    '屈指', '見えるものの記述に置き換え'],

  ['hamaoka-sakyuu-camp',
    '砂丘越しに沈む夕日は静岡屈指の絶景。',
    '砂丘越しに夕日が沈む。',
    '屈指', '見えるものの記述に置き換え'],

  ['minoishtaki',
    '静寂度は神奈川屈指。',
    '渡船でしか行けないぶん静かに過ごせる。',
    '屈指', '既出の「渡船10分」を根拠にした記述に'],

  // ── 帰属を同じ文に入れて残す ──
  ['horaibashi-camp',
    '世界一長い木造歩道橋・蓬莱橋（897m）のたもとの河川敷キャンプ場。',
    'ギネス記録に認定された世界一長い木造歩道橋・蓬莱橋（897m）のたもとの河川敷キャンプ場。',
    '帰属追加', 'ギネス記録という出典を明示'],

  ['akeno-fureai-camp',
    '「日本一の日照時間」を誇る明野の高台キャンプ場。',
    '日照時間が日本一と公称される明野の高台キャンプ場。',
    '帰属追加', '自治体の公称であることを明示'],
];

const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const applied = [];
const missed = [];

for (const [slug, before, after, kind, reason] of FIXES) {
  const c = camps.find(x => x.slug === slug);
  if (!c) { missed.push({ slug, reason: 'slug が見つからない' }); continue; }
  if (!c.soloComment.includes(before)) {
    missed.push({ slug, reason: '対象の文が見つからない' });
    continue;
  }
  const full0 = c.soloComment;
  c.soloComment = c.soloComment.replace(before, after).replace(/ {2,}/g, ' ').trim();
  applied.push({ slug, name: c.name, kind, reason, before, after, full0, full1: c.soloComment });
}

fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));

// ── 記録 ────────────────────────────────────────────────────────────────────
const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|');
let md = '# 最上級表現のクリーンアップ\n\n';
md += '`soloComment` から出典不明の順位・ランク主張を取り除いた記録。\n\n';
md += '**方針**\n\n';
md += '- 置き換えの材料は既存データ（価格・`priceNote`・地形や設備の記述）に限る\n';
md += '- 材料がない場合は表現を削るだけに留め、新しい情報は創作しない\n';
md += '- 帰属が示せるもの（ギネス記録・自治体の公称）は、帰属語を**同じ文に**入れて残す\n\n';
md += `対象 **${applied.length}件**`;
if (missed.length) md += `（適用できなかったもの ${missed.length}件）`;
md += '\n\n';

const byKind = {};
applied.forEach(a => { byKind[a.kind] = (byKind[a.kind] || 0) + 1; });
md += '| 分類 | 件数 |\n| --- | --- |\n';
Object.entries(byKind).forEach(([k, v]) => { md += `| ${k} | ${v} |\n`; });
md += '\n---\n\n';

md += '## 該当文の変更前後\n\n';
md += '| slug | 分類 | 変更前 | 変更後 | 置き換えの根拠 |\n';
md += '| --- | --- | --- | --- | --- |\n';
for (const a of applied) {
  md += `| \`${a.slug}\` | ${a.kind} | ${esc(a.before)} | ${a.after ? esc(a.after) : '**（文ごと削除）**'} | ${esc(a.reason)} |\n`;
}

md += '\n## soloComment 全文の変更前後\n\n';
for (const a of applied) {
  md += `### ${esc(a.name)}（\`${a.slug}\`）\n\n`;
  md += `- 変更前: ${esc(a.full0)}\n`;
  md += `- 変更後: ${esc(a.full1)}\n\n`;
}

if (missed.length) {
  md += '## 適用できなかったもの\n\n';
  missed.forEach(m => { md += `- \`${m.slug}\`: ${m.reason}\n`; });
}

fs.writeFileSync(NOTES_PATH, md);

console.log(`適用 ${applied.length}件 / 未適用 ${missed.length}件`);
Object.entries(byKind).forEach(([k, v]) => console.log(`  ${k}: ${v}件`));
missed.forEach(m => console.log(`  ! ${m.slug}: ${m.reason}`));
console.log(`出力: ${path.relative(process.cwd(), NOTES_PATH)}`);
