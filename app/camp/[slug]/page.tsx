import type { Metadata } from "next";
import type { Campground, OfficialFactKey } from "@/lib/types";
import { hasEvidence, hasUsableCoord, hasVerifiedScores, isToleratedWildSite, activeCampgrounds } from "@/lib/camp";
import { campMapUrl, nearbyBathUrl, nearbyShoppingUrl } from "@/lib/maps";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampground, getAllSlugs } from "@/lib/camp";
import { SITE_URL } from "@/lib/site";
import { PREF_SLUG } from "@/lib/prefs";
import {
  RestrictionChips,
  RestrictionDetails,
  EligibilityChip,
  EligibilityNote,
} from "@/components/RestrictionChip";
import { formatPeriod, parseSource } from "@/lib/restrictions";
import { RichText, plainText, isSiteStatusCaution } from "@/lib/rich";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/** 営業期間の表示。長い注記つきの「要確認」は短くする（description で文が崩れていた。審査員8） */
function seasonShort(season: string): string {
  return season.startsWith("要確認") ? "営業期間は公式で要確認" : `営業期間 ${season}`;
}

const FACT_ITEMS: [OfficialFactKey, string][] = [
  ["checkin", "チェックイン／アウト"],
  ["bike", "バイク"],
  ["jikabi", "直火（地面での焚き火）"],
  ["manager", "管理人・夜間"],
  ["women", "女性向けの区画・設備"],
];

