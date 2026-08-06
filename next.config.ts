import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers の静的アセット配信（./out）に載せるため静的エクスポート
  output: "export",
  // 静的エクスポートでは next/image の最適化サーバーが使えない
  images: { unoptimized: true },
};

export default nextConfig;
