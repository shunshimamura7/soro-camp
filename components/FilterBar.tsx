"use client";

import type { Filters, SortKey } from "@/lib/camp";

type Props = {
  filters: Filters;
  sort: SortKey;
  onFiltersChange: (f: Filters) => void;
  onSortChange: (s: SortKey) => void;
  total: number;
};

const PREFECTURES = ["全部", "神奈川", "静岡", "山梨"] as const;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "soloScore", label: "おすすめ順" },
  { value: "priceMin", label: "価格順" },
  { value: "quietness", label: "静か順" },
  { value: "scenery", label: "絶景順" },
  { value: "value", label: "コスパ順" },
  { value: "facility", label: "設備順" },
];

type ToggleProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
};

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        checked
          ? "bg-blue-500 border-blue-500 text-white"
          : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterBar({ filters, sort, onFiltersChange, onSortChange, total }: Props) {
  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    onFiltersChange({ ...filters, [key]: val });

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 py-2 sm:py-3 shadow-sm">
      <div className="max-w-4xl mx-auto flex flex-col gap-2 sm:gap-3">
        {/* Prefecture tabs — horizontal scroll on mobile, wrap on desktop */}
        <div className="scrollbar-hide overflow-x-auto pl-3 sm:pl-4">
          <div className="flex gap-2 pr-3 sm:pr-4 sm:flex-wrap">
            {PREFECTURES.map((p) => (
              <button
                key={p}
                onClick={() => set("prefecture", p)}
                className={`shrink-0 min-h-[36px] px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.prefecture === p
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Feature toggles + sort */}
        <div className="px-3 sm:px-4 flex flex-wrap items-center gap-2">
          <Toggle checked={filters.bonfire} onChange={(v) => set("bonfire", v)} label="🔥 焚き火可" />
          <Toggle checked={filters.soloPlan} onChange={(v) => set("soloPlan", v)} label="🏕 ソロプラン" />
          <Toggle checked={filters.bath} onChange={(v) => set("bath", v)} label="♨️ 風呂あり" />
          <Toggle checked={filters.noReservation} onChange={(v) => set("noReservation", v)} label="✅ 予約不要" />

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">{total}件</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              className="min-h-[36px] bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
