# MISSING HIGH からの掲載追加（2026-08-10）

追加候補 5件 → **追加 5件 / 重複スキップ 0件**

`district-sweep.js` の MISSING HIGH 22件を1件ずつ検証し、3条件
（キャンプ場か／ソロで泊まれるか／今も営業しているか）を満たした5件。
判定の全記録は `missing-high-2026-08.md`。

重複チェックは slug・正規化した施設名・**大字＋番地**の3通りで実施した。
番地を見ないと、名前の違いで同一施設を新規投入してしまう（22件中2件がそれだった）。

## 全件に共通すること

- **座標なし。**全件 `lat/lng = 0` + `needsCoord: true`。
  Google Places を使わない方針で取得しておらず、推測で入れると §6-16 の捏造になる
- **`soloComment` は全件空。**実在と実態が確定してから書く。
  `validate-data.js` の必須フィールドに `soloComment` は入っていないので空で通る
- `lastVerified: 2026-08-10` / `status: active`

## scores の根拠

**根拠が無い軸は「根拠なし」と書いてある。**そこは推測値なので、現地または一次情報で確認したら直すこと。

| slug | 名前 | 静けさ | 絶景 | コスパ | アクセス | 設備 |
| --- | --- | --- | --- | --- | --- | --- |
| `fujino-art-camp` | 藤野芸術の家キャンプ場 | 4<br><sub>**根拠なし**</sub> | 3<br><sub>**根拠なし**</sub> | 3<br><sub>テント持込1張り3,000円・駐車無料</sub> | 4<br><sub>JR藤野駅からバス5分＋徒歩1分／相模湖ICから約5分</sub> | 4<br><sub>シャワー・トイレ完備、体験工房併設</sub> |
| `saiko-kohan-camp` | 西湖湖畔キャンプ場 | 3<br><sub>**根拠なし**</sub> | 4<br><sub>西湖の湖畔</sub> | 4<br><sub>大人1,500円／1名</sub> | 3<br><sub>**根拠なし**</sub> | 3<br><sub>**根拠なし**</sub> |
| `saiko-tsuhara-camp` | 西湖津原キャンプ場 | 3<br><sub>**根拠なし**</sub> | 4<br><sub>西湖の湖畔（林間サイト・湖畔サイト）</sub> | 4<br><sub>オートキャンプ1名1,500円</sub> | 3<br><sub>**根拠なし**</sub> | 3<br><sub>**根拠なし**</sub> |
| `shiraishi-auto-camp` | 白石オートキャンプ場 | 4<br><sub>西丹沢キャンプ場群の最上流</sub> | 4<br><sub>中川川の渓流沿い</sub> | 2<br><sub>車両単位で二輪4,000円・車7,000円</sub> | 2<br><sub>丹沢湖からさらに上流</sub> | 3<br><sub>**根拠なし**</sub> |
| `nishitanzawa-nakagawa-lodge` | 西丹沢中川ロッヂ | 4<br><sub>**根拠なし**</sub> | 3<br><sub>**根拠なし**</sub> | 3<br><sub>キャンプサイト3,000円〜／名</sub> | 2<br><sub>**根拠なし**</sub> | 4<br><sub>キャンプサイト全33区画・レンタル品・隣接の交流の里</sub> |

### 根拠がない軸

- `fujino-art-camp`: 静けさ(4)、絶景(3)
- `saiko-kohan-camp`: 静けさ(3)、アクセス(3)、設備(3)
- `saiko-tsuhara-camp`: 静けさ(3)、アクセス(3)、設備(3)
- `shiraishi-auto-camp`: 設備(3)
- `nishitanzawa-nakagawa-lodge`: 静けさ(4)、絶景(3)、アクセス(2)

## 料金

`priceMin` は**ソロ1名が実際に払う総額**（入場料・駐車料・管理費込み）。

| slug | priceMin | priceMax | 課金方式 |
| --- | --- | --- | --- |
| `fujino-art-camp` | 3000 | 3000 | 人数単位／区画単位 |
| `saiko-kohan-camp` | 1500 | 2500 | 人数単位＋駐車料が別 |
| `saiko-tsuhara-camp` | 1500 | 1500 | 人数単位／区画単位 |
| `shiraishi-auto-camp` | 4000 | 7000 | **車両単位**（ソロでも満額） |
| `nishitanzawa-nakagawa-lodge` | 3000 | 3500 | 人数単位＋駐車料が別 |

## needsVerify を立てたもの

| slug | 理由 |
| --- | --- |
| `nishitanzawa-nakagawa-lodge` | 営業根拠が町観光協会（山北町観光協会）の更新のみで、施設公式・予約枠が未確認。施設公式サイトが見つからず、なっぷ・じゃらんの掲載も確認できていない。掲載ページ自体の更新日も不明。出典: https://www.yamakita.net/stay/detail.php?id=11&type=2 （同サイトは 2026/07/07 のお知らせを掲載しており、サイト全体は更新されている）。次にやること: 予約専用携帯 090-7715-8522 で営業とソロ利用の可否を確認する。 |

## 営業根拠の強さ

| slug | 営業の根拠 | 強さ |
| --- | --- | --- |
| `saiko-tsuhara-camp` | 施設公式が**当日のサイト空き状況**と営業日カレンダーを掲載 | 強 |
| `fujino-art-camp` | 施設公式に2026年の表記とオープン期間 | 中 |
| `saiko-kohan-camp` | 施設公式に2026年の表記 | 中 |
| `shiraishi-auto-camp` | 施設公式に2026年の表記 | 中 |
| `nishitanzawa-nakagawa-lodge` | 町観光協会サイトの更新のみ | **弱（needsVerify）** |
