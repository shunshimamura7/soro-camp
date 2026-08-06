This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare Workers

本番は Cloudflare Workers の静的アセット配信で公開している。
`next.config.ts` の `output: "export"` で `out/` に静的書き出しし、それを `wrangler.toml` の `[assets]` が配信する。

### 初回のみ

```bash
npx wrangler login
```

### デプロイ

```bash
npm run deploy    # next build（= out/ を生成）→ wrangler deploy
```

`out/` を生成せずに `wrangler deploy` だけを実行するとアセットが空になるので、必ず `npm run deploy` を使う。

### 設定メモ

- `wrangler.toml` の `not_found_handling = "404-page"` は `out/404.html`（Next.js が自動生成）を返す。
- 静的エクスポートでは画像最適化サーバーが使えないため `images: { unoptimized: true }` が必要。
- `app/sitemap.ts` と `app/robots.ts` は `export const dynamic = "force-static"` が必須。外すとビルドが落ちる。
- 独自ドメインは Cloudflare ダッシュボードの Workers → Settings → Domains & Routes から割り当てる。
- 本番 URL を変える場合は `NEXT_PUBLIC_SITE_URL` を設定する（sitemap / OGP の絶対 URL に使用）。

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
