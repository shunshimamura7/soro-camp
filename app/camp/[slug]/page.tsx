import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampground, getAllSlugs } from "@/lib/camp";
import ScoreBar from "@/components/ScoreBar";
import CampMapClient from "@/components/CampMapClient";

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
      <span className="w-28 shrink-0 text-slate-500 text-sm">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-5 flex gap-1 items-center flex-wrap">
          <Link href="/" className="hover:text-slate-700">トップ</Link>
          <span>›</span>
          <span>{camp.prefecture}</span>
          <span>›</span>
          <span className="text-slate-700">{camp.name}</span>
        </nav>

        {/* Title */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-1">{camp.prefecture} · {camp.area}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">{camp.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-3xl font-bold text-blue-500">{camp.soloScore.toFixed(1)}</span>
            <span className="text-slate-500 text-sm">ソロスコア</span>
            <span className="text-green-600 font-bold">¥{camp.priceMin.toLocaleString()}〜</span>
            <span className="text-slate-500 text-sm">{camp.season}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Left */}
          <div className="flex flex-col gap-6">
            {/* Scores */}
            <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 mb-3">5軸スコア</h2>
              <div className="flex flex-col gap-2">
                <ScoreBar label="静か度" score={camp.scores.quietness} />
                <ScoreBar label="絶景度" score={camp.scores.scenery} color="#00ba7c" />
                <ScoreBar label="コスパ" score={camp.scores.value} color="#f59e0b" />
                <ScoreBar label="アクセス" score={camp.scores.access} color="#a78bfa" />
                <ScoreBar label="設備" score={camp.scores.facility} color="#fb7185" />
              </div>
            </section>

            {/* Comment */}
            <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 mb-2">ソロキャンパーへのコメント</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{camp.soloComment}</p>
            </section>

            {/* Links */}
            <div className="flex flex-col gap-2">
              {camp.officialUrl && (
                <a href={camp.officialUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
                  公式サイトを見る ↗
                </a>
              )}
              {camp.reservationUrl && (
                <a href={camp.reservationUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 transition-colors">
                  予約ページへ ↗
                </a>
              )}
              {camp.tel && (
                <a href={`tel:${camp.tel}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
                  📞 {camp.tel}
                </a>
              )}
              {camp.telNote && !camp.tel && (
                <p className="text-xs text-slate-500 text-center">{camp.telNote}</p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-6">
            {/* Map */}
            <section>
              <h2 className="text-sm font-bold text-slate-700 mb-2">アクセスマップ</h2>
              <CampMapClient lat={camp.lat} lng={camp.lng} name={camp.name} />
              <p className="text-xs text-slate-500 mt-1">📍 {camp.address}</p>
            </section>

            {/* Details */}
            <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 mb-1">施設情報</h2>
              <div>
                <Row label="料金" value={`¥${camp.priceMin.toLocaleString()}〜¥${camp.priceMax.toLocaleString()}${camp.priceNote ? `（${camp.priceNote}）` : ""}`} />
                <Row label="営業期間" value={camp.season} />
                <Row label="予約" value={`${f.reservation}${f.reservationNote ? `（${f.reservationNote}）` : ""}`} />
                <Row label="焚き火" value={f.bonfire ? `可${f.bonfireNote ? `（${f.bonfireNote}）` : ""}` : "不可"} />
                <Row label="ペット" value={f.pet ? `可${f.petNote ? `（${f.petNote}）` : ""}` : "不可"} />
                <Row label="シャワー" value={f.shower ? `あり${f.showerNote ? `（${f.showerNote}）` : ""}` : "なし"} />
                <Row label="風呂" value={f.bath ? `あり${f.bathNote ? `（${f.bathNote}）` : ""}` : "なし"} />
                <Row label="トイレ" value={f.toilet} />
                <Row label="車横付け" value={f.carIn ? `可${f.carInNote ? `（${f.carInNote}）` : ""}` : `不可${f.carInNote ? `（${f.carInNote}）` : ""}`} />
                <Row label="ソロプラン" value={f.soloPlan ? `あり${f.soloPlanNote ? `（${f.soloPlanNote}）` : ""}` : "なし"} />
                <Row label="Wi-Fi" value={f.wifi ? "あり" : "なし"} />
                {camp.closedDays && <Row label="定休日" value={camp.closedDays} />}
                <Row label="情報確認日" value={camp.lastVerified} />
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-500 text-sm hover:underline">← キャンプ場一覧に戻る</Link>
        </div>
      </div>
    </>
  );
}
