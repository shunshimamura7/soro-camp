# ソロキャン羅針盤：Claude 引継ぎ開始ガイド

最終更新: **2026-10-10**（掲載件数・デプロイ手順・validate の正常状態・残タスクを更新）  
対象リポジトリ: `soro-camp`  
公開先: **https://soro-camp.pages.dev/**

> ## ★ 最初に読むのはここではなく `claude/継続メモ-2026-10-10.md`
>
> 本番の件数、門（なっぷ台帳）の残り、なっぷ収穫の状況、次にやること、今回決まったルール、
> 判断待ちの一覧は**すべて `claude/継続メモ-2026-10-10.md` が正**。
> このガイドは土台の設計方針を説明するもので、**数字と手順は継続メモのほうが新しい**。
> 食い違ったら継続メモを採る。

## まず読むこと

このリポジトリは、神奈川・静岡・山梨・千葉のソロキャンプ場を比較・検索する日本語の静的サイトである。目的は施設数を無条件に増やすことではなく、**公式根拠に基づく価格・設備・営業情報だけを、誠実に検索・比較できるようにすること**である。

現在の本番は Cloudflare Pages の無料URL `soro-camp.pages.dev` で公開されている。以前の Workers URL `soro-camp.shun622shun39.workers.dev` は **2026-08-27 に削除済み**であり、以後の公開・確認に使わない。

## 現在の本番状態

**数字は 2026-10-10 時点。最新は `claude/継続メモ-2026-10-10.md` を見ること。**

| 項目 | 状態 |
|---|---|
| 本番URL | https://soro-camp.pages.dev/ |
| ホスティング | Cloudflare Pages、ダイレクトアップロード（Production ブランチ `main`） |
| 最後のデプロイ | https://3c919285.soro-camp.pages.dev |
| 最後のコミット | `7efe6a6`（ブランチ `data-fixes-2026-08-16`） |
| active 合計 | **366件**（キャンプ場 355・野営地 11） |
| キャンプ場の県別 | 神奈川34 / 静岡96 / 山梨123 / 千葉102 |
| 野営地の県別 | 神奈川6 / 静岡4 / 山梨1 |
| 総レコード | 407（active 366 / unverified 32 / closed 7 / suspended 2） |
| 対象地域 | 神奈川・静岡・山梨・千葉 |
| 実ピン待ち | `needsCoord: true` が135件（山梨44 / 静岡26 / 千葉65） |
| 5軸評価を確認済み | 11件。残りは「評価確認中」で中立扱い |
| URL正規化 | `sitemap.xml` / OGP / canonical は `https://soro-camp.pages.dev` を指す |

> 2026-08-27 版にあった「通常掲載159件」「標準表示133件」「情報確認中26件」は**古い**。
> 2026-10-06〜10-10 に千葉・山梨の門を完走し、静岡を100/224件まで進めた結果、
> active キャンプ場は 265 → 355 に増えている。

## 技術構成

| 区分 | 内容 |
|---|---|
| フレームワーク | Next.js 16.2.6 / React 19 / TypeScript |
| スタイル | Tailwind CSS 4 |
| 地図 | MapLibre GL（`components/MapView.tsx`, `components/MapModal.tsx`） |
| データ | `data/campgrounds.json` が唯一の公開データ本体 |
| 出力 | `next.config.ts` の static export により `out/` を生成 |
| 型 | `lib/types.ts` の `Campground` と `Features` |
| 検証 | `scripts/validate-data.js` と `scripts/test-restrictions.js` |

主なファイルは次の通りである。

| ファイル / ディレクトリ | 役割 |
|---|---|
| `app/page.tsx` | トップページ。検索状態、地図、一覧、情報確認中切替を統合 |
| `app/camp/[slug]/page.tsx` | 静的施設詳細。料金・根拠・位置・評価状態・公式導線を表示 |
| `app/about/page.tsx` | 5軸スコアと確認状態の説明 |
| `app/sitemap.ts`, `app/robots.ts` | 検索エンジンの公開制御 |
| `components/FilterBar.tsx` | 都県・予算・こだわり条件のフィルタ。件数表示と「もっと条件」の折りたたみ |
| `components/CampCard.tsx` | 一覧カードと信頼性チップ |
| `components/MapView.tsx`, `components/MapModal.tsx` | 地図表示・ポップアップ |
| `lib/camp.ts` | 検索、並び替え、地図表示、情報源・評価状態の共通判定 |
| `lib/site.ts` | canonical / sitemap / OGP に使うサイトURL。既定値は Pages URL |
| `data/campgrounds.json` | **407レコード**。active 366件（キャンプ場355・野営地11）と保留レコード41件（unverified 32 / closed 7 / suspended 2）を含む（2026-10-10） |
| `scripts/` | 検証、監査、公式URL確認、座標確認、過去の調査ログ |

