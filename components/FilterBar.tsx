"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  countMatching,
  hasActiveConditions,
  DEFAULT_FILTERS,
  BUDGET_LIMIT,
  BUDGET_STEP,
} from "@/lib/camp-core";
import { useFocusTrap } from "@/lib/useFocusTrap";
import type { FeatureFilterKey, Filters, SortKey } from "@/lib/camp-core";
import type { Campground } from "@/lib/types";

type Props = {
  filters: Filters;
  sort: SortKey;
  onFiltersChange: (f: Filters) => void;
  onSortChange: (s: SortKey) => void;
  total: number;
  /**
   * 件数を数える母集団。種別タブと「情報確認中も表示」を適用したあと、
   * こだわり条件を適用する前の一覧を渡す。
   * ピルの数字と押した結果を一致させるため、表示中の一覧と同じ母集団を使うこと。
   */
  camps: Campground[];
  onMapOpen?: () => void;
};

/** 掲載している4県。データを画面側の JS に入れないため固定で持つ（2026-11-05）。県を増やしたらここも足す */
const PREFECTURES: string[] = ["全部", "神奈川", "静岡", "山梨", "千葉"];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "soloScore", label: "おすすめ順" },
  { value: "priceAsc", label: "価格安い順" },
];

type FeatureFilter = { key: FeatureFilterKey; label: string };

/**
 * こだわり条件のグループ。**2026-10-06 に「もっと条件」の開閉をやめた。**
 *
 * 以前は該当件数の多寡で「常に見える5つ」と「畳む5つ」に分けていたが、
 * **畳まれた側に何があるかが利用者に見えない。**「釣りができる」を探している人は
 * 「もっと条件」を開くまで、その条件の存在自体を知らない。
 *
 * 代わりに**意味でグループ分けして全部出す。**幅360pxでも2列グリッドに収まる。
 * 件数が0の条件は押せない見た目のまま残すので、「無い」ことも分かる。
 */
type FeatureGroup = { title: string; items: FeatureFilter[] };

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "設備",
    items: [
      { key: "bath",          label: "♨️ 風呂あり" },
      { key: "shower",        label: "🚿 シャワー" },
      { key: "westernToilet", label: "🚽 洋式トイレ" },
      { key: "warmToilet",    label: "🚽 温水洗浄トイレ" },
    ],
  },
  {
    title: "買える",
    items: [
      { key: "firewood", label: "🪵 薪を買える" },
      { key: "shop",     label: "🏪 売店あり" },
    ],
  },
  {
    title: "その他",
    items: [
      { key: "pet",           label: "🐕 ペット可" },
      { key: "carIn",         label: "🚗 車横付け" },
      { key: "wifi",          label: "📶 Wi-Fi" },
      { key: "noReservation", label: "✅ 予約不要" },
      { key: "fishing",       label: "🎣 釣りができる" },
      /**
       * `bath`（場内の入浴施設）とは別の条件。
       * 「近くに温泉がある」を風呂ありに混ぜると、**場内に風呂が無い施設が
       * 風呂ありで出てくる。**判定は `lib/camp.ts` の `FEATURE_PREDICATES` に1か所だけ。
       */
      { key: "nearbyOnsen",   label: "♨️ 近くに温泉" },
      /** season が「通年」で始まるものだけ。営業期間が要確認の施設は入れない */
      { key: "yearRound",     label: "❄️ 通年営業（冬も）" },
    ],
  },
];

/** 「選択中」のチップと「すべて解除」で使う、全条件の平坦なリスト */
const ALL_FEATURES: FeatureFilter[] = FEATURE_GROUPS.flatMap((g) => g.items);

/**
 * ── 背景（2026-10-30）────────────────────────────────────────────────
 * 貼りつきバーとボトムシートの背景は**完全不透明の炭**。
 * 以前は `bg-white/95 backdrop-blur` で、下のカードの文字が透けて読みにくかった。
 * `/95` のような透過・`backdrop-blur`・`opacity-*`・rgba を**ここに足さない**
 * （scripts/test-filters.js が BAR_BG / SHEET_BG / PANEL_BG を検査して落とす）。
 */
const BAR_BG = "bg-[#0e0d0b]";
const SHEET_BG = "bg-[#0e0d0b]";
const PANEL_BG = "bg-[#0e0d0b]";

/**
 * 色（炭の上での読みやすさを実測して決めた。WCAG AA 4.5:1 以上）
 *   本文        #f3efe9 on #0e0d0b
 *   件数        #e2dbd1 on #1c1a17（未選択ピル）/ #0e0d0b on #e8611f（選択中ピル）
 * 選択中のピルは ember 地に**炭の文字**。白文字だと 3.9:1 で AA を割る。
 */
