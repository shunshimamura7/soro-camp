"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { campgrounds, filterAndSort } from "@/lib/camp";
import type { Filters, SortKey } from "@/lib/camp";
import FilterBar from "@/components/FilterBar";
import CampCard from "@/components/CampCard";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const MapModal = dynamic(() => import("@/components/MapModal"), { ssr: false });

const DEFAULT_FILTERS: Filters = {
  prefecture: "全部",
  soloPlan: false,
  bath: false,
  shower: false,
  noReservation: false,
};

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("soloScore");
  const [mapOpen, setMapOpen] = useState(false);

  const results = useMemo(
    () => filterAndSort(campgrounds, filters, sort),
    [filters, sort]
  );

  return (
    <>
      {/* Hero */}
      <section className="px-4 md:px-8 py-6 sm:py-10 text-center max-w-4xl mx-auto">
        <h1 className="text-[22px] sm:text-4xl font-bold leading-tight mb-3 text-slate-900">
          神奈川・静岡・山梨の<br className="sm:hidden" />
          <span className="text-[#e8611f]">ソロキャンプ場</span>を探す
        </h1>
        <p className="text-slate-500 text-[13px] sm:text-base max-w-xl mx-auto">
          静か・絶景・コスパ・アクセス・設備の5軸スコアで比較。
          焚き火OK・予約不要など条件を絞り込んで、
          自分だけの最高のサイトを見つけよう。
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-8 pb-4 sm:pb-6">
        {/* PC only: 地図表示 */}
        <div className="hidden md:block">
          <MapView camps={results} height={520} />
        </div>
        {/* スマホ: フルWidth ember ボタン */}
        <div className="block md:hidden">
          <button
            onClick={() => setMapOpen(true)}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] bg-[#e8611f] text-white rounded-xl font-semibold text-sm hover:bg-[#d0551a] transition-colors"
          >
            🗺 地図で見る
          </button>
        </div>
      </section>

      {/* フィルターバー（「地図で見る」ボタン付き） */}
      <FilterBar
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        total={results.length}
        onMapOpen={() => setMapOpen(true)}
      />

      {/* キャンプ場リスト */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-4 sm:py-6">
        {results.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-4xl mb-3">🏕</p>
            <p>条件に合うキャンプ場が見つかりませんでした。</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 text-blue-500 text-sm hover:underline"
            >
              フィルターをリセット
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {results.map((camp) => (
              <CampCard key={camp.id} camp={camp} />
            ))}
          </div>
        )}
      </section>

      {/* 全画面地図モーダル */}
      {mapOpen && (
        <MapModal
          camps={results}
          onClose={() => setMapOpen(false)}
        />
      )}
    </>
  );
}
