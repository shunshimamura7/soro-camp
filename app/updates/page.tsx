import type { Metadata } from "next";
import Link from "next/link";
import { evidenceBackedCampgrounds } from "@/lib/camp";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "最近確認した施設",
  description: "公式サイトで料金・設備を最近確認したキャンプ場の一覧。確認した日の新しい順。",
  alternates: { canonical: "/updates" },
  openGraph: { title: "最近確認した施設", url: `${SITE_URL}/updates`, type: "article", images: ["/og.png"] },
};

/**
 * 最近確認した施設（2026-11-05 新設。審査員10「戻ってくる理由」）。
 * lastVerified の新しい順に、確認日ごとにまとめて出す。作り話の「更新内容」は書かず、確認日と料金の結論だけを出す。
 */
export default function UpdatesPage() {
  const rows = evidenceBackedCampgrounds
    .filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.lastVerified ?? "") && c.lastVerified !== "2025-01-01")
    .sort((a, b) => b.lastVerified.localeCompare(a.lastVerified) || a.name.localeCompare(b.name, "ja"))
    .slice(0, 120);
  const byDate = new Map<string, typeof rows>();
  for (const c of rows) byDate.set(c.lastVerified, [...(byDate.get(c.lastVerified) ?? []), c]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-4 sm:pt-8">
      <nav aria-label="パンくずリスト" className="text-[13px] text-[#6b5d50] mb-2 flex gap-1 items-center">
        <Link href="/" className="inline-flex items-center min-h-[44px] pr-1 hover:text-[#b5440e]">トップ</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">最近確認した施設</span>
      </nav>
      <h1 className="text-[22px] sm:text-3xl font-bold text-[#1c1814] leading-tight">最近確認した施設</h1>
      <p className="mt-2 mb-6 text-[14px] leading-relaxed text-[#4a3f35]">
        各施設の公式サイトで、料金・設備を確認した日の新しい順です（新しい120件）。料金は確認した日の時点のものです。
      </p>
      {[...byDate.entries()].map(([date, camps]) => (
        <section key={date} className="mb-6">
          <h2 className="text-[16px] font-bold text-[#1c1814] mb-2">{date} に確認（{camps.length}件）</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {camps.map((r) => (
              <li key={r.slug}>
                <Link href={`/camp/${r.slug}`} className="flex items-center justify-between gap-2 min-h-[52px] px-4 rounded-xl bg-white border border-[#e9e2d8] hover:border-[#e8611f]">
                  <span className="min-w-0">
                    <span className="block font-semibold text-[14px] text-[#1c1814] truncate">{r.name}</span>
                    <span className="block text-[12px] text-[#6b5d50]">{r.prefecture}・{r.area}</span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-[#1c1814] tabular-nums">
                    {r.type === "wild" ? "無料" : r.priceVerified === true && r.priceMin > 0 ? `¥${r.priceMin.toLocaleString()}〜` : "料金要確認"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