const pillBase =
  "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-full text-[14px] font-medium border transition-colors duration-150 shrink-0";
const cellBase =
  "w-full inline-flex items-center justify-start gap-1.5 min-h-[44px] px-3 rounded-xl " +
  "text-[13px] sm:text-[14px] font-medium border transition-colors duration-150 text-left";
const pillActive = "bg-[#e8611f] text-[#0e0d0b] border-[#e8611f] font-bold";
const pillInactive = "bg-[#1c1a17] text-[#f3efe9] border-[#45403a] hover:border-[#e8611f]";
/** 押しても0件になる条件。消さずに、押せない状態で件数だけ見せる。 */
const pillEmpty = "bg-[#0e0d0b] text-[#8a8279] border-[#2b2824] cursor-not-allowed";

/**
 * 件数。**ラベルのすぐ横**に、本文と同じ大きさ・読める濃さで出す。
 * 以前は右端に寄せた11pxの薄いグレー（#9a8e84 on 白 ≒ 3.2:1）で、読めなかった。
 */
function Count({ n, selected, disabled }: { n: number; selected: boolean; disabled?: boolean }) {
  return (
    <span
      data-count
      className={`tabular-nums font-normal ${
        selected ? "text-[#0e0d0b]" : disabled ? "text-[#8a8279]" : "text-[#e2dbd1]"
      }`}
    >
      {n}件
    </span>
  );
}

/** md（768px）以上か。SSR では false（＝スマホ扱い）で出し、マウント後に合わせる */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
}