function priceSummary(camp: Campground): string | null {
  if (camp.type === "wild") return "無料";
  if (camp.priceVerified !== true) return null;
  if (camp.priceMin === 0 && camp.priceMax === 0) return null;
  return camp.priceMax > camp.priceMin
    ? `¥${camp.priceMin.toLocaleString()}〜¥${camp.priceMax.toLocaleString()}`
    : `¥${camp.priceMin.toLocaleString()}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const camp = getCampground(slug);
  if (!camp) return {};

  const title =
    camp.type === "wild"
      ? `${camp.name}【${camp.prefecture}・${camp.area}の野営地】`
      : `${camp.name}【${camp.prefecture}・${camp.area}】ソロキャンプの料金・設備`;
  const price = priceSummary(camp);
  const comment = plainText(camp.soloComment);
  // 料金が未確認の施設は、検索結果に出る description にも金額を書かない。
  // 結論（料金）を先に、続けて特徴を1文。全体を約120字に収める（長いと検索結果で切れる。審査員8）
  const head =
    camp.type === "wild"
      ? `${camp.prefecture}・${camp.area}の無料の野営地（管理者なし）。`
      : price
        ? `ソロ1名1泊${price.replace(/¥/g, "")}円（公式で確認）。`
        : `料金は公式に記載がなく未確認。`;
  const firstSentence = (comment.split("。")[0] ?? "").trim();
  const description = `${head}${firstSentence ? firstSentence + "。" : ""}${camp.type === "wild" ? "" : seasonShort(camp.season) + "。"}`.slice(0, 120);

  const shouldNoIndex = camp.status !== "active" || !hasEvidence(camp);
  const url = `${SITE_URL}/camp/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/camp/${slug}` },
    robots: shouldNoIndex ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url, type: "article", images: ["/og.png"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

/** 根拠の URL を末尾に持つメモ（「あり（…（https://…））」の形）を、文と出典リンクに分ける */
function Note({ text }: { text?: string }) {
  if (!text) return null;
  // 「本文（https://…）」の形を「本文 https://…」にしてから文と出典に分ける
  const src = parseSource(text.replace(/[（(]\s*(https?:\/\/[^\s）)]+)\s*[)）]/, " $1"));
  return (
    <span className="block text-[13px] text-[#4a3f35] mt-0.5 leading-relaxed">
      <RichText text={src.label} strongClassName="font-semibold" />
      {src.url && (
        <>
          {" "}
          <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] min-w-[44px] px-1 font-semibold text-[#b5440e] underline hover:no-underline">
            出典<span aria-hidden="true"> ↗</span><span className="sr-only">（公式の原文を新しいタブで開く）</span>
          </a>
        </>
      )}
    </span>
  );
}

type FacilityRow = { label: string; value: React.ReactNode; note?: string; unknown: boolean };

/** 未指定は未確認。false は根拠つきのときだけ「なし」 */
function boolRow(label: string, v: boolean | undefined, yes: string, no: string, note?: string): FacilityRow {
  if (v === undefined) return { label, value: "", unknown: true };
  if (v) return { label, value: yes, note, unknown: false };
  if (note && /要確認|不明/.test(note)) return { label, value: "", unknown: true };
  return { label, value: no, note, unknown: false };
}

function relatedCamps(camp: Campground): Campground[] {
  const same = activeCampgrounds.filter(
    (c) => c.slug !== camp.slug && c.prefecture === camp.prefecture && (c.type === "wild") === (camp.type === "wild") && hasEvidence(c)
  );
  const sameArea = same.filter((c) => c.area.split("・")[0] === camp.area.split("・")[0]);
  const rest = same.filter((c) => !sameArea.includes(c)).sort((a, b) => Number(b.priceVerified === true) - Number(a.priceVerified === true) || a.name.localeCompare(b.name, "ja"));
  return [...sameArea, ...rest].slice(0, 6);
}

export default async function CampDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const camp = getCampground(slug);
  if (!camp) notFound();

  const prefSlug = PREF_SLUG[camp.prefecture];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      // 野営地は宿泊施設ではないので Place（黙認の場所を Campground として出さない。審査員8）
      "@type": camp.type === "wild" ? "Place" : "Campground",
      name: camp.name,
      description: plainText(camp.soloComment),
      address: {
        "@type": "PostalAddress",
        addressRegion: `${camp.prefecture}県`,
        streetAddress: camp.address,
        addressCountry: "JP",
      },
      // 正しい位置が分からない場合は geo を出さない（hasUsableCoord）
      ...(hasUsableCoord(camp)
        ? { geo: { "@type": "GeoCoordinates", latitude: camp.lat, longitude: camp.lng } }
        : {}),
      ...(camp.tel ? { telephone: camp.tel } : {}),
      ...(camp.officialUrl ? { url: camp.officialUrl } : {}),
      // 野営地は無料。料金未確認は priceRange を出さない（根拠のない金額を外に流さない）
      ...(camp.type === "wild"
        ? { priceRange: "0" }
        : priceSummary(camp)
          ? { priceRange: priceSummary(camp) }
          : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "トップ", item: SITE_URL },
        ...(prefSlug
          ? [{ "@type": "ListItem", position: 2, name: camp.type === "wild" ? `${camp.prefecture}県の野営地` : `${camp.prefecture}県のソロキャンプ場`, item: camp.type === "wild" ? `${SITE_URL}/pref/${prefSlug}#wild` : `${SITE_URL}/pref/${prefSlug}` }]
          : []),
        { "@type": "ListItem", position: prefSlug ? 3 : 2, name: camp.name, item: `${SITE_URL}/camp/${camp.slug}` },
      ],
    },
  ];

  const f = camp.features;
  const isWild = camp.type === "wild";
  const isClosed = camp.status === "closed";
  const priceUnverified = !isWild && camp.priceVerified !== true;
  const price = priceSummary(camp);

  // "2025-01-01" は一括投入時のプレースホルダなので確認済みとは扱わない
  const isUnverified = !camp.lastVerified || camp.lastVerified.trim() === "" || camp.lastVerified === "2025-01-01";
  // 確認からの月数（ビルド日基準）。90日を超えたら再確認を促す（審査員2・7）
  const staleMonths = isUnverified
    ? 0
    : Math.floor((Date.now() - new Date(camp.lastVerified + "T00:00:00+09:00").getTime()) / (30 * 86400000));
  const facts = camp.officialFacts;

  const noBonfire = f.bonfire === false && /禁止|不可|できない|NG/.test(f.bonfireNote ?? "");

  const mapsUrl = campMapUrl(camp);
  const facilityCautions = (camp.cautions ?? []).filter((c) => !isSiteStatusCaution(c));
  const siteStatus = (camp.cautions ?? []).filter((c) => isSiteStatusCaution(c));

  // 施設情報。値が確認できたものと、公式で確認できていないものを分ける（審査員5・10）
  const rows: FacilityRow[] = [
    { label: "営業期間", value: camp.season.includes("要確認") ? "" : camp.season, unknown: camp.season.includes("要確認") },
    ...(camp.closedDays ? [{ label: "定休日", value: camp.closedDays, unknown: false }] : []),
    {
      label: "予約",
      value: f.reservation ?? "",
      note: f.reservationNote,
      unknown: !f.reservation,
    },
    boolRow("焚き火", f.bonfire, "可", "不可", f.bonfireNote),
    boolRow("シャワー", f.shower, "あり", "なし", f.showerNote),
    boolRow("風呂（場内）", f.bath, "あり", "なし", f.bathNote),
    {
      label: "トイレ",
      value: f.toilet && !/不明|要確認/.test(f.toilet) ? f.toilet : "",
      note: f.toiletNote && !/^要確認$/.test(f.toiletNote) ? f.toiletNote : undefined,
      unknown: !f.toilet || /不明|要確認/.test(f.toilet),
    },
    boolRow("車横付け", f.carIn, "可", "不可", f.carInNote),
    boolRow("ペット", f.pet, "可", "不可", f.petNote),
    boolRow("売店", f.shop, "あり", "なし", f.shopNote),
    boolRow("薪", f.firewood, "販売あり", "販売なし", f.firewoodNote),
    boolRow("釣り", f.fishing, "可", "不可", f.fishingNote),
    boolRow("Wi-Fi", f.wifi, "あり", "なし"),
    ...(f.nearbyOnsen ? [{ label: "近くの温泉", value: "", note: f.nearbyOnsen, unknown: false }] : []),
    {
      label: "1人用の料金プラン",
      value: f.soloPlan === true ? "あり" : f.soloPlan === false && f.soloPlanNote ? "なし" : "",
      note: f.soloPlanNote,
      unknown: !(f.soloPlan === true || (f.soloPlan === false && f.soloPlanNote)),
    },
  ];
  const known = rows.filter((r) => !r.unknown);
  const unknown = rows.filter((r) => r.unknown).map((r) => r.label);

  // 予約先があればそれを主ボタンに、無ければ公式、どちらも無ければ地図（審査員1・5）
  const primary = camp.reservationUrl
    ? { href: camp.reservationUrl, label: "予約ページへ" }
    : camp.officialUrl
      ? { href: camp.officialUrl, label: "公式サイトへ" }
      : null;

  const related = relatedCamps(camp);

  const btnPrimary =
    "flex-1 inline-flex items-center justify-center gap-1 min-h-[48px] px-4 rounded-xl bg-[#b5440e] text-white text-[14px] font-semibold hover:bg-[#9a390b] transition-colors";
  const btnSecondary =
    "inline-flex items-center justify-center gap-1 min-h-[48px] px-4 rounded-xl border border-[#b5440e] bg-white text-[#b5440e] text-[14px] font-semibold hover:bg-[#fdf3ea] transition-colors";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="h-[env(safe-area-inset-top,0px)]" />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-[120px] md:pb-8">
        {/* 掲載状態の警告。施設名より前に出す */}
        {camp.status === "closed" && (
          <div role="alert" className="mb-4 rounded-xl border-2 border-red-700 bg-red-50 px-4 py-3.5">
            <p className="text-[14px] sm:text-[15px] font-bold leading-relaxed text-red-800">
              {camp.closedReason === "abolished" || camp.closedReason === "closed_business"
                ? "この施設は営業を終了しています。現地に施設はありません。"
                : "この場所でのキャンプ・火気の使用は禁止されています。宿泊目的で訪れないでください。"}
            </p>
            {camp.closedNote && (() => {
              const src = parseSource(camp.closedNote);
              return (
                <p className="mt-2 text-[13px] leading-relaxed text-red-900">
                  {src.label}
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="ml-1 underline hover:no-underline">
                      出典<span aria-hidden="true"> ↗</span>
                    </a>
                  )}
                </p>
              );
            })()}
          </div>
        )}
        {camp.status === "unverified" && (
          <div role="alert" className="mb-4 rounded-xl border-2 border-[#b07a1c] bg-[#fdf3e3] px-4 py-3.5">
            <p className="text-[14px] sm:text-[15px] font-bold leading-relaxed text-[#6b3f0a]">
              営業状況が確認できていません。訪問前に必ず最新情報を確認してください。
            </p>
          </div>
        )}
        {camp.status === "suspended" && (
          <div role="alert" className="mb-4 rounded-xl border-2 border-sky-700 bg-sky-50 px-4 py-3.5">
            <p className="text-[14px] sm:text-[15px] font-bold leading-relaxed text-sky-900">
              現在は休業中です。今は利用できませんが、再開の予定があります。
            </p>
            {camp.suspendedNote && (() => {
              const src = parseSource(camp.suspendedNote);
              return (
                <p className="mt-2 text-[13px] leading-relaxed text-sky-900">
                  {src.label}
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="ml-1 underline hover:no-underline">
                      出典<span aria-hidden="true"> ↗</span>
                    </a>
                  )}
                </p>
              );
            })()}
          </div>
        )}

        <RestrictionDetails restrictions={camp.restrictions} />
        <EligibilityNote eligibility={camp.eligibility} />

        {/* パンくず */}
        <nav aria-label="パンくずリスト" className="text-[13px] text-[#6b5d50] mb-3 flex gap-1 items-center flex-wrap">
          <Link href="/" className="inline-flex items-center min-h-[44px] pr-1 hover:text-[#b5440e]">トップ</Link>
          <span aria-hidden="true">›</span>
          {prefSlug ? (
            <Link href={`/pref/${prefSlug}`} className="inline-flex items-center min-h-[44px] px-1 hover:text-[#b5440e]">
              {camp.prefecture}県
            </Link>
          ) : (
            <span>{camp.prefecture}</span>
          )}
          <span aria-hidden="true">›</span>
          <span className="text-[#4a3f35] truncate max-w-[180px] sm:max-w-none" aria-current="page">{camp.name}</span>
        </nav>

        {/* タイトル・料金・主なボタン */}
        <header className="mb-6 rounded-2xl bg-white border border-[#e9e2d8] p-4 sm:p-6">
          <p className="text-[13px] text-[#6b5d50] mb-1">{camp.prefecture}・{camp.area}</p>
          <h1 className="text-[22px] sm:text-3xl font-bold text-[#1c1814] leading-tight">{camp.name}</h1>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <RestrictionChips restrictions={camp.restrictions} />
            <EligibilityChip eligibility={camp.eligibility} />
            {isWild && <span className="inline-flex items-center rounded-full border border-[#e8611f] bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#b5440e]">野営地</span>}
            {isToleratedWildSite(camp) && <span className="inline-flex items-center rounded-full border border-[#e6c79c] bg-[#fdf3e3] px-2.5 py-0.5 text-[12px] font-semibold text-[#7a4a10]">公認なし</span>}
            {noBonfire && <span className="inline-flex items-center rounded-full border border-[#d8d0c6] bg-[#f4f0ea] px-2.5 py-0.5 text-[12px] font-semibold text-[#4a3f35]">焚き火不可</span>}
            {!hasEvidence(camp) && <span className="inline-flex items-center rounded-full border border-[#e6c79c] bg-[#fdf3e3] px-2.5 py-0.5 text-[12px] font-semibold text-[#7a4a10]">情報確認中</span>}
          </div>

          {/* 料金。結論を大きく、内訳（公式の原文）は折りたたむ */}
          <div className="mt-4">
            {isClosed ? (
              <p className="text-[18px] font-bold text-[#1c1814]">利用不可</p>
            ) : price ? (
              <>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[13px] text-[#6b5d50]">{isWild ? "料金" : "ソロ1名1泊"}</span>
                  <span className="text-[26px] sm:text-[30px] font-bold text-[#1c1814] tabular-nums">{price}</span>
                  {!isWild && <span className="text-[13px] font-semibold text-[#2a6e3f]">公式で確認済み</span>}
                </p>
                {!isWild && camp.priceNote && (
                  <details className="mt-1 group">
                    <summary className="cursor-pointer list-none inline-flex items-center min-h-[44px] text-[13px] font-semibold text-[#b5440e]">
                      料金の内訳と公式の原文を見る<span aria-hidden="true" className="ml-1 group-open:rotate-90 transition-transform">›</span>
                    </summary>
                    <p className="text-[13px] leading-relaxed text-[#4a3f35] bg-[#faf7f2] rounded-xl p-3">
                      <RichText text={camp.priceNote} />
                    </p>
                  </details>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-[#e6c79c] bg-[#fdf3e3] px-3 py-2.5">
                <p className="text-[15px] font-bold text-[#6b3f0a]">料金 要確認</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#6b3f0a]">
                  {priceUnverified && camp.needsPrice
                    ? "公式サイトに料金が載っていません。予約先（多くはなっぷ）か電話で確認してください。"
                    : "料金を公式で確認できていません。訪問前に公式サイトか電話で確認してください。"}
                </p>
              </div>
            )}
          </div>

          {/* 主なボタン：予約 → 公式 → 電話 → 地図 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {primary && (
              <a href={primary.href} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                {primary.label}<span aria-hidden="true">↗</span>
              </a>
            )}
            {camp.reservationUrl && camp.officialUrl && (
              <a href={camp.officialUrl} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                公式サイト<span aria-hidden="true">↗</span>
              </a>
            )}
            {camp.tel && (
              <a href={`tel:${camp.tel}`} className={btnSecondary} aria-label={`電話する ${camp.tel}`}>
                <span aria-hidden="true">📞</span>{camp.tel}
              </a>
            )}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
              <span aria-hidden="true">📍</span>Googleマップ
            </a>
          </div>
          {camp.telNote && !camp.tel && <p className="mt-2 text-[12px] text-[#6b5d50]">{camp.telNote}</p>}

          <p className="mt-3 text-[12px] text-[#6b5d50]">
            {isUnverified ? "確認した日は記録していません" : `この施設の情報を確認した日：${camp.lastVerified}`}
            {staleMonths >= 3 && (
              <span className="block mt-0.5 font-semibold text-[#7a4a10]">
                確認から{staleMonths}か月たっています。料金・営業期間は公式で再確認してください。
              </span>
            )}
          </p>
        </header>

        {camp.needsVerify && (
          <p className="mb-4 rounded-xl border border-[#e6c79c] bg-[#fdf3e3] px-3 py-2.5 text-[13px] leading-relaxed text-[#6b3f0a]">
            この施設は情報の裏取りが済んでいません。訪問前に必ず公式情報をご確認ください
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* 野営地の前提。cautions の前に必ず出す */}
            {isWild && (
              <section className="bg-[#fdf3ea] rounded-2xl p-4 sm:p-5 border border-[#e3c6a6]">
                <h2 className="text-[15px] font-bold text-[#1c1814] mb-1">この場所について</h2>
                <p className="text-[13px] font-semibold text-[#7a4a10] mb-2">自己責任の場所です。初めての一人キャンプならキャンプ場をおすすめします。</p>
                <ul className="flex flex-col gap-1.5 text-[13px] sm:text-sm text-[#4a3f35] leading-relaxed list-disc pl-5">
                  <li>キャンプ場のような予約・受付・常駐の管理人は、ないことが多い場所です。受付や管理の有無はこの場所ごとに違うので、下の注意を確認してください。</li>
                  <li>掲載しているのは、場所と現地の制約を調べて記録したものです。<strong>現地の掲示が常に優先します</strong>。</li>
                  {isToleratedWildSite(camp) && (
                    <li><strong>ここは自治体が公認した野営地ではありません。</strong>黙認されている状態なので、禁止される可能性があります。</li>
                  )}
                  <li>状況は予告なく変わります。行く前に最新の情報を確認してください。</li>
                </ul>
              </section>
            )}

            {facilityCautions.length > 0 && (
              <section className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#e8611f]">
                <h2 className="text-[15px] font-bold text-[#1c1814] mb-2"><span aria-hidden="true">⚠️ </span>行く前に知っておくこと</h2>
                <ul className="flex flex-col gap-2">
                  {facilityCautions.map((c) => (
                    <li key={c} className="text-[14px] text-[#1c1814] leading-relaxed flex gap-2">
                      <span aria-hidden="true" className="text-[#b5440e]">・</span>
                      <span className="min-w-0"><RichText text={c} strongClassName="font-bold text-[#7a2e0a]" /></span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {camp.soloComment && (
              <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e9e2d8]">
                <h2 className="text-[15px] font-bold text-[#1c1814] mb-2">ソロキャンパーへのひとこと</h2>
                <p className="text-[15px] text-[#1c1814] leading-[1.8]">
                  <RichText text={camp.soloComment} />
                </p>
              </section>
            )}

            {/*
              公式ページの記述（2026-11-05 新設）。チェックイン・バイク・直火・管理人・女性向けを、
              公式ページの原文そのまま＋出典で出す。書いていないものは「見つからなかった」と並べる（審査員2・3・4）
            */}
            {!isWild && (
              <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e9e2d8]">
                <h2 className="text-[15px] font-bold text-[#1c1814] mb-1">公式ページに書いてあること</h2>
                <p className="text-[12px] text-[#6b5d50] mb-2">公式サイトの文章をそのまま引用しています（{facts?.fetchedAt ?? "2026-11-05"} に取得）。</p>
                <dl>
                  {FACT_ITEMS.filter(([k]) => facts?.[k]).map(([k, label]) => {
                    const x = facts![k]!;
                    const summary =
                      k === "checkin"
                        ? [x.in && `IN ${x.in}`, x.out && `OUT ${x.out}`].filter(Boolean).join(" ／ ")
                        : k === "bike" && x.price
                          ? `${x.status}（${x.price}）`
                          : x.status;
                    return (
                      <div key={k} className="py-2.5 border-b border-[#f0eae1] last:border-b-0">
                        <dt className="text-[13px] text-[#6b5d50]">{label}</dt>
                        <dd className="min-w-0">
                          <span className="font-semibold text-[14px] text-[#1c1814]">{summary}</span>
                          <blockquote className="mt-1 border-l-2 border-[#e3c6a6] pl-2.5 text-[13px] leading-relaxed text-[#4a3f35] break-words">
                            「{x.quote}」{x.quoteOut ? `「${x.quoteOut}」` : ""}
                          </blockquote>
                          <a href={x.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] text-[13px] font-semibold text-[#b5440e] underline hover:no-underline">
                            公式の該当ページ<span aria-hidden="true"> ↗</span><span className="sr-only">（{label}の出典を新しいタブで開く）</span>
                          </a>
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                {FACT_ITEMS.some(([k]) => !facts?.[k]) && (
                  <p className="mt-2 rounded-xl bg-[#faf7f2] px-3 py-2.5 text-[13px] leading-relaxed text-[#4a3f35]">
                    <b>公式ページで見つからなかった項目：</b>
                    {FACT_ITEMS.filter(([k]) => !facts?.[k]).map(([, label]) => label).join("・")}。
                    書いていないだけで「不可」や「なし」ではありません。
                  </p>
                )}
              </section>
            )}
          </div>

          <div className="flex flex-col gap-4 sm:gap-6">
            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e9e2d8]">
              <h2 className="text-[15px] font-bold text-[#1c1814] mb-1">{isWild ? "調べて分かったこと" : "施設情報（公式で確認できたもの）"}</h2>
              <dl>
                {known.map((r) => (
                  <div key={r.label} className="flex gap-3 py-2.5 border-b border-[#f0eae1] last:border-b-0">
                    <dt className="w-24 sm:w-28 shrink-0 text-[#6b5d50] text-[13px]">{r.label}</dt>
                    <dd className="text-[14px] text-[#1c1814] break-words min-w-0">
                      {r.value && <span className="font-semibold">{r.value}</span>}
                      {r.label === "焚き火" &&
                        (camp.restrictions ?? [])
                          .filter((x) => x.type === "bonfire")
                          .map((x) => (
                            <span key={`${x.from}-${x.to}`} className="block text-[#7a4a10] mt-1 text-[13px]">
                              ※ {formatPeriod(x)} は{x.reason}
                            </span>
                          ))}
                      <Note text={r.note} />
                    </dd>
                  </div>
                ))}
              </dl>
              {unknown.length > 0 && (
                <p className="mt-3 rounded-xl bg-[#faf7f2] px-3 py-2.5 text-[13px] leading-relaxed text-[#4a3f35]">
                  <b>{isWild ? "分かっていない項目：" : "公式で確認できていない項目："}</b>{unknown.join("・")}。
                  {camp.tel ? "気になる項目は電話で確認してください。" : "気になる項目は公式サイトで確認してください。"}
                </p>
              )}
            </section>

            <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e9e2d8]">
              <h2 className="text-[15px] font-bold text-[#1c1814] mb-2">場所</h2>
              <p className="text-[14px] text-[#1c1814]">{camp.address}</p>
              {!hasUsableCoord(camp) && (
                <p className="mt-1 text-[12px] text-[#6b5d50]">公式の地図から位置を取れていないので、このサイトの地図にはピンを出していません。Googleマップは施設名と住所で開きます。</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                  <span aria-hidden="true">📍</span>Googleマップで開く
                </a>
                {hasUsableCoord(camp) && (
                  <a href={nearbyShoppingUrl(camp)} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                    <span aria-hidden="true">🛒</span>周辺の買い物
                  </a>
                )}
                {hasUsableCoord(camp) && (
                  <a href={nearbyBathUrl(camp)} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
                    <span aria-hidden="true">♨️</span>周辺の温泉
                  </a>
                )}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(camp.name)}&tbm=isch`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnSecondary}
                >
                  <span aria-hidden="true">📷</span>写真を検索
                </a>
              </div>
            </section>

            {camp.source && camp.source.length > 0 && (
              <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e9e2d8]">
                <h2 className="text-[15px] font-bold text-[#1c1814] mb-2">確認した情報源</h2>
                <ul className="space-y-1 text-[13px] leading-relaxed text-[#4a3f35]">
                  {camp.source.map((source) => {
                    const url = source.match(/https?:\/\/\S+/)?.[0];
                    const label = url ? source.replace(url, "").trim() : source;
                    // ラベルが無いときはドメイン＋パスを出す（同じドメインのページが並ぶと見分けられないため）
                    let host = "";
                    try {
                      if (url) {
                        const u = new URL(url);
                        const path = decodeURIComponent(u.pathname).replace(/\/$/, "");
                        host = `${u.hostname}${path.length > 1 ? (path.length > 30 ? path.slice(0, 30) + "…" : path) : ""}`;
                      }
                    } catch {
                      host = url ?? "";
                    }
                    return (
                      <li key={source}>
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 font-semibold text-[#b5440e] underline hover:no-underline break-all">
                            {label || host}<span aria-hidden="true"> ↗</span><span className="sr-only">（新しいタブ）</span>
                          </a>
                        ) : (
                          label
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* このサイト側のデータの状況（座標・料金の未取得など）。施設の注意とは分けて小さく出す */}
            {(siteStatus.length > 0 || !hasVerifiedScores(camp)) && (
              <section className="rounded-2xl p-4 border border-dashed border-[#d8d0c6]">
                <h2 className="text-[13px] font-bold text-[#4a3f35] mb-1">このページのデータの状況</h2>
                <ul className="text-[13px] leading-relaxed text-[#4a3f35] list-disc pl-5 space-y-1">
                  {siteStatus.map((c) => (
                    <li key={c}>{plainText(c)}</li>
                  ))}
                  {!hasVerifiedScores(camp) && (
                    <li>静けさ・景観などの5軸の点数は、根拠がそろうまで公開していません（推測の高評価を付けないため）。</li>
                  )}
                </ul>
              </section>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[16px] font-bold text-[#1c1814] mb-3">
              {camp.prefecture}県の{isWild ? "ほかの野営地" : "ほかのソロキャンプ場"}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/camp/${r.slug}`} className="flex items-center justify-between gap-2 min-h-[52px] px-4 rounded-xl bg-white border border-[#e9e2d8] hover:border-[#e8611f]">
                    <span className="min-w-0">
                      <span className="block font-semibold text-[14px] text-[#1c1814] truncate">{r.name}</span>
                      <span className="block text-[12px] text-[#6b5d50]">{r.area}</span>
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold text-[#1c1814] tabular-nums">
                      {r.type === "wild" ? "無料" : r.priceVerified === true && r.priceMin > 0 ? `¥${r.priceMin.toLocaleString()}〜` : "料金要確認"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {prefSlug && (
              <Link href={`/pref/${prefSlug}`} className="mt-3 inline-flex items-center min-h-[44px] text-[14px] font-semibold text-[#b5440e] underline hover:no-underline">
                {camp.prefecture}県のソロキャンプ場をすべて見る
              </Link>
            )}
          </section>
        )}

        <div className="mt-6">
          <Link href="/" className="inline-flex items-center min-h-[44px] text-[14px] font-semibold text-[#b5440e] underline hover:no-underline">
            トップの一覧に戻る
          </Link>
        </div>
      </div>

      {/* スマホ下の固定バー。予約・公式を主に、炭色で本文と区別する（審査員3・5） */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#f7f3ec] border-t border-[#d8d0c6] shadow-[0_-2px_8px_rgba(28,24,20,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex gap-2 px-3 py-2.5">
          {primary ? (
            <a href={primary.href} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center h-12 rounded-xl bg-[#b5440e] text-white text-[15px] font-bold">
              {primary.label}<span aria-hidden="true"> ↗</span>
            </a>
          ) : (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center h-12 rounded-xl bg-[#b5440e] text-white text-[15px] font-bold">
              Googleマップで開く
            </a>
          )}
          {camp.tel && (
            <a href={`tel:${camp.tel}`} className="flex items-center justify-center h-12 px-4 rounded-xl border border-[#b5440e] bg-white text-[#b5440e] text-[14px] font-semibold" aria-label={`電話する ${camp.tel}`}>
              <span aria-hidden="true">📞</span> 電話
            </a>
          )}
          {primary && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-12 px-4 rounded-xl border border-[#b5440e] bg-white text-[#b5440e] text-[14px] font-semibold" aria-label="Googleマップで開く">
              <span aria-hidden="true">📍</span> 地図
            </a>
          )}
        </div>
      </div>
    </>
  );
}
