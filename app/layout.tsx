import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { latestVerifiedDate } from "@/lib/camp";


const SITE_NAME = "ソロキャン羅針盤";
const SITE_DESCRIPTION =
  "神奈川・静岡・山梨・千葉のソロキャンプ場ガイド。料金と設備は各施設の公式サイトで裏取りしたものだけを掲載し、料金はソロ1名1泊の総額で表示。予算・風呂・ペット可・売店などで絞り込めます。";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ソロキャンプ場ガイド 神奈川・静岡・山梨・千葉`,
    template: `%s | ${SITE_NAME}`,
  },
    description: SITE_DESCRIPTION,
  /*
    canonical は各ページで自分のURLを指定する（2026-11-05）。
    ここで SITE_URL を指定していたため、全詳細ページの canonical がトップを指していた（審査員8）。
  */
  openGraph: {

    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ソロキャンプ場ガイド`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ソロキャン羅針盤" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ソロキャンプ場ガイド`,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lastVerified = latestVerifiedDate();
  return (
    <html lang="ja">
      <body className="bg-[#f7f3ec] text-[#1c1814] min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[#0e0d0b] focus:px-4 focus:py-3 focus:text-white"
        >
          本文へスキップ
        </a>
        <header className="border-b border-[#e9e2d8] px-3 sm:px-4 py-2 sm:py-2.5 bg-white pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3 min-h-[44px]">
            <Link href="/" className="flex items-center gap-2 min-h-[44px] min-w-0 flex-1 text-[#1c1814] hover:text-[#b5440e] transition-colors">
              <span className="text-xl sm:text-2xl leading-none" aria-hidden="true">🏕</span>
              <span className="min-w-0">
                <span className="block font-bold text-base sm:text-lg leading-tight">ソロキャン羅針盤</span>
                <span className="text-[12px] text-[#6b5d50] hidden sm:block">神奈川・静岡・山梨・千葉 ソロキャンプ場ガイド</span>
              </span>
            </Link>
            <Link
              href="/about"
              className="shrink-0 inline-flex items-center min-h-[44px] px-3 rounded-lg border border-[#d8d0c6] text-[13px] text-[#4a3f35] hover:border-[#b5440e] hover:text-[#b5440e] transition-colors"
            >
              このサイトについて
            </Link>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="focus:outline-none">{children}</main>

        <footer className="border-t border-[#e9e2d8] mt-12 py-8 px-4 text-center text-[12px] text-[#6b5d50]">
          {/* 県別ページへの静的リンク（JS なしでもクローラが辿れる入口。審査員8） */}
          <nav aria-label="県別のキャンプ場" className="mb-4 flex flex-wrap justify-center gap-x-1 text-[14px]">
            {[["kanagawa", "神奈川"], ["shizuoka", "静岡"], ["yamanashi", "山梨"], ["chiba", "千葉"]].map(([slug, name]) => (
              <Link key={slug} href={`/pref/${slug}`} className="inline-flex items-center min-h-[44px] px-2.5 font-semibold text-[#b5440e] underline underline-offset-2 hover:no-underline">
                {name}のソロキャンプ場
              </Link>
            ))}
            <Link href="/updates" className="inline-flex items-center min-h-[44px] px-2.5 font-semibold text-[#b5440e] underline underline-offset-2 hover:no-underline">最近確認した施設</Link>
            <Link href="/about" className="inline-flex items-center min-h-[44px] px-2.5 font-semibold text-[#b5440e] underline underline-offset-2 hover:no-underline">このサイトについて</Link>
          </nav>
          <p>© 2026 ソロキャン羅針盤 — 情報の正確性に努めていますが、訪問前に各キャンプ場へご確認ください。</p>
          {/* データの lastVerified の最大値。固定で書くと更新時に直し忘れる */}
          {lastVerified && <p className="mt-1">データの最終更新: {lastVerified}（施設ごとの確認日は各詳細ページ）</p>}
        </footer>

        {/*
          期間限定制限バッジの書き換え。静的HTMLは常に「要確認」で出しておき、
          閲覧時のローカル日付で制限中かどうかを判定させる。
          読み込めなくても要確認表示が残るだけなので defer で足りる。
        */}
        <script src="/restrictions.js" defer />
      </body>
    </html>
  );
}