export default function FilterBar({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  total,
  camps,
}: Props) {
  const isDesktop = useIsDesktop();
  /** PC：バーの下のパネル（既定は開いた状態。sticky にはしない） */
  const [panelOpen, setPanelOpen] = useState(true);
  /** スマホ：下から出るシート */
  const [sheetOpen, setSheetOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    onFiltersChange({ ...filters, [key]: val });
  const toggleFeature = (key: FeatureFilterKey) =>
    onFiltersChange({ ...filters, [key]: !filters[key] });
  const reset = () => onFiltersChange(DEFAULT_FILTERS);

  /**
   * ピルに出す件数。**押した後にどうなるか**を数える。
   * 選択中のピルは条件がそのままなので、いまの結果件数と一致する。
   */
  const countWith = (patch: Partial<Filters>) => countMatching(camps, filters, patch);
  /** シートの「◯件を表示」。一覧と同じ判定（countMatching）を通す */
  const resultCount = countMatching(camps, filters);

  const hasConditions = hasActiveConditions(filters);
  const selectedFeatures = ALL_FEATURES.filter(({ key }) => filters[key]);
  const activeConditionCount =
    selectedFeatures.length +
    (filters.prefecture !== DEFAULT_FILTERS.prefecture ? 1 : 0) +
    (filters.budgetMax !== null ? 1 : 0);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  // PC 幅ではシートを出さない（PC はパネルで見せる）。幅が変わったらシートは消え、ロックも外れる
  const showSheet = sheetOpen && !isDesktop;
  // シート表示中は Tab をシートの中で循環させる（背景のカードへ抜けていた。審査員6）
  useFocusTrap(sheetRef, showSheet);

  /**
   * シートを開いている間は**背面をスクロールさせない。**
   *
   * `overflow: hidden` だけでは足りない。Android Chrome 相当の環境で、暗幕を指で
   * 下になでるとページが 350px → 0 まで動いた（2026-10-30 に Playwright で実測）。
   * body を `position: fixed` で今の位置に固定し、閉じたら同じ位置へ戻す。
   */
  useEffect(() => {
    if (!showSheet) return;
    const html = document.documentElement;
    const body = document.body;
    const y = window.scrollY;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlBehavior: html.style.scrollBehavior,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    sheetRef.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      // globals.css の scroll-behavior: smooth で戻る様子が見えないよう、一瞬だけ切る
      html.style.scrollBehavior = "auto";
      window.scrollTo(0, y);
      html.style.scrollBehavior = prev.htmlBehavior;
      window.removeEventListener("keydown", onKey);
    };
  }, [showSheet, closeSheet]);

  const onFilterButton = () => {
    if (isDesktop) {
      // PC：閉じていれば開いてパネルまで戻る。開いていて画面内なら閉じる
      const el = panelRef.current;
      const visible = el ? el.getBoundingClientRect().bottom > 56 && el.getBoundingClientRect().top < window.innerHeight : false;
      if (!panelOpen) {
        setPanelOpen(true);
        requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: "start" }));
      } else if (!visible) {
        el?.scrollIntoView({ block: "start" });
      } else {
        setPanelOpen(false);
      }
    } else {
      setSheetOpen(true);
    }
  };

  // 予算スライダー。null（条件なし）は右端に置く。
  const budgetValue = filters.budgetMax ?? BUDGET_LIMIT;
  const budgetLabel =
    filters.budgetMax === null ? "上限なし" : `〜${filters.budgetMax.toLocaleString()}円`;
  const budgetCount = countWith({ budgetMax: filters.budgetMax });
  // 予算で絞ると、料金を確認できていない施設は候補から外れる。
  // 黙って減らすと「なぜ減ったのか」が分からないので、件数を出して理由を書く。
  const priceUnverified = camps.filter((c) => c.priceVerified !== true).length;

  /** グリッドの1マス。押すとその条件が入り、数字は「押したあとの件数」 */
  const renderFeature = ({ key, label }: FeatureFilter) => {
    const selected = filters[key];
    const n = countWith({ [key]: true } as Partial<Filters>);
    // 選択中は0件でも押せる状態を保つ。解除する手段を奪わない。
    const disabled = !selected && n === 0;
    return (
      <button
        key={key}
        data-feature={key}
        aria-pressed={selected}
        aria-label={`${label.replace(/^\S+\s/, "")} ${n}件`}
        disabled={disabled}
        onClick={() => toggleFeature(key)}
        className={`${cellBase} ${selected ? pillActive : disabled ? pillEmpty : pillInactive}`}
      >
        <span className="truncate">{label}</span>
        <Count n={n} selected={selected} disabled={disabled} />
      </button>
    );
  };

  /** 条件だけ解除する（県と予算は残す） */
  const clearFeatures = () =>
    onFiltersChange(
      ALL_FEATURES.reduce((f, { key }) => ({ ...f, [key]: false }), filters)
    );

  /** パネルの中身。PC のパネルとスマホのシートで同じものを使う */
  const panelBody = (
    <div className="flex flex-col gap-4 text-[#f3efe9]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-[#d6cfc5]">数字は、その条件を足したときの件数です</p>
        {hasConditions && (
          <button
            onClick={reset}
            className="shrink-0 min-h-[44px] rounded-lg px-2.5 text-[13px] font-semibold text-[#ff9a63] hover:bg-[#1c1a17] transition-colors"
          >
            条件をリセット
          </button>
        )}
      </div>

      <div>
        <p className="text-[12px] font-bold text-[#d6cfc5] mb-1.5">県</p>
        <div className="flex flex-wrap items-center gap-2">
          {PREFECTURES.map((p) => {
            const selected = filters.prefecture === p;
            const n = countWith({ prefecture: p });
            return (
              <button
                key={p}
                aria-pressed={selected}
                aria-label={`${p} ${n}件`}
                onClick={() => set("prefecture", p)}
                className={`${pillBase} ${selected ? pillActive : pillInactive}`}
              >
                <span>{p}</span>
                <Count n={n} selected={selected} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-bold text-[#d6cfc5]">予算</span>
          <span className="text-[14px] font-semibold text-[#f3efe9]">
            {budgetLabel}
            <span data-count className="ml-1.5 tabular-nums font-normal text-[#e2dbd1]">{budgetCount}件</span>
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={BUDGET_LIMIT}
          step={BUDGET_STEP}
          value={budgetValue}
          onChange={(e) => {
            const v = Number(e.target.value);
            // 右端は金額ではなく「制限しない」。額として扱うと、
            // 将来 10,000円を超える施設が入ったとき右端まで振っても出てこなくなる。
            set("budgetMax", v >= BUDGET_LIMIT ? null : v);
          }}
          aria-label={`予算の上限 ${budgetLabel} ${budgetCount}件`}
          className="mt-2 w-full h-6 cursor-pointer accent-[#e8611f] bg-transparent"
        />
        <div className="flex justify-between text-[11px] text-[#bfb7ad] -mt-1">
          <span>0円</span>
          <span>上限なし</span>
        </div>
      </div>

      {/* 選択中の条件。**1つずつ外せる**ようにして、全解除も置く */}
      {selectedFeatures.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-bold text-[#d6cfc5] shrink-0">選択中</span>
          {selectedFeatures.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleFeature(key)}
              aria-label={`${label.replace(/^\S+\s/, "")} を外す`}
              className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-full bg-[#e8611f] text-[#0e0d0b] text-[13px] font-bold"
            >
              <span>{label.replace(/^\S+\s/, "")}</span>
              <span aria-hidden="true" className="text-[14px] leading-none">×</span>
            </button>
          ))}
          <button
            onClick={clearFeatures}
            className="min-h-[44px] rounded-lg px-2 text-[13px] font-semibold text-[#ff9a63] hover:bg-[#1c1a17] transition-colors"
          >
            すべて解除
          </button>
        </div>
      )}

      {/*
        こだわり条件。**幅360pxで2列**、sm 以上で3列。
        折りたたみをやめて全部出す（畳むと、そこに条件があること自体が見えない）。
      */}
      {FEATURE_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="text-[12px] font-bold text-[#d6cfc5] mb-1.5">{group.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
            {group.items.map(renderFeature)}
          </div>
        </div>
      ))}

      <p className="text-[12px] leading-relaxed text-[#d6cfc5]">
        予算は、ソロ1名が実際に払う総額の最安額で絞り込みます。
        {filters.budgetMax !== null && priceUnverified > 0 && (
          <span className="text-[#ffb48a]">
            {" "}
            料金を確認できていない{priceUnverified}件は、予算で絞ると候補から外れます。
          </span>
        )}
        {" "}
        設備は、公式情報で「あり」と確認できた施設だけが該当します（未確認は含みません）。
      </p>
    </div>
  );

  return (
    <>
      {/*
        ── 貼りつくのはこの細いバー1本だけ（2026-10-30）──────────────────
        以前はこだわりパネル全体が sticky で、スマホでは画面の上半分を占めて一覧に被っていた。
        バーは高さ 56px 以下・完全不透明。中身は「絞り込み」・並び順・件数の3つだけ。
      */}
      <div
        data-testid="filter-bar"
        className={`sticky top-0 z-30 h-14 ${BAR_BG} border-b border-[#2b2824]`}
      >
        <div className="max-w-4xl mx-auto h-full px-4 md:px-8 flex items-center gap-2">
          <button
            ref={triggerRef}
            data-testid="filter-open"
            onClick={onFilterButton}
            aria-expanded={isDesktop ? panelOpen : showSheet}
            aria-controls={isDesktop ? "filter-panel" : "filter-sheet"}
            className="shrink-0 inline-flex items-center gap-1.5 h-11 px-3 rounded-xl border border-[#e8611f] text-[#f3efe9] text-[14px] font-bold hover:bg-[#1c1a17] transition-colors"
          >
            <span aria-hidden="true">⚙</span>
            <span>絞り込み</span>
            {activeConditionCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#e8611f] text-[#0e0d0b] text-[12px] font-bold tabular-nums">
                {activeConditionCount}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            aria-label="並び順"
            className="min-w-0 flex-1 md:flex-none md:w-44 h-11 bg-[#1c1a17] border border-[#45403a] text-[#f3efe9] text-[14px] rounded-xl px-3 focus:outline-none focus:border-[#e8611f]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span
            data-testid="result-count"
            className="ml-auto shrink-0 text-[15px] font-bold text-[#f3efe9] tabular-nums whitespace-nowrap"
          >
            {total}件
          </span>
        </div>
      </div>

      {/* PC：バーの下に展開するパネル（sticky にしない。ページと一緒に流れる） */}
      {panelOpen && (
        <div
          id="filter-panel"
          ref={panelRef}
          data-testid="filter-panel"
          className={`hidden md:block ${PANEL_BG} border-b border-[#2b2824] scroll-mt-14`}
        >
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">{panelBody}</div>
        </div>
      )}

      {/* スマホ：下から出るシート */}
      {showSheet && (
        <div className="fixed inset-0 z-50 md:hidden" data-testid="filter-sheet-root">
          {/* 背景タップで閉じる。シート本体ではなく後ろの暗幕 */}
          <div
            data-testid="filter-sheet-backdrop"
            className="absolute inset-0 bg-black/60 touch-none"
            onClick={closeSheet}
            aria-hidden="true"
          />
          <div
            id="filter-sheet"
            ref={sheetRef}
            data-testid="filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="絞り込み"
            tabIndex={-1}
            className={`absolute inset-x-0 bottom-0 max-h-[85dvh] flex flex-col rounded-t-2xl ${SHEET_BG} border-t border-[#2b2824] outline-none`}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-[#2b2824] shrink-0">
              <p className="text-[16px] font-bold text-[#f3efe9]">絞り込み</p>
              <button
                data-testid="filter-sheet-close"
                onClick={closeSheet}
                aria-label="閉じる"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[#f3efe9] text-[22px] hover:bg-[#1c1a17]"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{panelBody}</div>
            <div className="shrink-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-[#2b2824]">
              <button
                data-testid="filter-sheet-apply"
                onClick={closeSheet}
                className="w-full min-h-[48px] rounded-xl bg-[#e8611f] text-[#0e0d0b] text-[16px] font-bold"
              >
                {resultCount}件を表示
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
