"use client";

import type { Filters, SortKey } from "@/lib/camp";

type Props = {
  filters: Filters;
  sort: SortKey;
  onFiltersChange: (f: Filters) => void;
  onSortChange: (s: SortKey) => void;
  total: number;
  onMapOpen?: () => void;
};

const PREFECTURES = ["全部", "神奈川", "静岡", "山梨"] as const;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "soloScore", label: "おすすめ順" },
  { value: "priceAsc",  label: "価格安い順" },
];

type BooleanFilterKey = "bath" | "shower" | "noReservation";

const FEATURE_FILTERS: Array<{ key: BooleanFilterKey; label: string }> = [
  { key: "bath",          label: "♨️ 風呂あり" },
  { key: "shower",        label: "🚿 シャワーあり" },
  { key: "noReservation", label: "✅ 予約不要" },
];

const pillBase =
  "inline-flex items-center justify-center h-[40px] px-4 rounded-full text-[14px] font-medium border transition-colors shrink-0";
const pillActive   = "bg-[#e8611f] text-white border-transparent";
const pillInactive = "bg-white text-[#0e0d0b] border-[#ccc] hover:border-[#e8611f]/50";

export default function FilterBar({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  total,
}: Props) {
  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    onFiltersChange({ ...filters, [key]: val });

  const toggleFeature = (key: BooleanFilterKey) =>
    onFiltersChange({ ...filters, [key]: !filters[key] });

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 py-2.5 sm:py-3">

        {/* Prefecture + feature toggles — single horizontal scroll row */}
        <div
          className="scrollbar-hide overflow-x-auto pl-4"
          style={{ WebkitOverflowScrolling: "touch", whiteSpace: "nowrap" }}
        >
          <div className="inline-flex gap-2 pr-4">
            {PREFECTURES.map((p) => (
              <button
                key={p}
                onClick={() => set("prefecture", p)}
                className={`${pillBase} ${filters.prefecture === p ? pillActive : pillInactive}`}
              >
                {p}
              </button>
            ))}

            <span className="inline-block w-px h-[40px] bg-slate-200 mx-1 align-middle" />

            {FEATURE_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleFeature(key)}
                className={`${pillBase} ${filters[key] ? pillActive : pillInactive}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort dropdown + result count */}
        <div className="px-4 flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="flex-1 h-[44px] bg-white border border-[#ccc] text-[#0e0d0b] text-[15px] rounded-xl px-3 focus:outline-none focus:border-[#e8611f]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500 whitespace-nowrap shrink-0">{total}件</span>
        </div>

      </div>
    </div>
  );
}
