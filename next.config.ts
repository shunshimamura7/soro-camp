import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages（out/ の中身を手動アップロード）に載せるため静的エクスポート
  output: "export",
  // 静的エクスポートでは next/image の最適化サーバーが使えない
  images: { unoptimized: true },
};

export default nextConfig;
