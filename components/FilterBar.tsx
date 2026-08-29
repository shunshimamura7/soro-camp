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

const PREFECTURE_ORDER = ["神奈川", "静岡", "山梨", "千葉"] as const;
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
 * 常に見えている条件。**該当が全体の2〜7割に収まるもの**を前に置く。
 *
 * 8割以上が該当する条件（車横付け・シャワー・洋式トイレ）は、押しても一覧がほとんど減らない。
 * 「絞り込めなかった」という体験になるので、件数を添えたうえで後ろに回す。
 * 逆に1割を切る条件（釣り・予約不要）は、押した瞬間に一覧が消える。こちらも畳む。
 */
const PRIMARY_FEATURES: FeatureFilter[] = [
  { key: "bath",     label: "♨️ 風呂あり" },
  { key: "pet",      label: "🐕 ペット可" },
  { key: "shop",     label: "🏪 売店あり" },
  { key: "firewood", label: "🪵 薪を買える" },
  { key: "shower",   label: "🚿 シャワーあり" },
];

/** 「もっと条件」を開いたときに出るもの。該当が極端に多い／少ない条件はこちら。 */
const MORE_FEATURES: FeatureFilter[] = [
  { key: "carIn",         label: "🚗 車横付け" },
  { key: "westernToilet", label: "🚽 洋式トイレ" },
  { key: "wifi",          label: "📶 Wi-Fi" },
  { key: "noReservation", label: "✅ 予約不要" },
  { key: "fishing",       label: "🎣 釣りができる" },
];

const pillBase =
  "inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 rounded-full text-[14px] font-medium border transition-all duration-150 active:scale-[0.97] shrink-0";
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
const rowClass = "scrollbar-hide overflow-x-auto px-4 sm:overflow-visible";
const rowInner = "inline-flex items-center gap-2 whitespace-nowrap sm:flex sm:flex-wrap sm:gap-y-2";
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
  const [moreOpen, setMoreOpen] = useState(false);

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

  const moreSelected = MORE_FEATURES.filter(({ key }) => filters[key]).length;

  const renderFeature = ({ key, label }: FeatureFilter) => {
    const selected = filters[key];
    const n = countWith({ [key]: true } as Partial<Filters>);
    // 選択中は 0件でも押せる状態を保つ。解除する手段を奪わない。
    const disabled = !selected && n === 0;
    return (
      <button
        key={key}
        aria-pressed={selected}
        aria-label={`${label.replace(/^\S+\s/, "")} ${n}件`}
        disabled={disabled}
        onClick={() => toggleFeature(key)}
        className={`${pillBase} ${selected ? pillActive : disabled ? pillEmpty : pillInactive}`}
      >
        <span>{label}</span>
        <Count n={n} selected={selected} />
      </button>
    );
  };

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

        <div className={rowClass} style={rowStyle}>
          <div className={rowInner}>
            <span className="text-[12px] font-semibold text-slate-500 shrink-0">こだわり</span>
            {PRIMARY_FEATURES.map(renderFeature)}
            <button
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              className={`${pillBase} ${moreSelected > 0 && !moreOpen ? pillActive : pillInactive}`}
            >
              <span>{moreOpen ? "条件を閉じる" : "もっと条件"}</span>
              {moreSelected > 0 && !moreOpen && <Count n={moreSelected} selected />}
            </button>
          </div>
        </div>

        {moreOpen && (
          <div className={rowClass} style={rowStyle}>
            <div className={rowInner}>
              <span className="text-[12px] font-semibold text-slate-500 shrink-0 invisible">こだわり</span>
              {MORE_FEATURES.map(renderFeature)}
            </div>
          </div>
        )}

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
