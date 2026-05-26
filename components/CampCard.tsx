import Link from "next/link";
import type { Campground } from "@/lib/types";
import ScoreBar from "./ScoreBar";

function Tag({ children, green }: { children: React.ReactNode; green?: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded text-xs font-medium ${
        green ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
      }`}
    >
      {children}
    </span>
  );
}

function featureTags(f: Campground["features"]) {
  const tags: { label: string; green?: boolean }[] = [];
  if (f.pet) tags.push({ label: "🐕 ペット" });
  if (f.soloPlan) tags.push({ label: "🏕 ソロプラン", green: true });
  if (f.bath) tags.push({ label: "♨️ 風呂", green: true });
  if (f.shower) tags.push({ label: "🚿 シャワー" });
  if (f.wifi) tags.push({ label: "📶 Wi-Fi" });
  if (f.carIn) tags.push({ label: "🚗 車横付け" });
  if (f.reservation === "不要") tags.push({ label: "✅ 予約不要", green: true });
  return tags;
}

type Props = { camp: Campground };

// Shared button class — min-h-[44px] on mobile for iOS HIG touch targets
const btn = "flex items-center justify-center min-h-[44px] sm:min-h-0 sm:py-1.5 px-3 rounded-lg text-xs font-medium transition-colors";

export default function CampCard({ camp }: Props) {
  const tags = featureTags(camp.features);

  return (
    <article className="bg-white rounded-2xl p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 mb-0.5">{camp.prefecture} · {camp.area}</p>
          <Link
            href={`/camp/${camp.slug}`}
            className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-500 transition-colors leading-tight"
          >
            {camp.name}
          </Link>
        </div>
        <div className="shrink-0 text-right ml-2">
          <div className="text-2xl font-bold text-blue-500">{camp.soloScore.toFixed(1)}</div>
          <div className="text-[11px] text-slate-500">ソロ評価</div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="text-green-600 font-bold text-base shrink-0">
          ¥{camp.priceMin.toLocaleString()}〜
        </span>
        {camp.priceNote && (
          <span className="text-xs text-slate-500 truncate">{camp.priceNote}</span>
        )}
      </div>

      {/* Scores */}
      <div className="flex flex-col gap-1.5">
        <ScoreBar label="静か度" score={camp.scores.quietness} />
        <ScoreBar label="絶景度" score={camp.scores.scenery} color="#00ba7c" />
        <ScoreBar label="コスパ" score={camp.scores.value} color="#f59e0b" />
        <ScoreBar label="アクセス" score={camp.scores.access} color="#a78bfa" />
        <ScoreBar label="設備" score={camp.scores.facility} color="#fb7185" />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Tag key={t.label} green={t.green}>{t.label}</Tag>
        ))}
      </div>

      {/* Comment */}
      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{camp.soloComment}</p>

      {/* Actions: 2-col grid on mobile, flex-wrap on desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-1">
        {/* Primary CTA spans full width on mobile */}
        <Link
          href={`/camp/${camp.slug}`}
          className={`col-span-2 ${btn} bg-blue-50 text-blue-600 hover:bg-blue-100`}
        >
          詳細を見る →
        </Link>
        {camp.officialUrl && (
          <a
            href={camp.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}
          >
            公式サイト ↗
          </a>
        )}
        {camp.reservationUrl && (
          <a
            href={camp.reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
          >
            予約する ↗
          </a>
        )}
        {camp.tel && (
          <a
            href={`tel:${camp.tel}`}
            className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}
          >
            📞 {camp.tel}
          </a>
        )}
        <a
          href={`https://www.openstreetmap.org/?mlat=${camp.lat}&mlon=${camp.lng}&zoom=14`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}
        >
          🗺 地図
        </a>
      </div>
    </article>
  );
}
