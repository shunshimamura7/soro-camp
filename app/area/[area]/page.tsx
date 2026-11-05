import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { evidenceBackedCampgrounds, filterByType } from "@/lib/camp";
import { PREF_SLUG } from "@/lib/prefs";
import { AREAS, areaKey } from "@/lib/areas";
import { SITE_URL } from "@/lib/site";
import CampCard from "@/components/CampCard";
import type { Campground } from "@/lib/types";

/**
 * エリア別の着地ページ（2026-11-05 新設。審査員8：「朝霧高原 ソロキャンプ」「道志 ソロキャンプ」を受けるページがなかった）。
 * 県別と同じく、料金を公式で確認できた施設を安い順、未確認は後ろ。5件未満のエリアは作らない。
 */
function campsOf(pref: string, name: string): Campground[] {
  return filterByType(
    evidenceBackedCampgrounds.filter((c) => c.prefecture === pref && areaKey(c.area) === name),
    "campground"
  ).sort((a, b) => {
    const pa = a.priceVerified === true && a.priceMin > 0 ? a.priceMin : Infinity;
    const pb = b.priceVerified === true && b.priceMin > 0 ? b.priceMin : Infinity;
    return pa - pb || a.name.localeCompare(b.name, "ja");
  });
}

export function generateStaticParams() {
  return AREAS.filter((a) => campsOf(a.pref, a.name).length >= 5).map((a) => ({ area: a.slug }));
}

function find(slug: string) {
  const a = AREAS.find((x) => x.slug === slug);
  if (!a) return null;
  const camps = campsOf(a.pref, a.name);
  return camps.length >= 5 ? { ...a, camps } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params;
  const a = find(area);
  if (!a) return {};
  const priced = a.camps.filter((c) => c.priceVerified === true && c.priceMin > 0);
  const min = priced.length ? Math.min(...priced.map((c) => c.priceMin)) : null;
  const title = `${a.name}（${a.pref}）のソロキャンプ場${a.camps.length}件【料金の安い順】`;
  const description = `${a.pref}・${a.name}のソロキャンプ場${a.camps.length}件。公式で確認したソロ1名1泊の料金が安い順${min !== null ? `（最安${min.toLocaleString()}円〜）` : ""}。チェックイン時刻・直火・バイクの可否も公式の原文つき。`;
  return {
    title,
    description,
    alternates: { canonical: `/area/${area}` },
    openGraph: { title, description, url: `${SITE_URL}/area/${area}`, images: ["/og.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const a = find(area);
  if (!a) notFound();
  const prefSlug = PREF_SLUG[a.pref];
  const priced = a.camps.filter((c) => c.priceVerified === true && c.priceMin > 0);
  const min = priced.length ? Math.min(...priced.map((c) => c.priceMin)) : null;
  const n = (fn: (c: Campground) => boolean) => a.camps.filter(fn).length;
  const others = AREAS.filter((x) => x.pref === a.pref && x.slug !== a.slug && find(x.slug));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "トップ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: `${a.pref}県のソロキャンプ場`, item: `${SITE_URL}/pref/${prefSlug}` },
        { "@type": "ListItem", position: 3, name: `${a.name}のソロキャンプ場`, item: `${SITE_URL}/area/${a.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${a.name}のソロキャンプ場（料金の安い順）`,
      numberOfItems: a.camps.length,
      itemListElement: a.camps.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/camp/${c.slug}`, name: c.name })),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-4 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="パンくずリスト" className="text-[13px] text-[#6b5d50] mb-2 flex gap-1 items-center">
        <Link href="/" className="inline-flex items-center min-h-[44px] pr-1 hover:text-[#b5440e]">トップ</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/pref/${prefSlug}`} className="inline-flex items-center min-h-[44px] px-1 hover:text-[#b5440e]">{a.pref}県</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{a.name}</span>
      </nav>
      <h1 className="text-[22px] sm:text-3xl font-bold text-[#1c1814] leading-tight">
        {a.name}のソロキャンプ場 {a.camps.length}件
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-[#4a3f35]">
        {a.pref}県・{a.name}。料金を公式で確認できたのは{priced.length}件
        {min !== null && <>（ソロ1名1泊の最安 <b className="text-[#1c1814]">{min.toLocaleString()}円〜</b>）</>}。
        場内に風呂{n((c) => c.features.bath === true)}件・
        チェックイン時刻が公式にある{n((c) => Boolean(c.officialFacts?.checkin))}件・
        直火OK（一部含む）{n((c) => ["可", "一部可"].includes(c.officialFacts?.jikabi?.status ?? ""))}件・
        バイクで利用可{n((c) => c.officialFacts?.bike?.status === "可")}件。
      </p>
      {others.length > 0 && (
        <nav aria-label={`${a.pref}県のほかのエリア`} className="mt-3 mb-5 flex flex-wrap gap-2">
          {others.map((x) => (
            <Link key={x.slug} href={`/area/${x.slug}`} className="inline-flex items-center min-h-[44px] px-3 rounded-xl border border-[#d8d0c6] bg-white text-[13px] font-semibold text-[#4a3f35] hover:border-[#b5440e]">
              {x.name}
            </Link>
          ))}
        </nav>
      )}
      <section aria-labelledby="area-list">
        <h2 id="area-list" className="text-[18px] font-bold text-[#1c1814] mb-3">料金の安い順</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {a.camps.map((c) => (
            <CampCard key={c.id} camp={c} headingLevel={3} />
          ))}
        </div>
      </section>
      <p className="mt-6">
        <Link href={`/pref/${prefSlug}`} className="inline-flex items-center min-h-[44px] text-[14px] font-semibold text-[#b5440e] underline hover:no-underline">
          {a.pref}県のソロキャンプ場をすべて見る
        </Link>
      </p>
    </div>
  );
}
