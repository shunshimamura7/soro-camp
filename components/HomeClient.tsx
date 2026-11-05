"use client";

import { useState, useMemo, useEffect, useRef, startTransition, useTransition } from "react";
import dynamic from "next/dynamic";
import { filterAndSort, filterByType, countByType, countMatching, DEFAULT_FILTERS, FEATURE_FILTER_KEYS } from "@/lib/camp-core";
import { PREF_SLUG, PREF_BY_SLUG } from "@/lib/prefs";
import Link from "next/link";
import type { Filters, SortKey, TypeTab } from "@/lib/camp-core";
import type { Campground } from "@/lib/types";
import FilterBar from "@/components/FilterBar";
import CampCard from "@/components/CampCard";
import TypeTabs from "@/components/TypeTabs";
import { useFavorites } from "@/components/FavoriteButton";

const MapModal = dynamic(() => import("@/components/MapModal"), { ssr: false });

/** 最初に描くカードの数と、スクロールで足す数（審査員9：404件一括描画で絞り込みが約1秒固まっていた） */
const PAGE = 40;

const QUICK_PREFS = ["神奈川", "静岡", "山梨", "千葉"];
type QuickKey = "bath" | "warmToilet" | "yearRound" | "firewood" | "priceChecked" | "budget" | "nightSafe" | "soloSite";
const QUICK_FEATURES: { key: QuickKey; label: string; patch?: Partial<Filters> }[] = [
  { key: "priceChecked", label: "料金を公式で確認済み" },
  { key: "soloSite", label: "ソロ専用サイト・ソロ料金" },
  { key: "budget", label: "¥2,000以下" },
  { key: "bath", label: "♨️ 風呂あり" },
  { key: "warmToilet", label: "温水洗浄トイレ" },
  { key: "firewood", label: "薪を買える" },
  { key: "yearRound", label: "冬も営業" },
  { key: "nightSafe", label: "夜も安心（公式に記載）" },
];
const quickBase = "shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-colors";
const quickOn = "bg-[#b5440e] border-[#b5440e] text-white";
const quickOff = "bg-white border-[#d8d0c6] text-[#1c1814] hover:border-[#b5440e]";

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
  /**
   * 野営地タブは絞り込みUIを出さないので、条件も効かせない（2026-11-05 審査員6：
   * キャンプ場側で「風呂あり」を選んだまま野営地へ切り替えると、原因の見えない0件になっていた）
   */
  const effectiveFilters = typeTab === "wild" ? DEFAULT_FILTERS : filters;
  const results = useMemo(() => filterAndSort(scopedCamps, effectiveFilters, sort), [scopedCamps, effectiveFilters, sort]);

  /** 県・目的チップの件数。描画のたびに全件を数え直さないよう、条件と母集団が変わったときだけ数える（審査員9） */
  const quickCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of QUICK_PREFS) m[p] = countMatching(scopedCamps, filters, { prefecture: p });
    for (const { key } of QUICK_FEATURES)
      m[key] = countMatching(scopedCamps, filters, key === "budget" ? { budgetMax: 2000 } : { [key]: true });
    return m;
  }, [scopedCamps, filters]);

  /**
   * 条件を URL に残す（2026-11-05 審査員10：「静岡・風呂あり・¥2,000以下」を共有・ブックマークできなかった）。
   * 読み込み時に復元し、変わったら replaceState で書き換える（履歴は増やさない）
   */
  const restored = useRef(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const next: Filters = { ...DEFAULT_FILTERS };
    const pref = q.get("pref");
    if (pref && PREF_BY_SLUG[pref]) next.prefecture = PREF_BY_SLUG[pref];
    for (const k of (q.get("f") ?? "").split(",")) if ((FEATURE_FILTER_KEYS as string[]).includes(k)) (next as Record<string, unknown>)[k] = true;
    const b = Number(q.get("budget"));
    if (b > 0) next.budgetMax = b;
    setFilters(next);
    if (q.get("sort") === "priceAsc") setSort("priceAsc");
    if (q.get("tab") === "wild") setTypeTab("wild");
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    const q = new URLSearchParams();
    if (typeTab === "wild") q.set("tab", "wild");
    const slug = PREF_SLUG[filters.prefecture as keyof typeof PREF_SLUG];
    if (slug) q.set("pref", slug);
    const on = FEATURE_FILTER_KEYS.filter((k) => filters[k]);
    if (on.length) q.set("f", on.join(","));
    if (filters.budgetMax !== null) q.set("budget", String(filters.budgetMax));
    if (sort !== "soloScore") q.set("sort", sort);
    const qs = q.toString();
    const url = qs ? `/?${qs}` : "/";
    if (url !== window.location.pathname + window.location.search) history.replaceState(null, "", url);
  }, [filters, sort, typeTab]);

  const [morePending, startMore] = useTransition();

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
    return countMatching(filterByType(pending, typeTab), effectiveFilters);
  }, [showEvidencePending, typeTab, effectiveFilters, pending]);

  const totalAll = backed.length + pending.length;
  const backedCamp = filterByType(backed, "campground").length;
  // 「料金を公式で確認」は金額が出ているものだけ（県別ページと同じ数え方。審査員7）
  const priceChecked = backed.filter((c) => c.type !== "wild" && c.priceVerified === true && c.priceMin > 0).length;
  const tabName = typeTab === "wild" ? "野営地" : "キャンプ場";
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
      {/* Hero（2026-11-05 2回目：短くし、違いを3点の帯で見せる。審査員5・10） */}
      <section className="px-4 md:px-8 pt-5 pb-3 sm:pt-8 sm:pb-4 text-center max-w-4xl mx-auto">
        <h1 className="text-[22px] sm:text-4xl font-bold leading-tight mb-2 text-[#1c1814]">
          神奈川・静岡・山梨・千葉の<br className="sm:hidden" />
          <span className="text-[#b5440e]">ソロキャンプ場</span>を探す
        </h1>
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[13px] sm:text-[14px] text-[#4a3f35] [text-wrap:balance]">
          <li><Link href="/about#price" className="underline decoration-[#d8c3ad] underline-offset-2 hover:text-[#b5440e]"><b className="text-[#1c1814]">ソロ1名1泊の総額</b>で比べる</Link></li>
          <li><Link href="/about#evidence" className="underline decoration-[#d8c3ad] underline-offset-2 hover:text-[#b5440e]">料金・設備は<b className="text-[#1c1814]">公式の原文つき</b></Link></li>
          <li><Link href="/about#unknown" className="underline decoration-[#d8c3ad] underline-offset-2 hover:text-[#b5440e]">分からないことは<b className="text-[#1c1814]">「未確認」</b>と書く</Link></li>
        </ul>
        <p className="mt-2 text-[12px] sm:text-[13px] text-[#6b5d50]">
          キャンプ場 <b className="text-[#1c1814]">{backedCamp}件</b>（料金を公式で確認 {priceChecked}件）・
          野営地 <b className="text-[#1c1814]">{filterByType(backed, "wild").length}件</b>
        </p>
      </section>

      {/* 種別タブ */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pb-2">
        <TypeTabs value={typeTab} onChange={(t) => startTransition(() => setTypeTab(t))} counts={typeCounts} />
      </section>

      {/*
        すぐ選べる入口（2026-11-05 審査員1・10）。県と、初めての人がよく選ぶ条件を1段に出す。
        押すと下の絞り込みと同じ条件が入る（判定は同じ countMatching / matchesFilters）
      */}
      {typeTab === "campground" && (
        <section className="max-w-4xl mx-auto px-4 md:px-8 pb-3" aria-label="すぐ選ぶ">
          {/* スマホでは県の段と目的の段を分ける（1段に並べると目的チップが画面外で気づかれなかった。審査員1・5・10） */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap [scrollbar-width:none]">
            {QUICK_PREFS.map((p) => {
              const on = filters.prefecture === p;
              return (
                <button key={p} type="button" aria-pressed={on}
                  onClick={() => onFiltersChange({ ...filters, prefecture: on ? "全部" : p })}
                  className={`${quickBase} ${on ? quickOn : quickOff}`}>
                  {on && <span aria-hidden="true">✓</span>}{p}
                  <span className="tabular-nums font-normal">{on ? results.length : quickCounts[p]}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_88%,transparent)] md:[mask-image:none]">
            {QUICK_FEATURES.map(({ key, label, patch }) => {
              const on = key === "budget" ? filters.budgetMax === 2000 : filters[key];
              const next = key === "budget" ? { budgetMax: on ? null : 2000 } : { [key]: !on };
              const n = quickCounts[key];
              if (!on && n === 0) return null;
              return (
                <button key={key} type="button" aria-pressed={on}
                  onClick={() => onFiltersChange({ ...filters, ...next, ...(on ? {} : patch) })}
                  className={`${quickBase} ${on ? quickOn : quickOff}`}>
                  {on && <span aria-hidden="true">✓</span>}{label}
                  <span className="tabular-nums font-normal">{n}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/*
        野営地タブではこだわり検索と予算を出さない。
        **野営地には料金が無く（無料開放）、風呂・売店・Wi-Fi といった設備も無い。**
      */}
      {typeTab === "wild" ? (
        <section className="max-w-4xl mx-auto px-4 md:px-8 pb-3">
          <div className="rounded-2xl border border-[#e3c6a6] bg-[#fdf3ea] p-4 sm:p-5">
            <h2 className="font-bold text-[15px] sm:text-[17px] text-[#1c1814] mb-1">この場所について</h2>
            <p className="text-[13px] sm:text-sm font-semibold text-[#7a4a10] mb-2">
              野営地は、管理人や受付がないことが多い自己責任の場所です。初めての一人キャンプなら「キャンプ場」をおすすめします。
            </p>
            <ul className="text-[13px] sm:text-sm leading-relaxed text-[#4a3f35] space-y-1.5 list-disc pl-5">
              <li><b>直火は原則できません。</b>焚き火台を使い、ゴミ・灰はすべて持ち帰ります。</li>
              <li><b>場所ごとに事情が違います。</b>受付のある時期・トイレの有無は各ページで確認してください。</li>
            </ul>
            <details className="mt-2 text-[13px] sm:text-sm text-[#4a3f35]">
              <summary className="min-h-[44px] flex items-center cursor-pointer font-semibold text-[#b5440e]">詳しく読む</summary>
              <ul className="leading-relaxed space-y-1.5 list-disc pl-5">
                <li>予約・料金・チェックインの仕組みがなく、設備も基本的にありません。照明や人目もないことが多いです。</li>
                <li><b>「公認なし」の場所が含まれます。</b>自治体や河川管理者が野営地として管理しているわけではなく、禁止されていないだけの場所です。</li>
                <li><b>増水・高波で状況が変わります。</b>河川敷は上流の雨でも急に増水します。危ないと思ったら引き返してください。</li>
                <li>掲載は場所と現地の制約を調べた記録で、公式発表ではありません。<b>現地の掲示が常に優先します。</b></li>
              </ul>
            </details>
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

      {/* 結果の見出し行：件数（読み上げ対象）・保存済み・比べる・地図を1行に（スマホで2段になっていた。審査員1・5） */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pt-3">
        <p className={onlyFavs ? "text-[15px] font-bold text-[#1c1814] mb-1" : "sr-only"} aria-live="polite">
          {tabName} {results.length}件{onlyFavs ? "（保存済み）" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startTransition(() => setOnlyFavs((v) => !v))}
            aria-pressed={onlyFavs}
            className={`shrink-0 inline-flex items-center gap-1 min-h-[44px] px-3 rounded-xl border text-[13px] font-semibold transition-colors ${
              onlyFavs ? "bg-[#b5440e] border-[#b5440e] text-white" : "bg-white border-[#d8d0c6] text-[#4a3f35] hover:border-[#b5440e]"
            }`}
          >
            <span aria-hidden="true">{onlyFavs ? "★" : "☆"}</span>保存 {favCount}
          </button>
          {favCount > 0 && (
            <Link href="/saved" className="shrink-0 inline-flex items-center min-h-[44px] px-3 rounded-xl border border-[#d8d0c6] bg-white text-[13px] font-semibold text-[#4a3f35] hover:border-[#b5440e]">
              比べる
            </Link>
          )}
          <button
            ref={mapButtonRef}
            type="button"
            onClick={() => setMapOpen(true)}
            onPointerEnter={() => void import("@/components/MapModal")}
            onFocus={() => void import("@/components/MapModal")}
            className="shrink-0 inline-flex items-center gap-1 min-h-[44px] px-3 rounded-xl border border-[#b5440e] bg-white text-[13px] font-semibold text-[#b5440e]"
          >
            <span aria-hidden="true">🗺</span>地図
          </button>
          {typeTab === "campground" && (
            <Link href="/about#sort" className="ml-auto inline-flex items-center min-h-[44px] text-[12px] text-[#6b5d50] underline underline-offset-2 hover:text-[#b5440e]">並び順とは</Link>
          )}
        </div>
      </section>

      {/* 一覧 */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-4 sm:py-6" aria-label={`${tabName}の一覧`}>
        {results.length === 0 ? (
          <div className="text-center py-16 text-[#4a3f35]">
            <p className="text-4xl mb-3" aria-hidden="true">🏕</p>
            <p>{onlyFavs && favCount === 0 ? "まだ保存したキャンプ場はありません。カードの「☆保存」で保存できます。" : `条件に合う${tabName}が見つかりませんでした。`}</p>
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
                  onClick={() => startMore(() => setLimit((n) => n + PAGE))}
                  aria-busy={morePending}
                  className="min-h-[44px] px-5 rounded-xl border border-[#b5440e] bg-white text-[#b5440e] text-sm font-semibold"
                >
                  {morePending ? "読み込み中…" : `もっと見る（残り${results.length - limit}件）`}
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
