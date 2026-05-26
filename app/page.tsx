"use client";

import { useState, useMemo } from "react";
import { campgrounds, filterAndSort } from "@/lib/camp";
import type { Filters, SortKey } from "@/lib/camp";
import FilterBar from "@/components/FilterBar";
import CampCard from "@/components/CampCard";

const DEFAULT_FILTERS: Filters = {
  prefecture: "全部",
  bonfire: false,
  soloPlan: false,
  bath: false,
  noReservation: false,
};

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("soloScore");

  const results = useMemo(
    () => filterAndSort(campgrounds, filters, sort),
    [filters, sort]
  );

  return (
    <>
      {/* Hero */}
      <section className="px-4 py-10 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
          神奈川・静岡・山梨の<br className="sm:hidden" />
          <span className="text-blue-400">ソロキャンプ場</span>を探す
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          静か・絶景・コスパ・アクセス・設備の5軸スコアで比較。
          焚き火OK・ペット連れ・予約不要など条件を絞り込んで、
          自分だけの最高のサイトを見つけよう。
        </p>
      </section>

      <FilterBar
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        total={results.length}
      />

      <section className="max-w-4xl mx-auto px-4 py-6">
        {results.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-3">🏕</p>
            <p>条件に合うキャンプ場が見つかりませんでした。</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 text-blue-400 text-sm hover:underline"
            >
              フィルターをリセット
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((camp) => (
              <CampCard key={camp.id} camp={camp} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
