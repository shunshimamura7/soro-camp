/**
 * サイトの正規URL（sitemap / robots / OGP の絶対URLに使う）。
 *
 * 既定値は Cloudflare Workers の公開先。独自ドメインを割り当てたら
 * NEXT_PUBLIC_SITE_URL で上書きする。next build 時に埋め込まれるため、
 * 設定はビルドより前に行うこと。
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://soro-camp.shun622shun39.workers.dev";
