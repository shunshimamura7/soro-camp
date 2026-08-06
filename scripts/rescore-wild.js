/**
 * 10人の審査員（ペルソナ）による野営地スコアの再採点。
 *
 * ■ 材料は現在データにあるものだけ
 *   features（notes 含む） / cautions / priceMin・priceMax / season / reservation。
 *   name や soloComment からの推測は使わない（施設名から景観を想像するのは推測になるため）。
 *
 * ■ 根拠がない軸は据え置く
 *   各ペルソナは根拠がある軸だけ 1〜5 を返し、無ければ null を返す。
 *   採点できたペルソナが MIN_RATERS 人未満の軸は「根拠不足」として既存値を維持する。
 *
 * 出力: scripts/rescore-notes.md（分布・平均・採用値・変更理由）
 *       --apply を付けると data/campgrounds.json の scores を更新する。
 *
 * 使い方:
 *   node scripts/rescore-wild.js           採点してノートを書くだけ
 *   node scripts/rescore-wild.js --apply   スコアも更新する
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH  = path.join(__dirname, '../data/campgrounds.json');
const NOTES_PATH = path.join(__dirname, 'rescore-notes.md');

const AXES = ['quietness', 'scenery', 'value', 'access', 'facility'];
const AXIS_LABEL = { quietness: '静けさ', scenery: '絶景', value: 'コスパ', access: 'アクセス', facility: '設備' };
const MIN_RATERS = 5;   // これ未満なら根拠不足として据え置き

const APPLY = process.argv.includes('--apply');
const clamp = n => Math.max(1, Math.min(5, n));

// ── 証拠の抽出（features / cautions / 料金 / 営業情報のみ） ──────────────────
function evidence(c) {
  const f = c.features || {};
  const cautionText = (c.cautions || []).join(' ');
  const noteText = [f.bonfireNote, f.toiletNote, f.carInNote, f.reservationNote, f.firewoodNote, f.bathNote]
    .filter(Boolean).join(' ');
  const all = cautionText + ' ' + noteText;

  return {
    free: c.priceMin === 0 && c.priceMax === 0,
    toilet: f.toilet,
    toiletNone: f.toilet === 'なし',
    toiletUnknown: f.toilet === '不明',
    toiletSimple: f.toilet === '簡易',
    toiletProper: ['和式', '洋式', 'ウォシュレット', '温水便座'].includes(f.toilet),
    waterAbsent: /水道なし|水場なし|水場・水道なし|トイレ・水場なし|トイレ・水道なし/.test(all),
    waterPresent: /水場・|水場あり|炊事棟|トイレ・水場あり/.test(all),
    carIn: !!f.carIn,
    carHard: /四駆|乗り入れ不可|徒歩運搬/.test(all),
    flood: /増水|高波/.test(all),
    rockfall: /落石|倒木/.test(all),
    bear: /熊/.test(all),
    closure: /閉鎖|有料化|利用制限|規制強化|利用不可/.test(all),
    fireBanned: /直火.{0,4}禁止/.test(all),
    fireUnknown: /直火の可否/.test(all),
    reservationReq: f.reservation === '要',
    unverified: /要現地確認|要確認|未確認/.test(all),
    managedAbsent: /管理棟・受付なし|管理人不在/.test(all),
    limitedParty: /1日1団体/.test(all),
    eventRisk: /イベント/.test(all),
    firewood: !!f.firewood,
    shop: !!f.shop,
    bath: !!f.bath,
    seasonal: !!c.season && c.season !== '通年' && !/通年/.test(c.season),
    alcoholBan: /酒類.{0,6}禁止/.test(all),
    advanced: /上級者向け/.test(all),
  };
}

// ── 共通のベース値（データから機械的に決まる部分） ──────────────────────────
function baseFacility(e) {
  let s;
  if (e.toiletProper) s = 3;
  else if (e.toiletUnknown) s = 2.5;
  else if (e.toiletSimple) s = 2;
  else if (e.toiletNone) s = 1;
  else s = 2;
  if (e.waterPresent) s += 1;
  if (e.waterAbsent) s -= 0.5;
  if (e.firewood) s += 0.5;
  if (e.shop) s += 0.5;
  if (e.bath) s += 0.5;
  return clamp(s);
}
function baseAccess(e) {
  let s = 3;
  if (e.carIn && !e.carHard) s += 1;
  if (e.carHard) s -= 1;
  if (!e.carIn) s -= 1;
  return clamp(s);
}
function baseQuiet(e) {
  let s = 3;
  if (e.limitedParty) s += 2;
  if (e.managedAbsent) s += 0.5;
  if (e.reservationReq) s += 0.5;
  if (e.eventRisk) s -= 1;
  if (!e.carIn) s += 0.5;     // 車が入れない場所は人が少ない
  // 以下は「人里から離れている」ことの傍証。cautions に現れる範囲で拾う
  if (e.bear) s += 1;          // 熊が出る＝人の出入りが少ない山中
  if (e.advanced) s += 0.5;    // 上級者向けと明記＝一般客が寄りつかない
  if (e.rockfall) s += 0.5;    // 落石・倒木の警告＝管理された平地ではない
  if (e.toiletNone) s += 0.5;  // トイレすら無い＝整備されていない
  return clamp(s);
}

// ── 10人のペルソナ ──────────────────────────────────────────────────────────
// 各関数は { axis: 点数 } を返す。根拠がない軸はキーごと省略する。
const PERSONAS = [
  {
    name: '① 野営歴20年・最小限装備・無人優先',
    note: '設備の乏しさを減点しない。人の少なさを静けさとして高く見る。',
    rate: e => {
      const r = {};
      r.quietness = clamp(baseQuiet(e) + (e.managedAbsent ? 1 : 0) + (e.carHard ? 0.5 : 0));
      if (e.free) r.value = 5;
      r.access = baseAccess(e);
      r.facility = clamp(baseFacility(e) + 1);   // 設備が無くても困らない
      return r;
    },
  },
  {
    name: '② ソロ初心者・設備重視',
    note: 'トイレと水場の有無を厳しく見る。管理人不在を不安要素とみなす。',
    rate: e => {
      const r = {};
      r.quietness = clamp(baseQuiet(e) - (e.managedAbsent ? 0.5 : 0));
      if (e.free) r.value = 5;
      r.access = baseAccess(e);
      r.facility = clamp(baseFacility(e) - 1 - (e.toiletNone ? 0.5 : 0) - (e.managedAbsent ? 0.5 : 0));
      return r;
    },
  },
  {
    name: '③ バイクツーリング勢・駐車のしやすさ重視',
    note: '乗り入れ可否を強く見る。徒歩運搬は大きな減点。',
    rate: e => {
      const r = {};
      r.quietness = baseQuiet(e);
      if (e.free) r.value = 5;
      r.access = clamp(baseAccess(e) + (e.carIn && !e.carHard ? 0.5 : 0) - (e.carHard ? 1 : 0));
      r.facility = baseFacility(e);
      return r;
    },
  },
  {
    name: '④ 冬キャン勢・閉鎖期間と水回りを気にする',
    note: '通年営業でないもの、水場がないものを減点。',
    rate: e => {
      const r = {};
      r.quietness = clamp(baseQuiet(e) + 0.5);   // 冬は空いている
      if (e.free) r.value = 5;
      r.access = clamp(baseAccess(e) - (e.seasonal ? 1 : 0));
      r.facility = clamp(baseFacility(e) - (e.waterAbsent ? 1 : 0) - (e.seasonal ? 0.5 : 0));
      return r;
    },
  },
  {
    name: '⑤ 徒歩キャンパー・荷物運搬距離を重視',
    note: '車の乗り入れ可否より運搬距離。徒歩運搬明記は減点、設備は荷物を減らせるので加点。',
    rate: e => {
      const r = {};
      r.quietness = baseQuiet(e);
      if (e.free) r.value = 5;
      r.access = clamp(baseAccess(e) - (e.carHard ? 1.5 : 0));
      r.facility = clamp(baseFacility(e) + (e.waterPresent ? 0.5 : 0) - (e.waterAbsent ? 0.5 : 0));
      return r;
    },
  },
  {
    name: '⑥ 写真撮影目的・景観重視',
    note: '景観を判断できる材料が features / cautions にないため、絶景は採点しない。',
    rate: e => {
      const r = {};
      r.quietness = baseQuiet(e);
      if (e.free) r.value = 5;
      r.access = baseAccess(e);
      r.facility = baseFacility(e);
      return r;
    },
  },
  {
    name: '⑦ 節約志向・とにかく安さ',
    note: '無料は満点。予約の手間や有料化リスクをわずかに減点。',
    rate: e => {
      const r = {};
      if (e.free) r.value = clamp(5 - (e.closure ? 0.5 : 0));
      r.access = baseAccess(e);
      r.facility = baseFacility(e);
      return r;
    },
  },
  {
    name: '⑧ 直火愛好家・焚き火の自由度重視',
    note: '直火禁止を減点。可否不明も安心できないとして軽く減点。',
    rate: e => {
      const r = {};
      r.quietness = baseQuiet(e);
      if (e.free) r.value = clamp(5 - (e.fireBanned ? 1 : 0) - (e.fireUnknown ? 0.5 : 0));
      r.access = baseAccess(e);
      r.facility = clamp(baseFacility(e) + (e.firewood ? 1 : 0));
      return r;
    },
  },
  {
    name: '⑨ 安全重視・増水/落石/獣のリスクを厳しく見る',
    note: '増水・落石・熊・管理人不在を強く減点。',
    rate: e => {
      const r = {};
      const risk = (e.flood ? 1 : 0) + (e.rockfall ? 0.5 : 0) + (e.bear ? 1 : 0) + (e.managedAbsent ? 0.5 : 0);
      r.quietness = baseQuiet(e);
      if (e.free) r.value = clamp(5 - risk);
      r.access = clamp(baseAccess(e) - (e.carHard ? 0.5 : 0));
      r.facility = clamp(baseFacility(e) - (e.toiletNone ? 0.5 : 0));
      return r;
    },
  },
  {
    name: '⑩ リピーター視点・混雑度と通いやすさ',
    note: 'イベントや閉鎖リスクを嫌う。予約制は確実に泊まれる点で加点。',
    rate: e => {
      const r = {};
      r.quietness = clamp(baseQuiet(e) - (e.eventRisk ? 0.5 : 0) + (e.reservationReq ? 0.5 : 0));
      if (e.free) r.value = clamp(5 - (e.closure ? 0.5 : 0) - (e.eventRisk ? 0.5 : 0));
      r.access = clamp(baseAccess(e) + (e.carIn ? 0.5 : 0));
      r.facility = baseFacility(e);
      return r;
    },
  },
];

// ── 採点 ────────────────────────────────────────────────────────────────────
const camps = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const targets = camps.filter(c => c.type === 'wild');

const results = [];
for (const c of targets) {
  const e = evidence(c);
  const votes = PERSONAS.map(p => ({ persona: p, scores: p.rate(e) }));
  const axisResult = {};

  for (const axis of AXES) {
    const vals = votes.map(v => v.scores[axis]).filter(v => typeof v === 'number');
    if (vals.length < MIN_RATERS) {
      axisResult[axis] = {
        raters: vals.length, vals, avg: null,
        adopted: c.scores[axis], held: true,
        reason: `根拠不足（採点できたペルソナ ${vals.length}人 < ${MIN_RATERS}人）。既存値を維持`,
      };
      continue;
    }
    const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    const adopted = clamp(Math.round(avg));
    axisResult[axis] = {
      raters: vals.length, vals, avg, adopted, held: false,
      reason: adopted === c.scores[axis]
        ? '既存値と一致'
        : `平均 ${avg} → ${adopted}（既存 ${c.scores[axis]} から ${adopted > c.scores[axis] ? '+' : ''}${adopted - c.scores[axis]}）`,
    };
  }
  results.push({ camp: c, evidence: e, votes, axisResult });
}

// ── ノート出力 ──────────────────────────────────────────────────────────────
const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|');

let md = '';
md += '# 10人審査員によるスコア再採点（野営地）\n\n';
md += `対象: \`type: "wild"\` の **${targets.length}件**（全 ${camps.length}件中）\n\n`;
md += '## 方針\n\n';
md += '- 材料は **features（notes 含む） / cautions / 料金 / 営業期間 / 予約要否** のみ。\n';
md += '  施設名や soloComment からの推測は使わない。\n';
md += `- 各ペルソナは根拠のある軸だけ採点し、無ければ棄権する。採点者が **${MIN_RATERS}人未満**の軸は\n`;
md += '  「根拠不足」として **既存値を維持**する。\n';
md += '- 10人の平均を小数第1位で丸め、四捨五入して整数化した値を採用値とする。\n\n';

md += '## ペルソナ一覧\n\n';
md += '| # | ペルソナ | 採点の方針 |\n| --- | --- | --- |\n';
PERSONAS.forEach((p, i) => { md += `| ${i + 1} | ${esc(p.name)} | ${esc(p.note)} |\n`; });
md += '\n';

// 軸ごとの据え置き集計
const heldByAxis = {};
for (const axis of AXES) heldByAxis[axis] = results.filter(r => r.axisResult[axis].held).length;
md += '## 根拠不足で据え置いた軸\n\n';
md += '| 軸 | 据え置き件数 | 備考 |\n| --- | --- | --- |\n';
for (const axis of AXES) {
  const note = axis === 'scenery'
    ? 'features / cautions に景観を判断できる情報がないため、全件で採点不能'
    : heldByAxis[axis] ? '一部で採点者が足りず据え置き' : '—';
  md += `| ${AXIS_LABEL[axis]} | ${heldByAxis[axis]} / ${targets.length} | ${note} |\n`;
}
md += '\n---\n\n';

let changedCells = 0, changedCamps = 0;
for (const r of results) {
  const c = r.camp;
  let campChanged = false;
  md += `## ${esc(c.name)}（\`${c.slug}\`）\n\n`;
  md += `${c.prefecture}・${esc(c.area)}\n\n`;
  md += '| 軸 | 10人の点数分布 | 採点者 | 平均 | 既存 | 採用 | 判定 |\n';
  md += '| --- | --- | --- | --- | --- | --- | --- |\n';
  for (const axis of AXES) {
    const a = r.axisResult[axis];
    const dist = a.vals.length ? a.vals.map(v => (Math.round(v * 10) / 10)).join(', ') : '—';
    const changed = !a.held && a.adopted !== c.scores[axis];
    if (changed) { changedCells++; campChanged = true; }
    md += `| ${AXIS_LABEL[axis]} | ${dist} | ${a.raters} | ${a.avg == null ? '—' : a.avg} | ${c.scores[axis]} | **${a.adopted}** | ${esc(a.reason)} |\n`;
  }
  if (campChanged) changedCamps++;
  md += '\n';
}

md += '---\n\n';
md += `## 集計\n\n- 対象 ${targets.length}件 × 5軸 = ${targets.length * 5}セル\n`;
md += `- 値が変わったセル: **${changedCells}**\n`;
md += `- 値が変わった施設: **${changedCamps} / ${targets.length}**\n`;
md += `- 根拠不足で据え置いたセル: **${AXES.reduce((n, a) => n + heldByAxis[a], 0)}**\n\n`;
md += APPLY
  ? '※ `--apply` 付きで実行したため data/campgrounds.json の scores を更新した。\n'
  : '※ 採点のみ。data/campgrounds.json は変更していない（更新するには `--apply`）。\n';

fs.writeFileSync(NOTES_PATH, md);

// ── 反映 ────────────────────────────────────────────────────────────────────
if (APPLY) {
  for (const r of results) {
    for (const axis of AXES) {
      const a = r.axisResult[axis];
      if (!a.held) r.camp.scores[axis] = a.adopted;
    }
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(camps, null, 2));
}

console.log(`対象 ${targets.length}件（type: "wild"）× 5軸 = ${targets.length * 5}セル`);
console.log(`  値が変わったセル: ${changedCells}`);
console.log(`  値が変わった施設: ${changedCamps} / ${targets.length}`);
for (const axis of AXES) {
  console.log(`  ${AXIS_LABEL[axis]}: 据え置き ${heldByAxis[axis]}件`);
}
console.log(APPLY ? 'scores を更新しました' : '採点のみ（--apply で反映）');
console.log(`出力: ${path.relative(process.cwd(), NOTES_PATH)}`);
