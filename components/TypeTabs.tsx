"use client";

import type { TypeTab } from "@/lib/camp-core";

/**
 * 一覧上部の種別タブ。**キャンプ場 / 野営地 の2つだけ。**
 *
 * 2026-10-06 に「すべて」を廃止した。管理されたキャンプ場と、管理者のいない野営地を
 * 同じ一覧に並べると、**利用者が負う責任の違いが見えなくなる。**
 * 野営地には予約も料金も管理人も無く、「公認なし」のものも含まれる。
 *
 * タブは2つだけなので `flex-1` で等分する。最小高さ 44px はタップ領域の下限
 * （Android 実機・幅360px でも指で押せる大きさ）。
 */
type Props = {
  value: TypeTab;
  onChange: (tab: TypeTab) => void;
  counts: { campground: number; wild: number };
};

const TABS: Array<{ key: TypeTab; label: string }> = [
  { key: "campground", label: "キャンプ場" },
  { key: "wild", label: "野営地" },
];

const base =
  "flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 " +
  "min-h-[44px] px-2 sm:px-4 rounded-xl border transition-colors " +
  "font-bold text-[14px] sm:text-[15px] whitespace-nowrap";
// 白文字は #b5440e の上に置く（ember #e8611f の上だと 3.41:1 で AA 未満。審査員6）
const active = "bg-[#b5440e] text-white border-[#b5440e]";
const inactive = "bg-white text-[#1c1814] border-[#d8d0c6] hover:border-[#b5440e]";

export default function TypeTabs({ value, onChange, counts }: Props) {
  return (
    /*
      2026-11-05：role="tablist"/"tab" をやめて、押し分けのボタン（aria-pressed）にした。
      タブを名乗るなら矢印キー移動・tabpanel が要るのに、どれも無かった（審査員6）。
    */
    <div role="group" aria-label="施設の種別" className="flex gap-1.5 sm:gap-2">
      {TABS.map(({ key, label }) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(key)}
            className={`${base} ${selected ? active : inactive}`}
          >
            <span>{label}</span>
            <span
              className={`font-normal text-[13px] tabular-nums ${
                selected ? "text-white" : "text-[#6b5d50]"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
