import Link from "next/link";
import type { Campground } from "@/lib/types";
import { hasEvidence, hasUsableCoord, hasVerifiedScores, isToleratedWildSite } from "@/lib/camp";
import { campMapUrl } from "@/lib/maps";
import { RestrictionChips, EligibilityChip } from "@/components/RestrictionChip";
import FavoriteButton from "@/components/FavoriteButton";

type FeatureTag = { key: string; label: string };

function getFeatureTags(f: Campground["features"], bathFilterActive: boolean): FeatureTag[] {
  const tags: FeatureTag[] = [];
  if (f.bath)                    tags.push({ key: "bath",    label: "♨️ 風呂" });
  if (f.shower && !bathFilterActive) tags.push({ key: "shower",  label: "🚿 シャワー" });
  if (f.carIn)                   tags.push({ key: "carIn",   label: "🚗 車横付け" });
  if (f.wifi)                    tags.push({ key: "wifi",    label: "📶 Wi-Fi" });
  if (f.reservation === "不要")  tags.push({ key: "noRes",   label: "✅ 予約不要" });
  if (f.fishing)                 tags.push({ key: "fishing", label: "🎣 釣り可" });
  if (f.firewood)                tags.push({ key: "firewood",label: "🪵 薪" });
  return tags;
}

/** 可否未確認を「焚き火不可」と誤表示しない。明示的な禁止・不可の根拠がある場合だけ出す。 */
function isNoBonfire(f: Campground["features"]): boolean {
  return f.bonfire === false && /禁止|不可|できない|NG/.test(f.bonfireNote ?? "");
}

type Props = { camp: Campground; bathFilterActive?: boolean };

export default function CampCard({ camp, bathFilterActive = false }: Props) {
  const tags = getFeatureTags(camp.features, bathFilterActive);
  const isWild = camp.type === "wild";
  // 野営地は無料。管理施設で価格が 0/0 のものは未調査なので priceNote を出す
  const priceUnknown = !isWild && camp.priceMin === 0 && camp.priceMax === 0;
  // 値は入っているが裏を取っていないもの。根拠のない金額は出さない
  const priceUnverified = !isWild && camp.priceVerified !== true;
  const noBonfire = isNoBonfire(camp.features);
  // 公認された無料開放地と、黙認されているだけの河川敷を同じ顔で並べない。
  const tolerated = isToleratedWildSite(camp);
  const mapsUrl = campMapUrl(camp);

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
        <FavoriteButton slug={camp.slug} />
      </div>

      {/* 2. Camp name */}
      <div className="px-4 pb-3">
        <Link
          href={`/camp/${camp.slug}`}
          className="font-['Shippori_Mincho_B1','Noto_Serif_JP',serif] text-[18px] sm:text-[20px] font-bold text-[#0e0d0b] leading-snug hover:text-[#e8611f] transition-colors"
        >
          {camp.name}
        </Link>
        {/*
          期間限定制限と利用対象の制限は、施設名の直下・featureバッジより前に出す。
          料金や設備を見る前に「今そこへ行けるのか」を判断させたいため。
        */}
        {(camp.restrictions?.length || camp.eligibility) && (
          <span className="ml-2 inline-flex flex-wrap gap-1.5 align-middle">
            <RestrictionChips restrictions={camp.restrictions} />
            <EligibilityChip eligibility={camp.eligibility} />
          </span>
        )}
        {isWild && (
          <span className="ml-2 align-middle inline-flex items-center shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-white text-[#e8611f] border border-[#e8611f]">
            野営地
          </span>
        )}
        {tolerated && (
          <span
            className="ml-2 align-middle inline-flex items-center shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-[#fdf3ea] text-[#9a5b1c] border border-[#e3c6a6]"
            title="自治体が公認した野営地ではありません。黙認されている場所です"
          >
            公認なし
          </span>
        )}
        {noBonfire && (
          <span className="ml-2 align-middle inline-flex items-center shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f0ee] text-[#6b6560] border border-[#d8d3ce]">
            🚫 焚き火不可
          </span>
        )}
        {camp.needsVerify && (
          <span className="ml-2 align-middle inline-flex items-center shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-[#f2f0ee] text-[#6b6560] border border-[#d8d3ce]">
            要確認
          </span>
        )}
      </div>

      {/* 信頼性チップ。未確認を「なし・低評価」と断定せず、確認済み情報と区別する。 */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {hasEvidence(camp) ? (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {/* 野営地は公式サイトが存在しないので「情報源あり」とは言わない。何を確かめたのかを書く */}
            {isWild ? "場所・注意点を記録" : "情報源あり"}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">情報確認中</span>
        )}
        {camp.priceVerified === true ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">料金確認済み</span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">料金 要確認</span>
        )}
        {hasUsableCoord(camp) ? (
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">地図位置あり</span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">地図位置 要確認</span>
        )}
        {!hasVerifiedScores(camp) && (
          <span className="inline-flex items-center rounded-full border border-[#e2ddd8] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#6b5a4e]">評価確認中</span>
        )}
      </div>

      {/* 3. Price */}
      <div className="px-4 pb-3">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-['JetBrains_Mono',monospace] text-[20px] font-bold ${
              priceUnverified ? "text-[#9a8e84]" : "text-[#2a6e3f]"
            }`}
          >
            {isWild
              ? "無料"
              : priceUnverified
                ? "料金 要確認"
                : priceUnknown
                  ? (camp.priceNote || "要問合せ")
                  : `¥${camp.priceMin.toLocaleString()}〜`}
          </span>
          {!isWild && !priceUnverified && !priceUnknown && camp.priceNote && (
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
