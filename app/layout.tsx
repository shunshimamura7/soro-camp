import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "700"] });

const SITE_NAME = "ソロキャン羅針盤";
const SITE_DESCRIPTION =
  "神奈川・静岡・山梨のソロキャンプ場を徹底比較。静か・絶景・コスパ・アクセス・設備の5軸スコアで自分だけの最高のサイトを見つけよう。";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://soro-camp.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ソロキャンプ場ガイド 神奈川・静岡・山梨`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ソロキャンプ場ガイド`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ソロキャンプ場ガイド`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${noto.className} bg-white text-slate-900 min-h-screen`}>
        <header className="border-b border-slate-200 px-4 py-3 bg-white">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <span className="text-2xl">🏕</span>
            <div>
              <a href="/" className="text-slate-900 font-bold text-lg leading-none hover:text-blue-500 transition-colors">
                ソロキャン羅針盤
              </a>
              <p className="text-xs text-slate-500 mt-0.5">神奈川・静岡・山梨 ソロキャンプ場ガイド</p>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-slate-200 mt-16 py-8 px-4 text-center text-xs text-slate-400">
          <p>© 2026 ソロキャン羅針盤 — 情報の正確性に努めていますが、訪問前に各キャンプ場へご確認ください。</p>
          <p className="mt-1">最終確認: 2026-05-26</p>
        </footer>
      </body>
    </html>
  );
}
