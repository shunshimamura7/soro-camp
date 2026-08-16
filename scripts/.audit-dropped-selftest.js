/**
 * 9-2（落選分の列挙）の自己診断。**答えが分かっている入力を通す。**
 * これが PASS しないうちは、実データでの「0件」を信じない（§18-3）。
 */
const { _internal: I } = require('./district-sweep.js');

const district = I.parseDistrict('都留市鹿留');

const collected = [
  { source: { id: 'l1', layer: 'L1', label: 'L1テスト' }, items: [
    { name: 'アルファキャンプ場', address: '山梨県都留市鹿留1', url: 'u1' },
  ] },
  { source: { id: 'nap', layer: 'L2', label: 'なっぷテスト（住所なし）' }, items: [
    { name: 'ブラボーキャンプ場', address: null, url: null },   // 単独 → b1
    { name: 'アルファキャンプ場', address: null, url: null },   // 合流 → b3
  ] },
  { source: { id: 'jal', layer: 'L2', label: 'じゃらんテスト' }, items: [
    { name: 'チャーリーキャンプ場', address: '山梨県都留市戸沢2', url: 'u3' },  // 市同じ大字違い → b2-b
    { name: 'デルタキャンプ場', address: '山梨県富士吉田市3', url: 'u4' },      // 市違い → b2-a
  ] },
];

const merged = I.mergeItems(collected, district);
const { results } = I.classify(merged, [], district);
const d = I.analyzeDropped(merged, results, district);
const bySrc = I.droppedBySource(merged, collected);

let fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log(`${ok ? '  OK  ' : '  FAIL'} ${label}: got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
};

console.log('=== 通常（inDistrict が効いている） ===');
eq('b1 の件数', d.b1.length, 1);
eq('b1 の名前', d.b1.map(b => b.name), ['ブラボーキャンプ場']);
eq('b2 の件数', d.b2.length, 2);
eq('b2-a（市が違う）', d.b2.filter(b => !b.dropSameCity).map(b => b.name), ['デルタキャンプ場']);
eq('b2-b（市は同じ）', d.b2.filter(b => b.dropSameCity).map(b => b.name), ['チャーリーキャンプ場']);
eq('b3 の件数', d.b3.length, 1);
eq('b3 の合流先', d.b3.map(x => x.bucket.name), ['アルファキャンプ場']);
eq('b3 の合流元ソース', d.b3[0] ? [...new Set(d.b3[0].hits.map(h => h.sourceId))] : [], ['nap']);
eq('地区内バケット', d.survived.map(b => b.name), ['アルファキャンプ場']);

console.log('\n=== ソース別の突合 ===');
for (const r of bySrc) {
  console.log(`  ${r.id.padEnd(4)} 取得${r.items} 名前空${r.normDropped} 地区内${r.inDist} b1=${r.b1} b2=${r.b2} 突合=${r.reconciles ? 'OK' : 'NG'}`);
}
eq('全ソースで突合 OK', bySrc.every(r => r.reconciles), true);
eq('なっぷの内訳（地区内1 / b1 1）', [bySrc.find(r => r.id === 'nap').inDist, bySrc.find(r => r.id === 'nap').b1], [1, 1]);

console.log('\n=== 偽ゼロ検証（b1/b2 が「常に0を返すだけ」でないこと） ===');
// 住所を全部消した入力を通すと、全件が b1 に落ちるはず
const noAddr = collected.map(c => ({ source: c.source, items: c.items.map(i => ({ ...i, address: null })) }));
const m2 = I.mergeItems(noAddr, district);
const r2 = I.classify(m2, [], district);
const d2 = I.analyzeDropped(m2, r2.results, district);
eq('住所を全消しすると b1 が全件', d2.b1.length, m2.length);
eq('そのとき b2 は 0', d2.b2.length, 0);
eq('そのとき地区内は 0', d2.survived.length, 0);

// 逆に、全部を地区内の住所にすると b1/b2 は 0 になるはず
const allIn = collected.map(c => ({ source: c.source, items: c.items.map(i => ({ ...i, address: '山梨県都留市鹿留9' })) }));
const m3 = I.mergeItems(allIn, district);
const r3 = I.classify(m3, [], district);
const d3 = I.analyzeDropped(m3, r3.results, district);
eq('全件を地区内住所にすると b1=0', d3.b1.length, 0);
eq('全件を地区内住所にすると b2=0', d3.b2.length, 0);
eq('そのとき地区内は非ゼロ', d3.survived.length > 0, true);

console.log(`\n${fail ? `❌ FAIL ${fail}件` : '✅ 全部 PASS'}`);
process.exit(fail ? 1 : 0);
