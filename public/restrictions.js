/**
 * 期間限定制限バッジの書き換え。
 *
 * 静的サイトなので「今日が制限期間内か」をビルド時に決めると翌日には嘘になる。
 * そこでビルド時は常に「期間制限あり・要確認」を出しておき、閲覧時にこのスクリプトが
 * ローカル日付で判定して書き換える。
 *
 *   要確認（既定） … 静的HTML。JSが動かなければこのまま残る（フェイルセーフは要確認側）
 *   制限中         … 期間内。reason と source を出す
 *   通常           … 期間外
 *
 * 日付ロジック（todayMD / isActive / isValidMD）はこのファイルが唯一の実装で、
 * scripts/validate-data.js と scripts/test-restrictions.js が require して使う。
 * そのため DOM に触る処理は module 経由の読み込み時には走らせない。
 */
(function (global) {
  'use strict';

  var MD_PATTERN = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  // 各月の日数。2月は閏年がありうるので29まで許す（MM-DD は年を持たず判定できない）
  var DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  /** "07-03" のような MM-DD として妥当か */
  function isValidMD(md) {
    if (typeof md !== 'string' || !MD_PATTERN.test(md)) return false;
    var month = Number(md.slice(0, 2));
    var day = Number(md.slice(3, 5));
    return day <= DAYS_IN_MONTH[month - 1];
  }

  /**
   * 閲覧者のローカル日付を MM-DD で返す。
   * UTC ではなくローカル（getMonth/getDate）を使う。日本の利用者が 09:00 JST に
   * 見たとき UTC はまだ前日で、境界日の判定が1日ずれるため。
   */
  function todayMD(date) {
    var d = date || new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return (m < 10 ? '0' + m : String(m)) + '-' + (day < 10 ? '0' + day : String(day));
  }

  /**
   * md が制限期間内か。from・to はどちらも「その日を含む」。
   *
   *   from <= to … 同一年内（07-03 〜 08-31）
   *   from >  to … 年またぎ（12-10 〜 04-25）。12-31 も 01-01 も期間内になる
   */
  function isActive(restriction, md) {
    if (!restriction || !isValidMD(restriction.from) || !isValidMD(restriction.to)) return false;
    if (!isValidMD(md)) return false;
    if (restriction.from <= restriction.to) {
      return md >= restriction.from && md <= restriction.to;
    }
    return md >= restriction.from || md <= restriction.to;
  }

  /** "07-03" → "7/3" */
  function formatMD(md) {
    return Number(md.slice(0, 2)) + '/' + Number(md.slice(3, 5));
  }

  /** source から表示ラベルとURLを切り出す */
  function parseSource(source) {
    var m = String(source || '').match(/https?:\/\/\S+/);
    if (!m) return { label: String(source || '').trim(), url: null };
    var label = String(source).replace(m[0], '').trim();
    return { label: label || m[0], url: m[0] };
  }

  var META = {
    bonfire: { icon: '🔥', label: '焚き火' },
    camping: { icon: '⛺', label: 'キャンプ' },
    access:  { icon: '🚧', label: '立入' },
  };

  // ── ここから下は DOM 用。node から require したときは走らない ────────────────

  /**
   * チップ1つを現在日付で塗り替える。
   * 同じ状態なら何もしない（MutationObserver から何度呼ばれても安全）。
   *
   * 触るのはラベルと data-state だけ。期間・理由・出典はサーバ側で書き出してあり、
   * このスクリプトが動かなくても読める状態を保つ（フェイルセーフは要確認側）。
   */
  function applyChip(chip, md) {
    var raw = chip.getAttribute('data-restrictions');
    if (!raw) return;

    var list;
    try {
      list = JSON.parse(raw);
    } catch (e) {
      return; // 壊れていたら「要確認」のまま触らない
    }
    if (!list || !list.length) return;

    var type = chip.getAttribute('data-restriction-type') || list[0].type;
    var meta = META[type] || { icon: '⚠️', label: '制限' };

    var hit = null;
    for (var i = 0; i < list.length; i++) {
      if (isActive(list[i], md)) { hit = list[i]; break; }
    }

    var state = hit ? 'restricted' : 'clear';
    if (chip.getAttribute('data-state') === state) return;

    var labelEl = chip.querySelector('[data-restriction-label]');
    if (labelEl) {
      labelEl.textContent = hit
        ? meta.icon + ' ' + meta.label + '（期間制限中）'
        : meta.icon + ' ' + meta.label;
    }

    chip.setAttribute('data-state', state);
  }

  function applyAll(root, md) {
    var scope = root || document;
    var chips = scope.querySelectorAll('[data-restriction-chip]');
    var day = md || todayMD();
    for (var i = 0; i < chips.length; i++) applyChip(chips[i], day);
  }

  function start() {
    applyAll(document);

    // 一覧はフィルタ・並び替え・タブでカードが作り直される。React が
    // 静的HTMLの「要確認」で描き直すので、追加されたチップを拾って塗り直す。
    if (typeof MutationObserver !== 'function') return;
    var queued = false;
    var observer = new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        applyAll(document);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  var api = {
    MD_PATTERN: MD_PATTERN,
    isValidMD: isValidMD,
    todayMD: todayMD,
    isActive: isActive,
    formatMD: formatMD,
    parseSource: parseSource,
    applyAll: applyAll,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;          // node（validate / テスト）から使う
    return;
  }

  global.SoroRestrictions = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(typeof self !== 'undefined' ? self : globalThis);
