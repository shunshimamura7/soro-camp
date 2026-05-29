import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampground, getAllSlugs } from "@/lib/camp";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://soro-camp.vercel.app";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const camp = getCampground(slug);
  if (!camp) return {};

  const title = `${camp.name}【${camp.prefecture}・${camp.area}】`;
  const description = `${camp.soloComment} 最安値${camp.priceMin.toLocaleString()}円〜。${camp.season}営業。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/camp/${slug}`,
      type: "article",
    },
  };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100">
      <span className="w-24 sm:w-28 shrink-0 text-slate-500 text-xs sm:text-sm">{label}</span>
      <span className="text-xs sm:text-sm text-slate-700 break-words min-w-0">{value}</span>
    </div>
  );
}

export default async function CampDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const camp = getCampground(slug);
  if (!camp) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Campground",
    name: camp.name,
    description: camp.soloComment,
    address: {
      "@type": "PostalAddress",
      addressLocality: camp.area,
      addressRegion: camp.prefecture,
      streetAddress: camp.address,
      addressCountry: "JP",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: camp.lat,
      longitude: camp.lng,
    },
    ...(camp.tel ? { telephone: camp.tel } : {}),
    ...(camp.officialUrl ? { url: camp.officialUrl } : {}),
    priceRange: `¥${camp.priceMin.toLocaleString()}〜¥${camp.priceMax.toLocaleString()}`,
  };

  const f = camp.features;

  const featureBadges: Array<[string, string]> = [];
  if (f.bath)     featureBadges.push(["bath",    "♨️ 風呂"]);
  if (f.shower)   featureBadges.push(["shower",  "🚿 シャワー"]);
  if (f.carIn)    featureBadges.push(["carIn",   "🚗 車横付け"]);
  if (f.wifi)     featureBadges.push(["wifi",    "📶 Wi-Fi"]);
  if (f.bonfire)  featureBadges.push(["bonfire", "🔥 焚き火"]);
  if (f.firewood) featureBadges.push(["firewood","🪵 薪販売"]);
  if (f.shop)     featureBadges.push(["shop",    "🏪 売店"]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    camp.name + " " + (camp.address ?? "")
  )}`;

  // ?q= パラメータ形式：Google Maps が文字列全体を検索クエリとして扱い、
  // キャンプ場名が検索バーに確実に表示される。
  // path 形式（/search/QUERY/@lat,lng）だと先頭のキャンプ場名を POI と判定して
  // 検索バーに表示されないため、こちらの形式を採用。
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Safe-area spacer — active when viewport-fit=cover */}
      <div className="h-[env(safe-area-inset-top,0px)]" />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-[96px] md:pb-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-4 flex gap-1 items-center flex-wrap">
          <Link href="/" className="hover:text-slate-700">← 一覧</Link>
          <span>›</span>
          <span>{camp.prefecture}</span>
          <span>›</span>
          <span className="text-slate-700 truncate max-w-[180px] sm:max-w-none">{camp.name}</span>
        </nav>

        {/* Title */}
        <div className="mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm text-slate-500 mb-1">{camp.prefecture} · {camp.area}</p>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 leading-tight">{camp.name}</h1>
          <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
            <span className="text-green-600 font-bold text-sm sm:text-base">¥{camp.priceMin.toLocaleString()}〜</span>
            <span className="text-slate-500 text-xs sm:text-sm">{camp.season}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Comment */}
            <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-2">ソロキャンパーへのコメント</h2>
              <p className="text-[15px] text-slate-600 leading-[1.8] tracking-[0.02em]">{camp.soloComment}</p>
            </section>

            {/* Feature badges — 2 col grid, 44px tap targets */}
            {featureBadges.length > 0 && (
              <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100">
                <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-3">設備・特徴</h2>
                <div className="grid grid-cols-2 gap-2">
                  {featureBadges.map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center min-h-[44px] px-3 bg-white rounded-xl text-[13px] font-medium text-[#5a4a3a] border border-[#e2ddd8]"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Action links — full-height buttons for easy tapping */}
            <div className="flex flex-col gap-2">
              {camp.officialUrl && (
                <a
                  href={camp.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center min-h-[52px] gap-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  公式サイトを見る ↗
                </a>
              )}
              {camp.reservationUrl && (
                <a
                  href={camp.reservationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center min-h-[52px] gap-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  予約ページへ ↗
                </a>
              )}
              {camp.tel && (
                <a
                  href={`tel:${camp.tel}`}
                  className="flex items-center justify-center min-h-[52px] gap-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  📞 {camp.tel}
                </a>
              )}
              {camp.telNote && !camp.tel && (
                <p className="text-xs text-slate-500 text-center py-2">{camp.telNote}</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Map */}
            <section>
              <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-2">アクセスマップ</h2>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(camp.name + ' ' + (camp.address ?? ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#e8611f] border border-[#e8611f]/40 rounded-lg font-mono text-sm hover:bg-[#e8611f] hover:text-white transition-colors"
                >
                  📍 Googleマップで開く
                </a>
                <a
                  href={`https://www.google.com/maps/search/スーパーマーケット+精肉店+鮮魚店+スーパー銭湯+銭湯/@${camp.lat},${camp.lng},11z`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 border border-slate-300 rounded-lg font-mono text-sm hover:bg-slate-100 transition-colors"
                >
                  🛒 周辺施設を探す
                </a>
              </div>
              <p className="text-xs text-slate-500 mt-2">📍 {camp.address}</p>
            </section>

            {/* Facility details */}
            <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-1">施設情報</h2>
              <div>
                <Row label="料金" value={`¥${camp.priceMin.toLocaleString()}〜¥${camp.priceMax.toLocaleString()}${camp.priceNote ? `（${camp.priceNote}）` : ""}`} />
                <Row label="営業期間" value={camp.season} />
                <Row label="予約" value={`${f.reservation}${f.reservationNote ? `（${f.reservationNote}）` : ""}`} />
                <Row label="焚き火" value={f.bonfire ? `可${f.bonfireNote ? `（${f.bonfireNote}）` : ""}` : "不可"} />
                <Row label="シャワー" value={f.shower ? `あり${f.showerNote ? `（${f.showerNote}）` : ""}` : "なし"} />
                <Row label="風呂" value={f.bath ? `あり${f.bathNote ? `（${f.bathNote}）` : ""}` : "なし"} />
                <Row label="トイレ" value={f.toilet} />
                <Row label="車横付け" value={f.carIn ? `可${f.carInNote ? `（${f.carInNote}）` : ""}` : `不可${f.carInNote ? `（${f.carInNote}）` : ""}`} />
                <Row label="ソロプラン" value={f.soloPlan ? `あり${f.soloPlanNote ? `（${f.soloPlanNote}）` : ""}` : "なし"} />
                <Row label="Wi-Fi" value={f.wifi ? "あり" : "なし"} />
                <Row label="薪販売" value={f.firewood ? "あり" : "なし"} />
                <Row label="氷販売" value={f.ice ? "あり" : "なし"} />
                <Row label="酒販売" value={f.alcohol ? "あり" : "なし"} />
                {camp.closedDays && <Row label="定休日" value={camp.closedDays} />}
                <Row label="情報確認日" value={camp.lastVerified} />
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <Link href="/" className="text-blue-500 text-sm hover:underline">← キャンプ場一覧に戻る</Link>
        </div>
      </div>

      {/* Fixed bottom CTA bar — mobile only */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur border-t border-slate-200"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex gap-2 px-4 py-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center h-[52px] rounded-xl bg-[#e8611f] text-white text-[14px] font-semibold hover:bg-[#d0551a] transition-colors"
          >
            📍 Googleマップで開く
          </a>
          {camp.tel && (
            <a
              href={`tel:${camp.tel}`}
              className="flex items-center justify-center h-[52px] px-5 rounded-xl bg-slate-100 text-slate-700 text-[14px] font-semibold hover:bg-slate-200 transition-colors"
            >
              📞 電話
            </a>
          )}
        </div>
      </div>
    </>
  );
}
