"use client";

import { useState } from "react";
import {
  activeCampgrounds,
  countMatching,
  hasActiveConditions,
  DEFAULT_FILTERS,
  BUDGET_LIMIT,
  BUDGET_STEP,
} from "@/lib/camp";
import type { FeatureFilterKey, Filters, SortKey } from "@/lib/camp";
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

const PREFECTURE_ORDER = ["神奈川", "静岡", "山梨", "千葉", "東京"] as const;
const PREFECTURES: string[] = [
  "全部",
  ...PREFECTURE_ORDER.filter((p) => activeCampgrounds.some((c) => c.prefecture === p)),
];

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
    ],
  },
];

/** 「選択中」のチップと「すべて解除」で使う、全条件の平坦なリスト */
const ALL_FEATURES: FeatureFilter[] = FEATURE_GROUPS.flatMap((g) => g.items);

const pillBase =
  "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-full text-[14px] font-medium border transition-all duration-150 active:scale-[0.97] shrink-0";

/**
 * こだわり条件のボタン。**グリッドの1マスを埋める。**
 *
 * `min-h-[44px]` はタップ領域の下限。幅360pxの2列だと1マスが約164pxなので、
 * ラベルが折り返さないよう `text-[13px]` と `px-2` まで詰め、数字は右端に寄せる。
 */
const cellBase =
  "w-full inline-flex items-center justify-between gap-1 min-h-[44px] px-3 rounded-xl " +
  "text-[13px] sm:text-[14px] font-medium border transition-all duration-150 active:scale-[0.97] text-left";
const pillActive = "bg-[#e8611f] text-white border-transparent shadow-sm";
const pillInactive = "bg-white text-[#0e0d0b] border-[#ccc] hover:border-[#e8611f]/50";
/** 押しても0件になる条件。消さずに、押せない状態で件数だけ見せる。 */
const pillEmpty = "bg-white text-[#b3aca6] border-[#e6e2de] cursor-not-allowed";

/**
 * 条件の行。
 *
 * 狭い画面では横スクロール、`sm` 以上では折り返して全部見せる。
 * 横スクロールのままだと、画面が広くても最後のピル（「もっと条件」など）が
 * 右端で切れて、**そこに続きがあること自体が見えない**。
 * スクロールバーも消しているので、切れているのか終わりなのか区別がつかなかった。
 */
/**
 * 県の行。**2026-10-06 に横スクロールをやめて折り返しにした。**
 *
 * 幅360pxだと「山梨」「千葉」が画面の右端で切れ、**そこに続きがあること自体が見えない**
 * （スクロールバーも消していた）。県は5つしかないので、折り返せば2行で全部入る。
 */
const rowClass = "px-4";
const rowInner = "flex flex-wrap items-center gap-2 gap-y-2";
const rowStyle = { WebkitOverflowScrolling: "touch" } as const;

/** ピル内の件数。選択中は白抜き、未選択はグレーで、ラベルより弱く見せる。 */
function Count({ n, selected }: { n: number; selected: boolean }) {
  return (
    <span
      className={`font-['JetBrains_Mono',monospace] text-[11px] font-normal ${
        selected ? "text-white/75" : "text-[#9a8e84]"
      }`}
    >
      {n}
    </span>
  );
}

export default function FilterBar({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  total,
  camps,
}: Props) {
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

  const hasConditions = hasActiveConditions(filters);

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
        aria-pressed={selected}
        aria-label={`${label.replace(/^\S+\s/, "")} ${n}件`}
        disabled={disabled}
        onClick={() => toggleFeature(key)}
        className={`${cellBase} ${selected ? pillActive : disabled ? pillEmpty : pillInactive}`}
      >
        <span className="truncate">{label}</span>
        <Count n={n} selected={selected} />
      </button>
    );
  };

  /** いま選ばれている条件。上に並べて、1つずつ外せるようにする */
  const selectedFeatures = ALL_FEATURES.filter(({ key }) => filters[key]);

  /** 条件だけ解除する（県と予算は残す） */
  const clearFeatures = () =>
    onFiltersChange(
      ALL_FEATURES.reduce((f, { key }) => ({ ...f, [key]: false }), filters)
    );

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 py-3 sm:py-4">
        <div className="px-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-bold tracking-wide text-[#6b5a4e]">希望の条件で探す</p>
            <p className="text-[11px] text-slate-500 mt-0.5">数字は、その条件を足したときの件数です</p>
          </div>
          {hasConditions && (
            <button
              onClick={reset}
              className="min-h-[36px] rounded-lg px-2.5 text-xs font-semibold text-[#c84f18] hover:bg-[#fff5ef] transition-colors"
            >
              条件をリセット
            </button>
          )}
        </div>

        <div className={rowClass} style={rowStyle}>
          <div className={rowInner}>
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

        <div className="px-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12px] font-semibold text-slate-500">予算</span>
            <span className="text-[13px] font-semibold text-[#0e0d0b]">
              {budgetLabel}
              <span className="ml-1.5 font-['JetBrains_Mono',monospace] text-[11px] font-normal text-[#9a8e84]">
                {budgetCount}
              </span>
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
          <div className="flex justify-between text-[11px] text-slate-400 -mt-1">
            <span>0円</span>
            <span>上限なし</span>
          </div>
        </div>

        {/* 選択中の条件。**1つずつ外せる**ようにして、全解除も置く */}
        {selectedFeatures.length > 0 && (
          <div className="px-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-semibold text-slate-500 shrink-0">選択中</span>
            {selectedFeatures.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleFeature(key)}
                aria-label={`${label.replace(/^\S+\s/, "")} を外す`}
                className="inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-full bg-[#e8611f] text-white text-[12px] font-medium active:scale-[0.97] transition-transform"
              >
                <span>{label.replace(/^\S+\s/, "")}</span>
                <span aria-hidden="true" className="text-white/80 text-[13px] leading-none">×</span>
              </button>
            ))}
            <button
              onClick={clearFeatures}
              className="min-h-[32px] rounded-lg px-2 text-[12px] font-semibold text-[#c84f18] hover:bg-[#fff5ef] transition-colors"
            >
              すべて解除
            </button>
          </div>
        )}

        {/*
          こだわり条件。**幅360pxで2列**、sm 以上で3列。
          折りたたみをやめて全部出す（畳むと、そこに条件があること自体が見えない）。
        */}
        <div className="px-4 flex flex-col gap-3">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[12px] font-semibold text-slate-500 mb-1.5">{group.title}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                {group.items.map(renderFeature)}
              </div>
            </div>
          ))}
        </div>

        <p className="px-4 -mt-1 text-[11px] leading-relaxed text-slate-500">
          予算は、ソロ1名が実際に払う総額の最安額で絞り込みます。
          {filters.budgetMax !== null && priceUnverified > 0 && (
            <span className="text-[#a54a20]">
              {" "}
              料金を確認できていない{priceUnverified}件は、予算で絞ると候補から外れます。
            </span>
          )}
          {" "}
          設備は、公式情報で「あり」と確認できた施設だけが該当します（未確認は含みません）。
        </p>

        <div className="px-4 flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="flex-1 h-[44px] bg-white border border-[#ccc] text-[#0e0d0b] text-[15px] rounded-xl px-3 focus:outline-none focus:border-[#e8611f]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-sm font-semibold text-slate-600 whitespace-nowrap shrink-0">{total}件</span>
        </div>
      </div>
    </div>
  );
}
