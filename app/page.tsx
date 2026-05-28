"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { campgrounds, filterAndSort } from "@/lib/camp";
import type { Filters, SortKey } from "@/lib/camp";
import FilterBar from "@/components/FilterBar";
import CampCard from "@/components/CampCard";

const MapModal = dynamic(() => import("@/components/MapModal"), { ssr: false });

const DEFAULT_FILTERS: Filters = {
  prefecture: "全部",
  soloPlan: false,
  bath: false,
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
      <section className="px-3 sm:px-4 py-6 sm:py-10 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3 text-slate-900">
          神奈川・静岡・山梨の<br className="sm:hidden" />
          <span className="text-blue-500">ソロキャンプ場</span>を探す
        </h1>
        <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
          静か・絶景・コスパ・アクセス・設備の5軸スコアで比較。
          焚き火OK・予約不要など条件を絞り込んで、
          自分だけの最高のサイトを見つけよう。
        </p>
      </section>

      {/* Googleマップリンク */}
      <section className="max-w-4xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6">
        <a
          href="https://www.google.com/maps/search/キャンプ場/@35.3,138.65,9z"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#e8611f] border border-[#e8611f]/40 rounded-lg font-mono text-sm hover:bg-[#e8611f] hover:text-white transition-colors mb-6"
        >
          🗺 Googleマップでキャンプ場を探す
        </a>
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
      <section className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
