import { evidenceBackedCampgrounds, evidencePendingCampgrounds } from "@/lib/camp";
import { toLite } from "@/lib/lite";
import { SITE_URL } from "@/lib/site";
import HomeClient from "@/components/HomeClient";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * トップ（2026-11-05 にサーバー側とクライアント側を分けた）。
 *
 * データ（data/campgrounds.json）はここ（ビルド時）でだけ読み、一覧に要る項目だけの軽い版を
 * 画面側に渡す。以前は画面側がデータ全体を import していて、ブラウザ向け JS に丸ごと入っていた。
 */
export default function HomePage() {
  const backed = evidenceBackedCampgrounds.map(toLite);
  const pending = evidencePendingCampgrounds.map(toLite);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ソロキャン羅針盤",
    url: SITE_URL,
    description: "神奈川・静岡・山梨・千葉のソロキャンプ場ガイド。料金と設備は公式サイトで裏取りしたものだけを掲載。",
    inLanguage: "ja",
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient backed={backed} pending={pending} />
    </>
  );
}
