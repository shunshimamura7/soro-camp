import Link from "next/link";
import type { Campground } from "@/lib/types";
import ScoreBar from "./ScoreBar";

const TAG_STYLES = "px-2 py-0.5 rounded text-xs font-medium";

function Tag({ children, green }: { children: React.ReactNode; green?: boolean }) {
  return (
    <span className={`${TAG_STYLES} ${green ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>
      {children}
    </span>
  );
}

function featureTags(f: Campground["features"]) {
  const tags: { label: string; green?: boolean }[] = [];
  if (f.bonfire) tags.push({ label: "🔥 焚き火", green: true });
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

export default function CampCard({ camp }: Props) {
  const tags = featureTags(camp.features);

  return (
    <article className="bg-[#16181c] rounded-2xl p-5 flex flex-col gap-4 border border-white/5 hover:border-blue-500/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500 mb-1">{camp.prefecture} · {camp.area}</p>
          <Link href={`/camp/${camp.slug}`} className="text-lg font-bold text-white hover:text-blue-400 transition-colors leading-tight">
            {camp.name}
          </Link>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold text-blue-400">{camp.soloScore.toFixed(1)}</div>
          <div className="text-xs text-gray-500">ソロ評価</div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1">
        <span className="text-green-400 font-bold text-base">
          ¥{camp.priceMin.toLocaleString()}〜
        </span>
        {camp.priceNote && (
          <span className="text-xs text-gray-500 truncate">{camp.priceNote}</span>
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
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{camp.soloComment}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/camp/${camp.slug}`}
          className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors"
        >
          詳細を見る
        </Link>
        {camp.officialUrl && (
          <a
            href={camp.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            公式サイト ↗
          </a>
        )}
        {camp.reservationUrl && (
          <a
            href={camp.reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
          >
            予約する ↗
          </a>
        )}
        {camp.tel && (
          <a
            href={`tel:${camp.tel}`}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            📞 {camp.tel}
          </a>
        )}
        <a
          href={`https://www.openstreetmap.org/?mlat=${camp.lat}&mlon=${camp.lng}&zoom=14`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-medium hover:bg-white/10 transition-colors"
        >
          🗺 地図
        </a>
      </div>
    </article>
  );
}
