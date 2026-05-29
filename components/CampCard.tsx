import Link from "next/link";
import type { Campground } from "@/lib/types";

type FeatureTag = { key: string; label: string };

function getFeatureTags(f: Campground["features"]): FeatureTag[] {
  const tags: FeatureTag[] = [];
  if (f.bath)                    tags.push({ key: "bath",    label: "♨️ 風呂" });
  if (f.shower)                  tags.push({ key: "shower",  label: "🚿 シャワー" });
  if (f.carIn)                   tags.push({ key: "carIn",   label: "🚗 車横付け" });
  if (f.wifi)                    tags.push({ key: "wifi",    label: "📶 Wi-Fi" });
  if (f.reservation === "不要")  tags.push({ key: "noRes",   label: "✅ 予約不要" });
  if (f.firewood)                tags.push({ key: "firewood",label: "🪵 薪" });
  return tags;
}

type Props = { camp: Campground };

export default function CampCard({ camp }: Props) {
  const tags = getFeatureTags(camp.features);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    camp.name + " " + (camp.address ?? "")
  )}`;

  return (
    <article className="bg-white rounded-2xl border border-[#e2ddd8] hover:border-[#e8611f]/40 hover:shadow-lg transition-all overflow-hidden">
      {/* 1. Header row: area + prefecture badge + favorite */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <span className="font-['JetBrains_Mono',monospace] text-[11px] text-[#9a8e84] tracking-wider truncate flex-1 leading-none">
          {camp.area}
        </span>
        <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f5f0ea] text-[#6b5a4e] border border-[#e2ddd8]">
          {camp.prefecture}
        </span>
      </div>

      {/* 2. Camp name */}
      <div className="px-4 pb-3">
        <Link
          href={`/camp/${camp.slug}`}
          className="font-['Shippori_Mincho_B1','Noto_Serif_JP',serif] text-[18px] sm:text-[20px] font-bold text-[#0e0d0b] leading-snug hover:text-[#e8611f] transition-colors"
        >
          {camp.name}
        </Link>
      </div>

      {/* 3. Price */}
      <div className="px-4 pb-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-['JetBrains_Mono',monospace] text-[20px] font-bold text-[#2a6e3f]">
            ¥{camp.priceMin.toLocaleString()}〜
          </span>
          {camp.priceNote && (
            <span className="text-[12px] text-[#9a8e84] truncate max-w-[140px]">
              {camp.priceNote}
            </span>
          )}
        </div>
      </div>

      {/* 4. Feature tags */}
      {tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t.key}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#f5f0ea] text-[#5a4a3a] border border-[#e2ddd8]"
            >
              {t.label}
            </span>
          ))}
        </div>
      )}

      {/* 5. soloComment — max 2 lines */}
      <div className="px-4 pb-4">
        <p className="text-[13px] text-[#5a5050] leading-relaxed line-clamp-2">
          {camp.soloComment}
        </p>
      </div>

      {/* 6. Action buttons */}
      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
        <Link
          href={`/camp/${camp.slug}`}
          className="flex items-center justify-center min-h-[44px] rounded-xl bg-[#e8611f] text-white text-[14px] font-semibold hover:bg-[#d0551a] transition-colors"
        >
          詳細を見る
        </Link>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center min-h-[44px] rounded-xl bg-white text-[#e8611f] text-[13px] font-semibold border-2 border-[#e8611f] hover:bg-[#e8611f]/5 transition-colors"
        >
          📍 Googleマップ
        </a>
      </div>
    </article>
  );
}