## ローカル作業と公開手順

### 変更後に必ず実行するコマンド

```bash
npm run validate
npm test
npm run build
```

`prebuild` でデータ検証・利用制限テスト・こだわり条件の構造テスト（`scripts/test-filters.js`）が走り、`build` は静的ファイルを `out/` に生成する。

**現在の正常状態は「validate が警告3件で通る」である**（2026-10-10 更新）。内訳は次のとおりで、すべて既知。

| 種類 | 件数 | 対象 | 待っているもの |
|---|---:|---|---|
| `coordsVerified` が機械検証を通っていない | 2件 | `kabutomushi-mori-camp`（9.8km / PREF_MISMATCH） / `makioka-fruits-camp`（17.3km / CITY_MISMATCH） | 実ピンの引き直し（しゅん本人の目視） |
| `wildStatus: "不明"` | 1件 | `wadanagahama-kaigan` | 一次情報の調査。**既定表示からは外してある**（削除ではない） |

**この3件以外の警告が出たら、それが自分の変更による差分である。3件以外の警告を無視して公開しないこと。**

> 2026-08-27 版の「警告7件」は古い。`mobility-park-izu` は座標まわりの警告が出なくなり、
> `wildStatus: "不明"` の野営地も4件から1件に減っている。

> **`npm run deploy` は使わない。** 2026-08-27 に Pages へ移行したため、`deploy` は誤爆ガード（`scripts/deploy-guard.js`）に置き換えてある。実行すると正規手順を表示して終了する。`wrangler.toml` は記録として残しているが使用しない。

### Cloudflare Pages への公開

**使うのはこの1本だけ。**

```bash
npm run build
npx wrangler pages deploy out --project-name soro-camp --branch main --commit-dirty=true
```

- **`npm run deploy` は使わない**（`scripts/deploy-guard.js` に差し替えてある）
- **`npm run deploy:pages` も使わない。**中身は同じ `wrangler pages deploy` だが、
  2026-10-10 の運用では上のコマンドを直接打つことに決めた（`--commit-dirty=true` を明示したいため）
- **`wrangler deploy` は Workers 向けなので実行しない**
- **新しい Pages プロジェクトを作らない**
- Production ブランチは `main`（`npx wrangler pages deployment list --project-name soro-camp` の
  Environment が `Production` になっているかで確認できる）

デプロイ後に必ず見る。

1. `https://soro-camp.pages.dev/` が 200 か。本文の掲載件数が今回の数字になっているか
2. 今回追加した slug の詳細ページ（`https://soro-camp.pages.dev/camp/<slug>`）が 200 か
3. `https://soro-camp.pages.dev/sitemap.xml` が 200 で `loc` が Pages URL か

> **CDN の反映に数十秒かかる。**デプロイ直後の1回目で古い件数が出たり、新しい詳細ページが 404 に
> なったりすることがある（2026-10-10 に実際に起きた）。少し置いて見直す。
> 切り分けたいときは、先に直デプロイURL `https://<id>.soro-camp.pages.dev/` を見る。

