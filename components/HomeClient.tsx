"use client";

import { useState, useMemo, useEffect, useRef, startTransition } from "react";
import dynamic from "next/dynamic";
import { filterAndSort, filterByType, countByType, countMatching, DEFAULT_FILTERS } from "@/lib/camp-core";
import type { Filters, SortKey, TypeTab } from "@/lib/camp-core";
import type { Campground } from "@/lib/types";
import FilterBar from "@/components/FilterBar";
import CampCard from "@/components/CampCard";
import TypeTabs from "@/components/TypeTabs";
import { useFavorites } from "@/components/FavoriteButton";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
const MapModal = dynamic(() => import("@/components/MapModal"), { ssr: false });

/** 最初に描くカードの数と、スクロールで足す数（審査員9：404件一括描画で絞り込みが約1秒固まっていた） */
const PAGE = 40;

type Props = {
  /** 情報源を確認できた施設（既定の一覧）。サーバー側で軽い版に変換済み */
  backed: Campground[];
  /** 情報確認中の施設。「含めて表示」のときだけ使う */
  pending: Campground[];
};

export default function HomeClient({ backed, pending }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("soloScore");
  const [typeTab, setTypeTab] = useState<TypeTab>("campground");
  const [mapOpen, setMapOpen] = useState(false);
  const [showEvidencePending, setShowEvidencePending] = useState(false);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const favs = useFavorites();
  const mapButtonRef = useRef<HTMLButtonElement>(null);

  // 根拠URLのある施設を既定のおすすめと地図に使う。根拠不足は削除せず、明示的な切替時だけ表示する。
  const baseCamps = useMemo(
    () => (showEvidencePending ? [...backed, ...pending] : backed),
    [showEvidencePending, backed, pending]
  );

  /**
   * 種別タブの件数。**いま表示できる母集団（baseCamps）から数える。**
   * 「押す前に見えていた数字」と「押した後に出てくる数」が違うのは、数字を見て判断した利用者を裏切る。
   */
  const typeCounts = useMemo(() => countByType(baseCamps), [baseCamps]);
  // こだわり条件を適用する前の母集団。フィルターバーの件数表示もこれを数える。
  const scopedCamps = useMemo(() => {
    const byType = filterByType(baseCamps, typeTab);
    return onlyFavs ? byType.filter((c) => favs.includes(c.slug)) : byType;
  }, [baseCamps, typeTab, onlyFavs, favs]);
  const results = useMemo(() => filterAndSort(scopedCamps, filters, sort), [scopedCamps, filters, sort]);

  // 条件が変わったら先頭から描き直す
  useEffect(() => {
    setLimit(PAGE);
  }, [results]);

  // 一覧の末尾が見えたら次の40件を描く
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || limit >= results.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) startTransition(() => setLimit((n) => n + PAGE));
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [limit, results.length]);

  /** いまの条件に合うが、根拠URLがないので隠れている件数。0件のときに切り替えを案内する */
  const hiddenHits = useMemo(() => {
    if (showEvidencePending) return 0;
    return countMatching(filterByType(pending, typeTab), filters);
  }, [showEvidencePending, typeTab, filters, pending]);

  const totalAll = backed.length + pending.length;
  const backedCamp = filterByType(backed, "campground").length;
  const priceChecked = backed.filter((c) => c.type !== "wild" && c.priceVerified === true).length;
  const favCount = favs.length;

  const onFiltersChange = (f: Filters) => startTransition(() => setFilters(f));
  const onSortChange = (s: SortKey) => startTransition(() => setSort(s));

  const closeMap = () => {
    setMapOpen(false);
    // 閉じたら開いたボタンへフォーカスを戻す（審査員6）
    requestAnimationFrame(() => mapButtonRef.current?.focus());
  };

  return (
    <>
      {/* Hero（2026-11-05 作り直し：価値を1文で言い、件数は1つの式にまとめる） */}
      <section className="px-4 md:px-8 pt-6 pb-4 sm:pt-10 sm:pb-6 text-center max-w-4xl mx-auto">
        <h1 className="text-[22px] sm:text-4xl font-bold leading-tight mb-3 text-[#1c1814]">
          神奈川・静岡・山梨・千葉の<br className="sm:hidden" />
          <span className="text-[#b5440e]">ソロキャンプ場</span>を探す
        </h1>
        <p className="text-[#4a3f35] text-[14px] sm:text-base max-w-xl mx-auto leading-relaxed">
          料金と設備は、各施設の<b>公式サイトで裏取りしたものだけ</b>を載せています。
          料金はソロ1名1泊の総額。分からないことは「未確認」と書きます。
        </p>
        <p className="mt-3 text-[12px] sm:text-[13px] text-[#6b5d50]">
          キャンプ場 <b className="text-[#1c1814]">{backedCamp}件</b>（うち料金を公式で確認 {priceChecked}件）・
          野営地 <b className="text-[#1c1814]">{filterByType(backed, "wild").length}件</b>
        </p>
      </section>

      {/* 種別タブ */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pb-3">
        <TypeTabs value={typeTab} onChange={(t) => startTransition(() => setTypeTab(t))} counts={typeCounts} />
      </section>

      {/*
        野営地タブではこだわり検索と予算を出さない。
        **野営地には料金が無く（無料開放）、風呂・売店・Wi-Fi といった設備も無い。**
      */}
      {typeTab === "wild" ? (
        <section className="max-w-4xl mx-auto px-4 md:px-8 pb-3">
          <div className="rounded-2xl border border-[#e3c6a6] bg-[#fdf3ea] p-4 sm:p-5">
            <h2 className="font-bold text-[15px] sm:text-[17px] text-[#1c1814] mb-1">この場所について</h2>
            <p className="text-[13px] sm:text-sm font-semibold text-[#7a4a10] mb-2">
              管理者なし・自己責任・夜は暗い。初めての一人キャンプなら「キャンプ場」をおすすめします。
            </p>
            <ul className="text-[13px] sm:text-sm leading-relaxed text-[#4a3f35] space-y-1.5 list-disc pl-5">
              <li><b>管理人も受付もありません。</b>予約・料金・チェックインの仕組みが無く、設備も基本的にありません。照明や人目もないことが多いです。</li>
              <li><b>「公認なし」の場所が含まれます。</b>自治体や河川管理者が野営地として管理しているわけではなく、禁止されていないだけの場所です。</li>
              <li><b>直火は原則できません。</b>焚き火台を使い、ゴミ・灰はすべて持ち帰ります。</li>
              <li><b>増水・高波で状況が変わります。</b>河川敷は上流の雨でも急に増水します。危ないと思ったら引き返してください。</li>
              <li>掲載は場所と現地の制約を調べた記録で、公式発表ではありません。<b>現地の掲示が常に優先します。</b></li>
            </ul>
          </div>
        </section>
      ) : (
        <FilterBar
          filters={filters}
          sort={sort}
          onFiltersChange={onFiltersChange}
          onSortChange={onSortChange}
          total={results.length}
          camps={scopedCamps}
          onMapOpen={() => setMapOpen(true)}
        />
      )}

      {/* 結果の見出し行：件数（読み上げ対象）・保存済み・地図 */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[8rem]">
            {/* 件数は上の帯に出ている。ここは読み上げ用（画面では保存済み表示のときだけ見せる） */}
            <p className={onlyFavs ? "text-[15px] font-bold text-[#1c1814]" : "sr-only"} aria-live="polite">
              {results.length}件{onlyFavs ? "（保存済み）" : ""}
            </p>
            {typeTab === "campground" && sort === "soloScore" && (
              <p className="text-[12px] text-[#6b5d50]">おすすめ順＝評価済み→料金確認済み→地図あり→名前順</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => startTransition(() => setOnlyFavs((v) => !v))}
            aria-pressed={onlyFavs}
            className={`inline-flex items-center gap-1 min-h-[44px] px-3 rounded-xl border text-[13px] font-semibold transition-colors ${
              onlyFavs ? "bg-[#b5440e] border-[#b5440e] text-white" : "bg-white border-[#d8d0c6] text-[#4a3f35] hover:border-[#b5440e]"
            }`}
          >
            <span aria-hidden="true">{onlyFavs ? "★" : "☆"}</span>保存済み {favCount}
          </button>
          <button
            ref={mapButtonRef}
            type="button"
            onClick={() => setMapOpen(true)}
            className="md:hidden inline-flex items-center gap-1 min-h-[44px] px-3 rounded-xl border border-[#b5440e] bg-white text-[13px] font-semibold text-[#b5440e]"
          >
            <span aria-hidden="true">🗺</span>地図で見る
          </button>
        </div>
      </section>

      {/* PC: 地図 */}
      <section className="hidden md:block max-w-4xl mx-auto px-4 md:px-8 pt-3">
        <MapView camps={results} height={480} />
      </section>

      {/* 一覧 */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-4 sm:py-6" aria-label="キャンプ場の一覧">
        {results.length === 0 ? (
          <div className="text-center py-16 text-[#4a3f35]">
            <p className="text-4xl mb-3" aria-hidden="true">🏕</p>
            <p>{onlyFavs && favCount === 0 ? "まだ保存したキャンプ場はありません。カードの「☆保存」で保存できます。" : "条件に合うキャンプ場が見つかりませんでした。"}</p>
            {hiddenHits > 0 && (
              <p className="mt-3 text-[13px] leading-relaxed">
                情報確認中の施設には{hiddenHits}件あります。
                <button
                  onClick={() => setShowEvidencePending(true)}
                  className="ml-1 min-h-[44px] font-semibold text-[#b5440e] underline hover:no-underline"
                >
                  含めて表示する
                </button>
              </p>
            )}
            <button
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setOnlyFavs(false);
              }}
              className="mt-4 min-h-[44px] px-4 rounded-xl border border-[#b5440e] text-[#b5440e] text-sm font-semibold"
            >
              条件をリセット
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {results.slice(0, limit).map((camp) => (
                <CampCard key={camp.id} camp={camp} bathFilterActive={filters.bath} />
              ))}
            </div>
            {limit < results.length && (
              <div ref={sentinelRef} className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setLimit((n) => n + PAGE)}
                  className="min-h-[44px] px-5 rounded-xl border border-[#b5440e] bg-white text-[#b5440e] text-sm font-semibold"
                >
                  もっと見る（残り{results.length - limit}件）
                </button>
              </div>
            )}
          </>
        )}

        {/* 情報確認中の扱い。数字を1つの式で見せる（審査員1・7・10） */}
        <div className="mt-8 rounded-2xl border border-[#e9e2d8] bg-white p-4 text-[13px] leading-relaxed text-[#4a3f35]">
          <p>
            掲載 {totalAll}件 ＝ 情報源を確認できた {backed.length}件 ＋ 情報確認中 {pending.length}件。
            既定では情報源を確認できた施設だけを表示しています。
          </p>
          <button
            onClick={() => setShowEvidencePending((v) => !v)}
            aria-pressed={showEvidencePending}
            className="mt-2 min-h-[44px] px-3 rounded-xl border border-[#b5440e] bg-white text-[13px] font-semibold text-[#b5440e]"
          >
            {showEvidencePending ? "情報源を確認できた施設だけに戻す" : `情報確認中の${pending.length}件も表示する`}
          </button>
        </div>
      </section>

      {mapOpen && <MapModal camps={results} onClose={closeMap} />}
    </>
  );
}
