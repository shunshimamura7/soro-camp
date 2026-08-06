"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { campgrounds, filterAndSort, filterByType } from "@/lib/camp";
import type { Filters, SortKey, TypeTab } from "@/lib/camp";
import FilterBar from "@/components/FilterBar";
import CampCard from "@/components/CampCard";
import TypeTabs from "@/components/TypeTabs";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const MapModal = dynamic(() => import("@/components/MapModal"), { ssr: false });

const DEFAULT_FILTERS: Filters = {
  prefecture: "全部",
  soloPlan: false,
  bath: false,
  shower: false,
  noReservation: false,
  bonfire: false,
};

// タブの件数はフィルターと無関係に「その種別が全部で何件あるか」を示す
const TYPE_COUNTS = {
  all: campgrounds.length,
  campground: campgrounds.filter((c) => c.type !== "wild").length,
  wild: campgrounds.filter((c) => c.type === "wild").length,
};

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("soloScore");
  const [typeTab, setTypeTab] = useState<TypeTab>("all");
  const [mapOpen, setMapOpen] = useState(false);

  // タブで種別を絞ってから、既存のフィルター・ソートを適用する。
  // タブを切り替えても filters / sort は保持される。
  const results = useMemo(
    () => filterAndSort(filterByType(campgrounds, typeTab), filters, sort),
    [typeTab, filters, sort]
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

      {/* 種別タブ — 見出しの直下、フィルターバーより上 */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pb-4 sm:pb-6">
        <TypeTabs value={typeTab} onChange={setTypeTab} counts={TYPE_COUNTS} />
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
        {/* 野営地タブのときだけ出す注意書き */}
        {typeTab === "wild" && (
          <p className="mb-4 rounded-xl border border-[#e8611f] bg-white px-3 py-2.5 text-[12px] sm:text-[13px] leading-relaxed text-[#e8611f]">
            野営地は管理者不在・設備なしの場所を含みます。
            直火の可否・現在の開放状況は必ず事前に確認してください。
          </p>
        )}

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
              <CampCard key={camp.id} camp={camp} bathFilterActive={filters.bath} />
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
