"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { activeCampgrounds, evidenceBackedCampgrounds, evidencePendingCampgrounds, filterAndSort, filterByType, countByType, countMatching, DEFAULT_FILTERS } from "@/lib/camp";
import type { Filters, SortKey, TypeTab } from "@/lib/camp";
import FilterBar from "@/components/FilterBar";
import CampCard from "@/components/CampCard";
import TypeTabs from "@/components/TypeTabs";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const MapModal = dynamic(() => import("@/components/MapModal"), { ssr: false });

const ACTIVE_TOTAL = activeCampgrounds.length;
const CHIBA_COUNT = activeCampgrounds.filter((c) => c.prefecture === "千葉").length;
const EVIDENCE_BACKED_COUNT = evidenceBackedCampgrounds.length;
const EVIDENCE_PENDING_COUNT = evidencePendingCampgrounds.length;

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("soloScore");
  const [typeTab, setTypeTab] = useState<TypeTab>("all");
  const [mapOpen, setMapOpen] = useState(false);
  const [showEvidencePending, setShowEvidencePending] = useState(false);

  // 根拠URLのある施設を既定のおすすめと地図に使う。根拠不足は削除せず、明示的な切替時だけ表示する。
  const baseCamps = showEvidencePending ? activeCampgrounds : evidenceBackedCampgrounds;

  /**
   * 種別タブの件数。**いま表示できる母集団（baseCamps）から数える。**
   *
   * 以前は `activeCampgrounds` の全159件から数えていたので、既定表示（根拠URLのある128件）と
   * 食い違っていた。とくに野営地は **タブに 11 と出るのに一覧には 2件しか出ない**。
   * 11件のうち9件が根拠URLなしで、「情報確認中も表示」を押さないと出てこないため。
   *
   * 「押す前に見えていた数字」と「押した後に出てくる数」が違うのは、
   * 数字を見て判断した利用者を裏切る側の誤り。母集団を一本化して合わせる。
   */
  const typeCounts = useMemo(() => countByType(baseCamps), [baseCamps]);
  // タブで種別を絞ってから、既存のフィルター・ソートを適用する。
  // タブを切り替えても filters / sort は保持される。
  // こだわり条件を適用する前の母集団。フィルターバーの件数表示もこれを数える。
  // 表示中の一覧と同じ母集団を使わないと、ピルの数字と押した結果がずれる。
  const scopedCamps = useMemo(() => filterByType(baseCamps, typeTab), [baseCamps, typeTab]);
  const results = useMemo(
    () => filterAndSort(scopedCamps, filters, sort),
    [scopedCamps, filters, sort]
  );

  /**
   * いまの条件に合うが、根拠URLがないので隠れている件数。
   *
   * 0件になったとき「条件が悪い」のか「隠している側にある」のかは利用者には見えない。
   * 隠しているこちらしか知らないので、件数を出して切り替えを案内する。
   */
  const hiddenHits = useMemo(() => {
    if (showEvidencePending) return 0;
    return countMatching(filterByType(evidencePendingCampgrounds, typeTab), filters);
  }, [showEvidencePending, typeTab, filters]);

  return (
    <>
      {/* Hero */}
      <section className="px-4 md:px-8 py-6 sm:py-10 text-center max-w-4xl mx-auto">
        <h1 className="text-[22px] sm:text-4xl font-bold leading-tight mb-3 text-slate-900">
          神奈川・静岡・山梨・千葉の<br className="sm:hidden" />
          <span className="text-[#e8611f]">ソロキャンプ場</span>を探す
        </h1>
        <p className="text-slate-500 text-[13px] sm:text-base max-w-xl mx-auto">
          静か・絶景・コスパ・アクセス・設備の5軸と、情報の確認状況を見比べられます。
          予算・風呂・ペット可・売店など希望を組み合わせて、
          自分に合うサイトを見つけよう。
        </p>
        <p className="mt-3 text-xs sm:text-sm text-[#a54a20]">
          千葉県を追加。4県あわせて{ACTIVE_TOTAL}件を掲載中
          {CHIBA_COUNT > 0 && `（うち千葉県は${CHIBA_COUNT}件）`}。
          <span className="block mt-1 text-slate-500">
            いま表示しているのは、情報源を確認できた{EVIDENCE_BACKED_COUNT}件です。
          </span>
        </p>
      </section>

      {/* 根拠URLの有無で、通常のおすすめと確認中情報を分ける */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pb-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            {showEvidencePending
              ? `情報確認中の施設を含む全${ACTIVE_TOTAL}件を表示中です。料金・位置・営業状況は訪問前に必ず確認してください。`
              : `公式・予約などの情報源を確認できた${EVIDENCE_BACKED_COUNT}件を表示中です。`}
          </p>
          <button
            onClick={() => setShowEvidencePending((value) => !value)}
            className="shrink-0 min-h-[40px] rounded-xl border border-[#e8611f]/40 bg-white px-3 text-xs font-semibold text-[#c84f18] hover:bg-[#fff5ef] transition-colors"
          >
            {showEvidencePending ? "根拠ありのみ表示" : `情報確認中の${EVIDENCE_PENDING_COUNT}件も表示`}
          </button>
        </div>
      </section>

      {/* 種別タブ — 見出しの直下、フィルターバーより上 */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pb-4 sm:pb-6">
        <TypeTabs value={typeTab} onChange={setTypeTab} counts={typeCounts} />
      </section>

      {/* 希望条件を選んでから、地図・一覧の結果を見る */}
      <FilterBar
        filters={filters}
        sort={sort}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        total={results.length}
        camps={scopedCamps}
        onMapOpen={() => setMapOpen(true)}
      />

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

      {/* キャンプ場リスト */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-4 sm:py-6">
        {/* 野営地タブのときだけ出す注意書き */}
        {typeTab === "wild" && (
          <p className="mb-4 rounded-xl border border-[#e8611f] bg-white px-3 py-2.5 text-[12px] sm:text-[13px] leading-relaxed text-[#e8611f]">
            野営地には管理者・受付・公式サイトがありません。掲載しているのは、
            場所と現地の制約を調べて記録したものです。施設の公式発表ではないので、
            <strong>現地の掲示が常に優先します</strong>。
            <span className="mt-1 block">
              「公認なし」と付いているものは、自治体が公認した野営地ではなく黙認されている場所です。
              禁止される可能性があります。直火の可否・増水・開放状況は必ず事前に確認してください。
            </span>
          </p>
        )}

        {results.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-4xl mb-3">🏕</p>
            <p>条件に合うキャンプ場が見つかりませんでした。</p>
            {/* 隠している側に該当があるなら、それを知らせてから条件を疑わせる */}
            {hiddenHits > 0 && (
              <p className="mt-3 text-[13px] leading-relaxed">
                情報確認中の施設には{hiddenHits}件あります。
                <button
                  onClick={() => setShowEvidencePending(true)}
                  className="ml-1 font-semibold text-[#c84f18] underline hover:no-underline"
                >
                  含めて表示する
                </button>
              </p>
            )}
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
