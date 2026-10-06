"use client";

import type { TypeTab } from "@/lib/camp";

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
  "font-['Shippori_Mincho_B1','Noto_Serif_JP',serif] font-bold " +
  "text-[13px] sm:text-[15px] whitespace-nowrap";
const active = "bg-[#e8611f] text-white border-[#e8611f]";
const inactive = "bg-white text-[#0e0d0b] border-[#e2ddd8] hover:border-[#e8611f]/50";

export default function TypeTabs({ value, onChange, counts }: Props) {
  return (
    <div role="tablist" aria-label="施設の種別" className="flex gap-1.5 sm:gap-2">
      {TABS.map(({ key, label }) => {
        const selected = value === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(key)}
            className={`${base} ${selected ? active : inactive}`}
          >
            <span>{label}</span>
            <span
              className={`font-['JetBrains_Mono',monospace] font-normal text-[11px] sm:text-[12px] ${
                selected ? "text-white/80" : "text-[#9a8e84]"
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
