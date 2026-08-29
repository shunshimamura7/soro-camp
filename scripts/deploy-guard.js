/**
 * `npm run deploy` の誤爆ガード。
 *
 * 2026-08-27 に公開先を Cloudflare Workers から Cloudflare Pages へ移し、
 * 旧 Workers サービス（soro-camp.shun622shun39.workers.dev）は削除した。
 * それまでの `deploy` は `next build && wrangler deploy` で、いま実行すると
 * 削除したはずの Workers を作り直して配ってしまう。
 *
 * スクリプト自体を消すと `npm run deploy` は「missing script」で落ちるだけで、
 * **なぜ使えないのか**と**代わりに何をするのか**が残らない。だから手順を出して止める。
 *
 * 2026-08-29: 公開手順を ZIP の手動アップロードから `npm run deploy:pages`
 * （= wrangler pages deploy）へ変更した。理由は下の注意書きのとおり。
 */
const lines = [
  "",
  "  npm run deploy は使わない。代わりに次を実行する。",
  "",
  "    npm run deploy:pages",
  "",
  "  中身は `npm run build && npx wrangler pages deploy out --project-name soro-camp --branch main`。",
  "  prebuild で validate / test が走るので、事前に手で流す必要はない。",
  "  （手で確かめたい時は npm run validate && npm test && npm run build）",
  "",
  "  デプロイ後に見る:",
  "    https://soro-camp.pages.dev/            … 200 か。本文に件数と「野営地」が出るか",
  "    https://soro-camp.pages.dev/camp/aone   … 詳細ページが配られているか",
  "    https://soro-camp.pages.dev/sitemap.xml … loc が soro-camp.pages.dev か",
  "",
  "  ダッシュボードの ZIP アップロードは使わない。",
  "  2026-08-29 に、Production のデプロイレコードは作られるのに実ファイルが載らず、",
  "  soro-camp.pages.dev だけでなく個別デプロイURLまで 404 になる事象が起きた。",
  "  症状は「本文ゼロバイトの 404」。さらに PowerShell 5.1 の Compress-Archive は",
  "  ZIP のパス区切りにバックスラッシュ（\\）を書くため、階層が全滅して",
  "  詳細ページと _next/ のアセットが配られない。ZIP 経路は二重に危ない。",
  "",
  "  旧 Workers URL は削除済み。復活させない。同名の Workers サービスも作らない。",
  "  wrangler deploy（Workers 向け）と wrangler pages deploy は別物。前者は使わない。",
  "  wrangler.toml は Workers 時代の記録として残しているだけで、公開には使わない。",
  "",
];
console.error(lines.join("\n"));
process.exit(1);
