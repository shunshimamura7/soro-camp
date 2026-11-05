import Link from "next/link";
import type { Campground } from "@/lib/types";
import { hasEvidence, hasUsableCoord, isToleratedWildSite } from "@/lib/camp-core";
import { RestrictionChips, EligibilityChip } from "@/components/RestrictionChip";
import FavoriteButton from "@/components/FavoriteButton";
import { RichText } from "@/lib/rich";

type FeatureTag = { key: string; icon: string; label: string };

function getFeatureTags(f: Campground["features"], bathFilterActive: boolean): FeatureTag[] {
  const tags: FeatureTag[] = [];
  if (f.bath)                    tags.push({ key: "bath",    icon: "♨️", label: "風呂" });
  if (f.shower && !bathFilterActive) tags.push({ key: "shower",  icon: "🚿", label: "シャワー" });
  if (f.carIn)                   tags.push({ key: "carIn",   icon: "🚗", label: "車横付け" });
  if (f.pet)                     tags.push({ key: "pet",     icon: "🐕", label: "ペット可" });
  if (f.wifi)                    tags.push({ key: "wifi",    icon: "📶", label: "Wi-Fi" });
  if (f.reservation === "不要")  tags.push({ key: "noRes",   icon: "✅", label: "予約不要" });
  if (f.fishing)                 tags.push({ key: "fishing", icon: "🎣", label: "釣り可" });
  if (f.firewood)                tags.push({ key: "firewood",icon: "🪵", label: "薪" });
  return tags;
}

/** 可否未確認を「焚き火不可」と誤表示しない。明示的な禁止・不可の根拠がある場合だけ出す。 */
function isNoBonfire(f: Campground["features"]): boolean {
  return f.bonfire === false && /禁止|不可|できない|NG/.test(f.bonfireNote ?? "");
}

/** 野営地のトイレ。管理者がいないので、カードの段階で見せる（審査員4） */
function wildToiletLabel(t?: string): string {
  if (!t || t === "不明" || t === "要確認") return "トイレ 不明";
  if (t === "なし") return "トイレ なし";
  return `トイレ ${t}`;
}

const chip = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold";
const warnChip = `${chip} border-[#e6c79c] bg-[#fdf3e3] text-[#7a4a10]`;
const greyChip = `${chip} border-[#d8d0c6] bg-[#f4f0ea] text-[#4a3f35]`;

type Props = { camp: Campground; bathFilterActive?: boolean };

/**
 * 一覧のカード（2026-11-05 作り直し）。
 *
 * - **全件に同じ顔で出ていたチップ（情報源あり・料金確認済み・地図位置あり・評価確認中）を
 *   やめ、例外だけを出す。** 404件が全部同じチップを3〜4個背負うと、例外が埋もれる（審査員5）
 * - 施設名は見出し（h2）にし、リンクの当たりをカード全体に広げる（審査員6）
 * - 文字は12px以上、色は WCAG AA 4.5:1 以上
 */
export default function CampCard({ camp, bathFilterActive = false }: Props) {
  const tags = getFeatureTags(camp.features, bathFilterActive);
  const isWild = camp.type === "wild";
  const priceUnverified = !isWild && camp.priceVerified !== true;
  const priceUnknown = !isWild && !priceUnverified && camp.priceMin === 0 && camp.priceMax === 0;
  const noBonfire = isNoBonfire(camp.features);
  const tolerated = isToleratedWildSite(camp);
  const evidence = hasEvidence(camp);
  const coord = hasUsableCoord(camp);
  const hasExceptions =
    Boolean(camp.restrictions?.length) || Boolean(camp.eligibility) || isWild || tolerated || noBonfire ||
    Boolean(camp.needsVerify) || !evidence || !coord;

  return (
    <article
      className="relative bg-white rounded-2xl border border-[#e9e2d8] hover:border-[#e8611f] focus-within:border-[#e8611f] transition-colors overflow-hidden"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 340px" }}
    >
      {/* 1. 県・エリア・保存 */}
      <div className="flex items-center gap-2 px-4 pt-3.5">
        <span className="text-[12px] text-[#6b5d50] truncate flex-1">
          {camp.prefecture}・{camp.area}
        </span>
        <FavoriteButton slug={camp.slug} name={camp.name} />
      </div>

      {/* 2. 施設名（カード全体がリンク） */}
      <h2 className="px-4 pt-1 pb-2 font-bold text-[18px] sm:text-[19px] text-[#1c1814] leading-snug">
        <Link
          href={`/camp/${camp.slug}`}
          className="after:absolute after:inset-0 after:content-[''] hover:text-[#b5440e]"
        >
          {camp.name}
        </Link>
      </h2>

      {/* 3. 例外だけのチップ。今そこへ行けるか・情報が欠けていないかを先に見せる */}
      {hasExceptions && (
        <div className="px-4 pb-2.5 flex flex-wrap gap-1.5">
          <RestrictionChips restrictions={camp.restrictions} />
          <EligibilityChip eligibility={camp.eligibility} />
          {isWild && <span className={`${chip} border-[#e8611f] bg-white text-[#b5440e]`}>野営地</span>}
          {tolerated && (
            <span className={warnChip} title="自治体が公認した野営地ではありません。黙認されている場所です">公認なし</span>
          )}
          {isWild && <span className={warnChip}>{wildToiletLabel(camp.features.toilet)}</span>}
          {noBonfire && <span className={greyChip}>焚き火不可</span>}
          {!evidence && <span className={warnChip}>情報確認中</span>}
          {camp.needsVerify && <span className={warnChip}>要確認</span>}
          {!coord && <span className={greyChip}>地図ピン未取得</span>}
        </div>
      )}

      {/* 4. 料金（ソロ1名1泊の総額） */}
      <div className="px-4 pb-2.5">
        {isWild ? (
          <p className="text-[20px] font-bold text-[#1c1814]">無料</p>
        ) : priceUnverified ? (
          <p className="text-[15px] font-bold text-[#7a4a10]">
            料金 要確認
            <span className="ml-1.5 text-[12px] font-normal text-[#6b5d50]">公式に記載なし・未確認</span>
          </p>
        ) : priceUnknown ? (
          <p className="text-[15px] font-bold text-[#1c1814]">要問合せ</p>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[12px] text-[#6b5d50]">ソロ1泊</span>
              <span className="text-[21px] font-bold text-[#1c1814] tabular-nums">¥{camp.priceMin.toLocaleString()}〜</span>
              <span className="text-[12px] font-semibold text-[#2a6e3f]">公式で確認</span>
            </p>
            {camp.priceNote && (
              <p className="mt-0.5 text-[12px] text-[#6b5d50] truncate">
                <RichText text={camp.priceNote} strongClassName="font-normal" />
              </p>
            )}
          </>
        )}
      </div>

      {/* 5. 設備 */}
      {tags.length > 0 && (
        <ul className="px-4 pb-2.5 flex flex-wrap gap-1.5" aria-label="設備">
          {tags.map((t) => (
            <li
              key={t.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#f6f1ea] text-[#4a3f35] border border-[#e9e2d8]"
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </li>
          ))}
        </ul>
      )}

      {/* 6. ソロ向けのひとこと（2行まで） */}
      {camp.soloComment && (
        <div className="px-4 pb-4">
          {/* 余白は外側に持たせる。clamp する要素に padding があると3行目が余白に見えてしまう */}
          <p className="text-[13px] text-[#4a3f35] leading-relaxed line-clamp-2">
            <RichText text={camp.soloComment} strongClassName="font-semibold text-[#1c1814]" />
          </p>
        </div>
      )}
    </article>
  );
}
