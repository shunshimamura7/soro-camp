/**
 * 「案C後にどこにも出てこない」MISSING が、
 * **いま実際にソースから取れているのか**を確かめる。
 *
 * 取れていないなら、案Cのせいではなく**ソース側が返さなくなった**（robots 403 ガード・
 * 一覧の入れ替わり）。取れているのに出ていないなら、**判定側の問題。**
 * この2つを混ぜると「案Cで検出力が落ちた」という誤った結論になる。
 */
const fs = require('fs');
const { _internal: I, sweepNormalizeName: N } = require('./district-sweep.js');

const TARGETS = [
  ['静岡市', '三保ハーバルキャンプ場'], ['山北町', '【閉鎖中】ウッディハウス玄倉'],
  ['都留市', '都留星と風キャンプフィールド'], ['都留市', 'THE FOREST'], ['都留市', 'ＦＩＳＨ・ＯＮ！鹿留'],
  ['山中湖村', 'みさきキャンプ場'], ['富士河口湖町', 'ハーブの里コテージ・オートキャンプ場'],
  ['富士河口湖町', 'キャンプあかいけ'], ['富士河口湖町', 'キャンピングリゾートＷＡＮ'],
  ['富士河口湖町', 'すばるランド CAMP FIELD'], ['富士河口湖町', 'tourist base kawaguchiko（ツーリストベース河口湖）'],
  ['富士河口湖町', 'ニューブリッジキャンプ場'], ['富士河口湖町', '創造の森オートキャンプ場'],
  ['富士河口湖町', '夢見る河口湖 コテージ戸沢センター'], ['富士宮市', 'ラ・フォンテーヌ・バカンス田貫橋'],
  ['富士宮市', '【閉鎖中】朝霧高原ふもとオートキャンプ場'], ['北杜市', 'AIRSTREAM RESORT®︎ HAKUSHU BASE'],
  ['富士河口湖町', '西湖キャンプビレッジ・ノーム'],
];

(async () => {
  const records = I.loadRecords();
  const cache = new Map();
  const collectFor = async muni => {
    if (cache.has(muni)) return cache.get(muni);
    const { sources } = I.sourcesFor(muni, records);
    const out = [];
    for (const s of sources) out.push(await I.collectSource(s, { useCache: true }));
    cache.set(muni, out);
    return out;
  };

  const tally = {};
  for (const [muni, name] of TARGETS) {
    const collected = await collectFor(muni);
    const want = N(name) || name;
    const hits = [];
    for (const c of collected) for (const it of c.items) {
      const n = N(it.name);
      if (n && (n === want || n.includes(want) || want.includes(n))) hits.push(`${c.source.id}「${it.name}」`);
    }
    // レコードとして存在するか（＝ MISSING でなくなって当然のもの）
    const rec = records.find(r => {
      const rn = N(r.name); if (!rn) return false;
      const p = r.address && I.splitAddress(r.address);
      return (p && p.city === muni) && (rn === want || rn.includes(want) || want.includes(rn));
    });
    const v = hits.length
      ? (rec ? `いまも取れている & データにもある（\`${rec.id}\`）→ IN_DATA 側` : 'いまも取れている（判定側を見る）')
      : 'ソースが返さなくなった（案Cとは無関係）';
    (tally[v] = tally[v] || []).push(`${muni} ${name}${hits.length ? '  ← ' + hits.slice(0, 2).join(', ') : ''}`);
  }

  // 状態が変わったソースを添える
  console.log('参考: いまのソース状態（0件・SKIPPED は「無い」ではなく「取れていない」）');
  for (const [muni, cs] of cache) {
    const bad = cs.filter(c => c.status !== 'OK' || c.items.length === 0);
    if (bad.length) console.log(`  [${muni}] ` + bad.map(c => `${c.source.id}=${c.status}/${c.items.length}件`).join('  '));
  }
  console.log('');
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${k}: ${v.length}件`);
    v.forEach(s => console.log('    ' + s));
    console.log('');
  }
})();
