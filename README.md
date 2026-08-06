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

## データ監査

未検証データ（`coordsVerified !== true`）の名称・県・実在性をまとめてチェックする。

```bash
node scripts/audit-names.js    # → scripts/audit-report.md
```

県とエリアの地名の食い違い、名称の重複・類似（正規化＋編集距離）、
電話番号と公式サイトが両方空のもの、県の bounds を外れた座標を検出する。
`campgrounds.json` は読むだけで変更しない。

## 座標確認ツール

### 1. Overpass API で自動照合（手動確認を減らす）

```bash
node scripts/auto-coords.js          # OSM と名前照合 → scripts/auto-coords-result.json
node scripts/review-auto-coords.js   # 自動採用候補の一括レビュー用HTMLを生成
```

`scripts/auto-review.html` をブラウザで開くと、候補が地図サムネイルのグリッドで並ぶ。
ピン位置が違うものだけチェックを外し、「JSONでダウンロード」→ `scripts/coords-fixed.json` として保存し、

```bash
node scripts/apply-coords.js
```

`auto-coords.js` は `campgrounds.json` を一切変更しない（結果をJSONに書くだけ）。
Overpass のレスポンスは `scripts/.overpass-cache.json` にキャッシュされるので、
途中で失敗しても再実行すれば取得済みの分は即座に返る。
結果の `fetchFailed` は「候補がない」ではなく「Overpass から取得できなかった」もので、
再実行すれば取り直せる。

### 2. 残りを手動確認



`lat/lng` が未設定（0）または未検証（`coordsVerified !== true`）のキャンプ場を、
Googleマップと突き合わせて1件ずつ確認・修正するためのローカルツール。

```bash
node scripts/mark-verified.js               # 初回のみ: 確認済みデータに coordsVerified: true を付与
node scripts/build-coord-tool.js            # 全対象を抽出して scripts/coord-tool.html を生成
node scripts/build-coord-tool.js --pending  # 自動照合で決まらなかったものだけに絞る
node scripts/build-coord-tool.js --slugs a,b # slug 指定
```

生成された `scripts/coord-tool.html` をブラウザで開き（`file://` で可）、

1. 「Googleマップで検索」で対象を開く
2. アドレスバーのURLをテキストエリアに貼る（`/@…` と `!3d…!4d…` の両形式に対応）
3. 地図に出たピンを目視確認して「確定して次へ」（<kbd>Enter</kbd>）/「スキップ」（<kbd>S</kbd>）

進捗は localStorage に保存されるので、途中で閉じても再開できる。

#### 進捗をリセットする

ツール内の「進捗をリセット」ボタンでも消せるが、ブラウザのコンソール（F12 → Console）から直接消すこともできる。

| ツール | localStorage キー |
| --- | --- |
| `coord-tool.html`（1件ずつ手動確認） | `soro-camp:coord-tool:v1` |
| `auto-review.html`（自動採用候補の一括レビュー） | `soro-camp:auto-review:v1` |

```js
// 手動確認ツールの進捗（確定済みの座標を含む）を消してやり直す
localStorage.removeItem('soro-camp:coord-tool:v1')

// 一括レビューの「除外」記録を消して全件チェック済みに戻す
localStorage.removeItem('soro-camp:auto-review:v1')
```

実行後にページをリロードすると1件目から再開する。
localStorage はオリジン単位なので、`file://` で開いたときと `http://localhost` で開いたときでは
別々に保存される点に注意（片方を消してももう片方は残る）。
確認が済んだら「JSONをダウンロード」→ `scripts/coords-fixed.json` として保存し、

```bash
node scripts/apply-coords.js       # slug 照合で lat/lng/coordsVerified を反映
node scripts/check-coords.js       # 県境チェック + 座標未設定の残数確認
```

UIを直す場合は `scripts/coord-tool.template.html` を編集して `build-coord-tool.js` を再実行する
（`coord-tool.html` は生成物）。

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
