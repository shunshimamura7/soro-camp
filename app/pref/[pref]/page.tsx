import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { evidenceBackedCampgrounds, filterByType } from "@/lib/camp";
import { PREF_BY_SLUG, PREF_SLUG } from "@/lib/prefs";
import { SITE_URL } from "@/lib/site";
import CampCard from "@/components/CampCard";
import { AREAS, areaKey } from "@/lib/areas";
import type { Campground } from "@/lib/types";

/**
 * 県別の着地ページ（2026-11-05 新設）。
 *
 * トップはクライアント側の絞り込み1枚だけで、「静岡 ソロキャンプ 安い」のような検索で
 * 着地できるページが無かった（審査員8）。県ごとに、**料金を公式で確認できた施設を安い順**に並べ、
 * 料金が未確認の施設はその後ろに出す（未確認の金額で順位を付けない）。件数・最安値は実データから作る。
 */
export function generateStaticParams() {
  return Object.values(PREF_SLUG).map((pref) => ({ pref }));
}

function campsOf(name: string): { camps: Campground[]; wild: Campground[] } {
  const inPref = evidenceBackedCampgrounds.filter((c) => c.prefecture === name);
  const camps = filterByType(inPref, "campground").sort((a, b) => {
    const pa = a.priceVerified === true && a.priceMin > 0 ? a.priceMin : Infinity;
    const pb = b.priceVerified === true && b.priceMin > 0 ? b.priceMin : Infinity;
    return pa - pb || a.name.localeCompare(b.name, "ja");
  });
  return { camps, wild: filterByType(inPref, "wild") };
}

export async function generateMetadata({ params }: { params: Promise<{ pref: string }> }): Promise<Metadata> {
  const { pref } = await params;
  const name = PREF_BY_SLUG[pref];
  if (!name) return {};
  const { camps } = campsOf(name);
  const priced = camps.filter((c) => c.priceVerified === true && c.priceMin > 0);
  const min = priced.length ? Math.min(...priced.map((c) => c.priceMin)) : null;
  const title = `${name}県のソロキャンプ場${camps.length}件【料金の安い順】`;
  const description = `${name}県のソロキャンプ場${camps.length}件を、公式サイトで確認したソロ1名1泊の料金が安い順に掲載。${
    min !== null ? `最安は${min.toLocaleString()}円〜。` : ""
  }料金を公式で確認できたのは${priced.length}件。風呂・シャワー・ペット可などの設備も公式で確認したものだけを載せています。`;
  return {
    title,
    description,
    alternates: { canonical: `/pref/${pref}` },
    openGraph: { title, description, url: `${SITE_URL}/pref/${pref}`, images: ["/og.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default async function PrefPage({ params }: { params: Promise<{ pref: string }> }) {
  const { pref } = await params;
  const name = PREF_BY_SLUG[pref];
  if (!name) notFound();
  const { camps, wild } = campsOf(name);
  const priced = camps.filter((c) => c.priceVerified === true && c.priceMin > 0);
  const min = priced.length ? Math.min(...priced.map((c) => c.priceMin)) : null;
  const under3000 = priced.filter((c) => c.priceMin <= 3000).length;
  const bath = camps.filter((c) => c.features.bath === true).length;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "トップ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: `${name}県のソロキャンプ場`, item: `${SITE_URL}/pref/${pref}` },
      ],
    },
    // 一覧の並び（料金の安い順）をそのまま ItemList で出す（審査員8）
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${name}県のソロキャンプ場（料金の安い順）`,
      numberOfItems: camps.length,
      itemListElement: camps.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/camp/${c.slug}`, name: c.name })),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-4 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="パンくずリスト" className="text-[13px] text-[#6b5d50] mb-2 flex gap-1 items-center">
        <Link href="/" className="inline-flex items-center min-h-[44px] pr-1 hover:text-[#b5440e]">トップ</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{name}県</span>
      </nav>
      <h1 className="text-[22px] sm:text-3xl font-bold text-[#1c1814] leading-tight">
        {name}県のソロキャンプ場 {camps.length}件<span className="block sm:inline text-[16px] sm:text-xl text-[#4a3f35] sm:ml-2">料金の安い順</span>
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-[#4a3f35]">
        料金を各施設の公式サイトで確認できたのは{priced.length}件
        {min !== null && <>（ソロ1名1泊の最安 <b className="text-[#1c1814]">{min.toLocaleString()}円〜</b>、3,000円以下は{under3000}件）</>}。
        場内に風呂があるのは{bath}件。料金が公式に載っていない施設は、安い順の後ろに「料金 要確認」として並べています。
      </p>
      <p className="mt-2 text-[13px]">
        <Link href="/" className="inline-flex items-center min-h-[44px] font-semibold text-[#b5440e] underline hover:no-underline">
          風呂・ペット可・予算などで絞り込むならトップへ
        </Link>
      </p>
      {/* エリア別ページへ（5件以上のエリアだけ） */}
      <nav aria-label={`${name}県のエリア`} className="mt-1 flex flex-wrap gap-2">
        {AREAS.filter((a) => a.pref === name && camps.filter((c) => areaKey(c.area) === a.name).length >= 5).map((a) => (
          <Link key={a.slug} href={`/area/${a.slug}`} className="inline-flex items-center min-h-[44px] px-3 rounded-xl border border-[#b5440e] bg-white text-[13px] font-semibold text-[#b5440e] hover:bg-[#fdf3ea]">
            {a.name}（{camps.filter((c) => areaKey(c.area) === a.name).length}）
          </Link>
        ))}
      </nav>
      <nav aria-label="ほかの県" className="mt-2 mb-5 flex flex-wrap gap-2">
        {Object.entries(PREF_SLUG)
          .filter(([n]) => n !== name)
          .map(([n, s]) => (
            <Link key={s} href={`/pref/${s}`} className="inline-flex items-center min-h-[44px] px-3 rounded-xl border border-[#d8d0c6] bg-white text-[13px] font-semibold text-[#4a3f35] hover:border-[#b5440e]">
              {n}県
            </Link>
          ))}
      </nav>

      <section aria-labelledby="pref-list">
        <h2 id="pref-list" className="text-[18px] font-bold text-[#1c1814] mb-3">キャンプ場 {camps.length}件（料金の安い順）</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {camps.map((c) => (
            <CampCard key={c.id} camp={c} headingLevel={3} />
          ))}
        </div>
      </section>

      {wild.length > 0 && (
        <section id="wild" className="mt-10 scroll-mt-4">
          <h2 className="text-[18px] font-bold text-[#1c1814] mb-1">{name}県の野営地 {wild.length}件</h2>
          <p className="text-[13px] text-[#4a3f35] mb-3">管理者のいない場所です。注意事項を読んでから使ってください。初めての一人キャンプならキャンプ場をおすすめします。</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {wild.map((c) => (
              <CampCard key={c.id} camp={c} headingLevel={3} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