> **ダッシュボードの ZIP アップロードは使わない。** 2026-08-29 に、ZIP でアップロードすると
> **Production のデプロイレコードは作られるのに実ファイルが載らない**事象が起きた。
> `soro-camp.pages.dev` だけでなく個別デプロイURLまで 404 になり、**本文ゼロバイトの 404** が症状である。
> `wrangler pages deploy` で直接アップロードして復旧した。
> あわせて、**PowerShell 5.1 の `Compress-Archive` は ZIP のパス区切りにバックスラッシュ（`\`）を書く**。
> この ZIP を上げると階層が全滅する。ZIP をどうしても作る必要がある時は `Compress-Archive` ではなく
> `[System.IO.Compression.ZipFile]::CreateFromDirectory` を使う。

> `soro-camp.shun622shun39.workers.dev` は削除済みである。同名の Workers サービスを作らないこと。

### ディスクに注意

2026-10-10 に **npm キャッシュが13.8GBまで膨らんでCドライブが100%になり、デプロイが `ENOSPC` で失敗した。**
`npm cache clean --force` すら空き容量不足で動かなくなるので、その場合は
`%LOCALAPPDATA%
pm-cache\_cacache` と `_logs` を直接消す（どちらも再生成されるキャッシュ）。

## 実装済みの品質方針

### 情報の根拠

価格は公式サイト・自治体・公式予約先などの一次情報で確認できた場合だけ `priceVerified: true` にする。確認できない場合は、`needsPrice: true` として金額を非表示にし、画面で「料金 要確認」と出す。安そう・古い記事に金額がある・予約サイトの一時価格がある、というだけで確定価格にしない。

座標は人手で施設実ピンまたは信頼できる公式地図と照合できた時だけ `coordsVerified: true` にする。Nominatimや住所ジオコーディングの推測値を真の施設座標として登録しない。`needsCoord: true` または 0座標は地図ピンに出さない。

5軸（静けさ・景観・コスパ・アクセス・設備）の評価は、各軸の根拠が揃う場合だけ `scoresVerified: true` にする。未確認なら数値を表示せず「評価確認中」とし、ランキングでは中立扱いとする。

### 野営地（`type: "wild"`）

野営地には管理者・受付・公式サイトが無い。施設公式URLを根拠に求めると構造的に全件が既定表示から落ちる。
`hasEvidence()` は野営地だけ条件を変え、**使える座標がある**（場所にたどり着ける）かつ
**`cautions` が3件以上ある**（直火の可否・増水・トイレ・ゴミなど現地の制約が書いてある）を求める。

そのうえで、公認されていない場所には `isToleratedWildSite()` の判定で「公認なし」を必ず表示する。
公認された無料開放地と黙認されているだけの河川敷を同じ顔で並べない。利用者が負う責任が違う。

野営地の信頼性チップは「情報源あり」ではなく「場所・注意点を記録」。料金チップは出さない（料金の概念が無い）。

### 表示・検索の原則

- デフォルトでは `hasEvidence(camp)` を満たす施設を表示する。満たさない26件（根拠URLなしのキャンプ場22件＋`wildStatus: "不明"` の野営地4件）は「情報確認中も表示」を押した時のみ一覧・地図に出す。**レコードも詳細ページも消さない。表示の分離であって削除ではない。**
- **野営地（`type: "wild"`）に施設公式URLを求めない。** 管理者不在で公式サイトが存在しないため、URLで判定すると構造的に全件落ちる（実際に11件中9件が落ちていた）。代わりに「使える座標がある」かつ「cautions が3件以上ある」かつ「`wildStatus` が `"不明"` でない」を条件にする。
- **野営地の公認/黙認は `wildStatus` フィールドで判定する**（`"公認" | "黙認" | "不明"`）。2026-08-29 まで `cautions` の文字列（「黙認」など）を正規表現で見ていたが、**文言を書き換えると「公認なし」の表示が警告なく消えていた**。公認された無料開放地と黙認の河川敷では利用者が負う責任が違うので、フィールドに固定した。`validate-data.js` が「野営地なのに wildStatus が無い」でビルドを止める。
- 予算フィルタは `priceVerified` の最安額だけを判定に使う。未確認価格は予算内に混ぜない。
- **絞り込みと件数表示は `matchesFilters()` / `countMatching()` の同じ判定を通す。** 別々に書くと、ピルに出ている数字と押した結果がずれる。
- **タブの件数は `countByType(baseCamps)` で、いま表示できる母集団から数える。** 全件から数えると、押す前の数字と押した後の数が食い違う（野営地が11と出て2件しか出ない状態になっていた）。
- **`features.soloPlan` をこだわり条件にしない。** 「1名向け料金プランの有無」であって「ソロで泊まれるか」ではない。全件ソロ前提のこのサイトで絞り込みにすると、押した人ほどソロの定番から遠ざかる。
- 釣り・売店・車横付けなどは、確認済みの `features` が `true` の施設だけを該当として検索する。未確認を `false` と断定しない。
- 詳細ページの設備値が未確認なら「要確認」と表示する。存在しない、不可、と勝手に埋めない。
- `sitemap.ts` は通常掲載かつ根拠のある施設だけを載せる。根拠URLなし、閉鎖、営業確認中の詳細ページには `noindex` を付ける。
- 座標を出すかどうかの判定は必ず `lib/camp.ts` の `hasUsableCoord()` を通す。`lat/lng` が 0（未取得）または `needsCoord: true`（誤りと判明）は、地図ピン・座標リンク・構造化データのいずれにも出さない。各所に `lat !== 0` を直書きすると、条件を足したときに直し漏れた箇所だけが誤った位置を出し続ける。

## 直近で修正済みの内容

| 項目 | 修正内容 |
|---|---|
| 富士山YMCA | 公式料金に合わせ、車利用ソロ通常期を `¥3,795〜` へ修正 |
| モビリティーパーク | 公式地図リンクから施設実ピンを再確認して座標を修正。ただし `coordsVerified: true` のままなので `npm run validate` は現在も CITY_MISMATCH（住所と 0.21km）を警告する。フラグとデータの整合は未決着 |
| 料金未検証 | 固定金額を確認できない12件は数値表示を「料金 要確認」へ変更 |
| スコア | 未指定を含む148件を明示的に未検証扱いに統一 |
| 釣り | 神之川、谷太郎など公式根拠を得た3施設を `features.fishing: true` に設定 |
| 検索 | 「焚き火可」のクイック条件を外し、釣り・売店を追加。さらに予算と各条件を組合せ可能にした |
| 信頼性UI | カード・詳細・地図ポップアップに情報源・料金・位置・評価状態を表示 |
| SEO | canonical/Sitemapの公開先を Pages URLへ変更。根拠弱い詳細ページは検索の主導線から除外 |
| アクセシビリティ | フィルタボタンに `aria-pressed` を追加 |

## 残っている作業（優先順位）

> **ここは要約。順番と中身の正は `claude/継続メモ-2026-10-10.md` の「4. 次にやること」。**

1. **こだわり検索の画面修正**（最優先）。`components/FilterBar.tsx` の sticky をやめ、細い貼りつきバー・
   不透明背景・件数をラベル横・スマホは下からのシートに直し、**Playwright で重なり0pxを測る**
2. **門（なっぷ台帳）の続き**。静岡の残り124件 → 神奈川62件。千葉・山梨は完走済み
3. **実ピン待ち**。`needsCoord: true` が135件。加えて `coordsVerified: true` なのに機械検証を
   通っていない `kabutomushi-mori-camp` / `makioka-fruits-camp` は実ピンの引き直し待ち
4. **公式なしで保留している施設**。`hadano-togawa-camp`（秦野戸川公園）ほか、公式URLも予約URLも無い
   active レコードが19件（キャンプ場10 / 野営地9）
5. **`wildStatus: "不明"` の野営地1件**（`wadanagahama-kaigan`）。管理者の一次情報を探す。
   2026-08-29 に一巡しているので `claude/継続メモ-2026-08-27.md` の 2026-08-29 節を先に読む
6. **5軸評価**。まとめて推測採点せず、施設ごとの根拠を蓄積してから段階的に `scoresVerified` を上げる

### 判断待ち（本人が決めること）

**門の UNMEASURED が53件**（千葉28 / 山梨23 / 静岡2）。いちばん大きいのは
**「公式が料金を出さず『なっぷで』と誘導している施設を認めるか」**で、認めれば約40件が候補に戻る。
詳細は `claude/継続メモ-2026-10-10.md` の「6. 判断待ち」。

### 運用面の改善候補

- サイト単体のアクセス数・ページ別人気は未計測。Cloudflare Web Analytics 専用プロパティは未設定。
- 問い合わせ・訂正要望の送信フォームは未実装。お気に入りは端末ローカル保存で、運営側は集計できない。
- ただし、運営者はこれらの導入を「いったん実施しない」とした経緯がある。追加する場合は、プライバシー・送信先・スパム対策を先に合意する。

## データの重要フィールド

`lib/types.ts` の実装がすべてであり、下は要点の抜粋である。

```ts
status: "active" | "closed" | "unverified" | "suspended"   // seasonal / pending は存在しない
type?: "campground" | "wild"                               // 未指定は campground 扱い
coordsVerified / coordsGsiChecked / needsCoord
priceVerified / needsPrice / priceMin / priceMax / priceNote
scoresVerified                                             // 未指定は「未評価」
features: {
  bonfire? pet? shower? bath? carIn? soloPlan? convenience? shop? fishing? wifi? firewood? ice? alcohol?
  toilet?: "和式" | "洋式" | "ウォシュレット" | "温水便座" | "簡易" | "なし" | "不明"
  reservation?: "要" | "不要" | "ハイシーズンのみ"          // boolean ではない
  // boolean の未指定は「未確認」。false は公式に「なし・不可・禁止」と確認できた場合だけ使う
}
// 根拠URLはこの4つ。sourceUrl / bookingUrl / cautionUrl というフィールドは存在しない
officialUrl / reservationUrl / source[] / cautions[]
lastVerified: "YYYY-MM-DD"
restrictions[] / eligibility / needsVerify / suspendedNote / closedReason
```

`lib/camp.ts` の `hasEvidenceUrl()` は `officialUrl` / `reservationUrl` / `source[]` / `cautions[]` の
URLだけを見る。`filterAndSort()` は `features.carIn` と `features.reservation !== "不要"` を参照する。

`active` でも根拠・価格・座標・評価のすべてが確認済みとは限らない。各フラグを単独で見ること。

## Claudeへの作業上の注意

1. 施設公式ページ、自治体、公式予約先以外の記述を一次根拠として扱わない。Google Mapsの口コミは地図実ピンの確認以外に使わない。
2. URLが開けないことだけで閉業と断定しない。季節休業、告知ページ移転、アクセス制限の可能性がある。
3. 施設の設備・料金・ソロ可否・座標・5軸スコアを推測で補完しない。
4. 変更後は必ず `npm run validate && npm test && npm run build` を実行する。
5. Pages公開は `npm run build` のあと `npx wrangler pages deploy out --project-name soro-camp --branch main --commit-dirty=true` の1本だけ。`npm run deploy` / `npm run deploy:pages` / `wrangler deploy` は使わない。ダッシュボードのZIPアップロードも使わない（2026-08-29 に実ファイルが載らず404になる事象を確認済み）。新しい Pages プロジェクトは作らない。
6. `lib/site.ts` の既定URLを旧 Workers URLへ戻さない。独自ドメインを使う時だけ、ビルド前に `NEXT_PUBLIC_SITE_URL` で上書きする。
7. 実装を急ぐあまり、根拠なし施設を既定のおすすめ順・予算条件・地図に復帰させない。

## 参照資料の案内

| 資料 | 内容 |
|---|---|
| `HANDOVER_ARTIFACT_INDEX_2026-08-27.md` | パッケージに入れたファイルの索引 |
| **`claude/継続メモ-2026-10-10.md`** | **最新。本番件数・門の残り・なっぷ収穫・次にやること・今回決まったルール・判断待ち。まずこれを読む** |
| `claude/継続メモ-2026-08-27.md` | 起点・残タスク・8/19 までのフェーズとの接続（野営地の調査経緯はこちら） |
| `CLAUDE_TASK_PROMPT_2026-08-27.md` | 新規Claudeチャットへ貼り付ける開始プロンプト |
| `quality-rubric-30-reviewers-2026-08-26.md` | 30観点の品質ルーブリックと公開ゲート |
| `soro-camp-complete-quality-qa-2026-08-27.md` | 全体UX・SEO・品質改善のQA |
| `soro-camp-full-content-audit-final-2026-08-26.md` | 全掲載の再監査結果 |
| `soro-camp-trust-release-qa-2026-08-26.md` | 信頼性UIと情報状態の変更QA |
| `soro-camp-preference-filters-qa-2026-08-27.md` | 予算・希望条件検索のQA |
| `access-feedback-audit-2026-08-26.md` | アクセス計測・フィードバックの現状 |

このガイドの内容を基準に、過去の監査・調査資料を再利用して進めること。ゼロから調べ直して根拠の出どころを失わないこと。
