# 403 の判定を測り直した（2026-08-16）

**結論を先に: 「取得層の差」ではなかった。UA の差だった。**
そして**その前提を出したのはこちら**なので、まずそこを訂正する。

---

## 1. ★ 訂正 — 「同じ UA でも取得層で結果が違う」は誤り

前回こう報告した:

> `motosulakeside.com` は `fetchPage` 経由で200、素の fetch で403だった。
> **同じ UA でも取得層によって結果が違う。**

**「同じ UA」が間違っていた。**

```
scripts/district-sweep.js:71   const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) … Chrome/120.0.0.0 …'
scripts/check-official-urls.js:54  同じ Chrome UA
scripts/.parked-scan.js:15     const UA = 'ClaudeBot'
scripts/l1-link-rot.js:39      const UA = 'ClaudeBot'
```

**`fetchPage`（district-sweep）は最初から Chrome を名乗っていた。**
こちらが書いた `.parked-scan.js` と `l1-link-rot.js` だけが ClaudeBot だった。

### 1-1. 切り分け（2段階）

**まず「最初の1回だけ403なのでは」を潰した。**素の fetch を同じURLに2回投げる:

```
doshinomori.jp      素1回目=403  素2回目=403   fetchPage=200
takizawaen.com      素1回目=403  素2回目=403   fetchPage=200
tanzawakolodge.com  素1回目=403  素2回目=403   fetchPage=200
hananomori.jp       素1回目=403  素2回目=403   fetchPage=200
```

→ **順番・ウォームアップの効果ではない。**

**次に UA だけを入れ替えた**（同じ素の fetch・同じヘッダ・同じ間隔）:

| URL | ClaudeBot | Chrome |
|---|---|---|
| doshinomori.jp | **403** | **200** |
| takizawaen.com | **403** | **200** |
| tanzawakolodge.com | **403** | **200** |
| akikawaya.co.jp | **403** | **403** |

→ **UA だけで説明がつく。取得層（robots の事前取得・間隔・キャッシュ）は無関係。**

### 1-2. ★ もっと重い訂正 — 「UA 偽装はしない」と書き続けていたが、本体は Chrome を名乗っていた

こちらはこの数日、**「UA を偽装して回避しない」**と繰り返し書いてきた
（`§20-2`、FORBIDDEN のバナー文、japancamp の扱い、清和・千石台の403）。

**しかし千葉の調査で使った `district-sweep.js` は、最初から Chrome UA を名乗っている。**
君津市公式も南房総観光協会も県台帳も、**全部 Chrome を名乗って取得していた。**
`l1-link-rot.js` を ClaudeBot で書いたのはこちらの判断だが、
**その隣で本体が別の名前を名乗っていることに気づいていなかった。**

**方針として一貫していなかった。**どちらに揃えるかは、しゅんが決めること（§3）。

---

## 2. 【1】の測定結果 — 116件

`scripts/.fetch-layer-compare.js`（`--no-cache` で実行。キャッシュ由来を排除）。

| | 素の fetch（ClaudeBot） | fetchPage（Chrome UA） |
|---|---|---|
| OK | **92** | **114** |
| FORBIDDEN(403) | **23** | **1** |
| UNREACHABLE | 1 | 1 |

**判定が違うのは23件。うち22件が「ClaudeBot だと403 / Chrome だと200」。**
逆（Chrome で403・ClaudeBot で200）は**0件**。

**両方で403なのは `akiyamagawa-camp`（`akikawaya.co.jp`）の1件だけ。**

```
eichinomori / motosulakeside / wellcamp-nishitanzawa / doshi-no-mori / takizawaso /
tanzawako-lodge / karasawa-miyagase / mobility-park-izu / retreat-camp-mahoroba /
minoishtaki / narakoko / kuragari-camp / granpapa-solo-bocchi / hananomori-camp /
shinozawa-ootaki-camp / shimobe-yurucamp-sato / fujimangan-village / takaranoyama-fureai /
doshi-mori-cottage / kunowaki-shinsui / yagi-camp / kananomori-sanso      … 22件
```

### 2-1. これまでの報告のどこが変わるか

| これまでの報告 | 正しくは |
|---|---|
| 「既存 officialUrl 116件のうち**23件が403**」 | **ClaudeBot での数字。**プロジェクトの主要な収集器（district-sweep / check-official-urls）は Chrome UA なので、そこでは**403は1件** |
| 「唐沢・滝沢園・グランパパ・道志の森は施設公式が403で読めない」 | **`fetchPage` を使えば読めた。**§3-2 参照 |
| 「同じ UA でも取得層で結果が違う」 | **誤り。UA の差** |

**FORBIDDEN の実装そのものは変わらない。**403 を UNREACHABLE と混ぜないのは正しく、
`akikawaya.co.jp` という**実際に両方で弾かれる例**も残っている。
変わるのは**件数の意味づけ**だけ。

---

## 3. 統一するかの判断材料 — **技術ではなく方針の選択になった**

「取得層を fetchPage に統一する」は、**実質「Chrome UA に統一する」**という意味になる。

| 案 | 内容 | 代償 |
|---|---|---|
| **A** | 全部 **ClaudeBot** に揃える（district-sweep も変える） | **22サイトが403になる。**千葉の L1 3本のうち少なくとも `okuooi.gr.jp` 系は読めなくなり、**これまでの調査結果の一部が再現しなくなる** |
| **B** | 全部 **Chrome UA** に揃える（`.parked-scan.js` / `l1-link-rot.js` を寄せる） | 一貫はする。**ただしこれは「偽装しない」と言ってきたことの撤回**になる |
| **C** | **現状のまま、どちらがどれを名乗るかを明記する** | 一貫しないが、**測定の意味が読み手に伝わる**。`l1-link-rot` の「測れず26件」は ClaudeBot での数字だと分かる |

**こちらからは C を推す。**理由:

- **A は情報を失う。**しかも過去の調査（千葉の L1 3本）を否定することになる
- **B は、断っているサイトに対して名前を偽ることを全面化する。**
  `japancamp.jp` は robots.txt ごと403で明確に断っており、そこに Chrome を名乗って入るのは、
  **これまでの判断とも、こちらから提案した §20-2 とも矛盾する**
- **C なら、いま出ている数字を捨てずに済む。**「ClaudeBot では22件が見えない」という事実自体が、
  **サイト側の意思の測定値**として意味がある

**ただしこれはこちらが決めることではない。**B を採るなら、
`§20-2` と FORBIDDEN のバナー文（「UA を偽装して回避しない」）を書き直す必要がある。

---

## 4. 【2】PARKED の測り直し — **再スキャンは要らない。既に Chrome UA の数字が出ている**

前回「読める全件で PARKED 0件」と報告したものには**2つの実行が混ざっていた。**

| 実行 | UA | 対象 | PARKED |
|---|---|---|---|
| `.parked-scan.js` | **ClaudeBot** | officialUrl 116件（23件が403で読めず） | 0件 ← **弱い** |
| **`check-official-urls.js` 第3回** | **Chrome** | `status: active` 147件 | **0件** ← **こちらが本番** |

**第3回の内訳（Chrome UA）:**

```
OK 100 / CLOSED_HINT 8 / CLOSED_HINT_NEWS 2 / DEAD 2 / NO_URL 35 / PARKED 0
```

- `NO_URL` 35件は URL が無いので対象外
- `DEAD` 2件は `fuji-ymca`（TLS証明書チェーン）と `akiyamagawa-camp`（Chrome でも403）
- **本文まで読めたのは 110件**（OK 100 + CLOSED_HINT 8 + CLOSED_HINT_NEWS 2）

→ **`status: active` で URL があり本文が読めた110件すべてに、パーキング・売却ページは無い。**
読めなかったのは**2件だけ**（TLS 1件・403 1件）。

**前回の「23件は見えていなかった」という留保は外れる。**
あれは ClaudeBot 側の数字で、本番の判定は最初から Chrome UA で全件を見ていた。

> ただし `unverified` 32件・`suspended` 2件は `check-official-urls.js` の対象外
> （`status === 'active'` のみ）。**そこは今も測っていない。**

---

## 5. 【3】保留一覧 — 次に開く人へ

**今日から持ち越すのは7件。**

### 5-1. 判断待ち（電話で決まる）

| レコード | 保留の中身 | 決め方 |
|---|---|---|
| **`karasawa-miyagase`** | **テント泊が可能か。**公式に `bangaro.html`「バンガロー宿泊のお客様へ」があり、「宿泊不可」とは言い切れない。実態は「テント泊不可・バンガロー可」の可能性 | **電話 046-288-1318**。掲載可否が決まる |
| `tanzawako-lodge` | サイト料金 **3,300（DB）vs 2,200（Manus）**。自治体系2本はどちらも**入場料1,650円しか出しておらず**サイト料金が無い | 電話 0465-78-3156（受付8:00〜19:00） |
| `kunowaki-shinsui` | 番地 **自治体系180 / DB・Manus 280**。大字（久野脇）は同じなので地区は変わらない | 施設公式 `kunowaki.net`（**Chrome UA なら読める**）か電話 0547-56-1781 |

### 5-2. 設計の判断が要る

| 項目 | 中身 |
|---|---|
| **`status` に「利用形態」の軸が無い** | 4値（active/closed/unverified/suspended）は全部**営業状況**の軸。「営業しているがテント泊できない」を表す値が無い。唐沢が確定したら、`status` に混ぜず `features` 側のフラグ（例 `overnight: false`）を足すのが素直 |
| **UA をどちらに揃えるか** | §3。**方針の選択**であって技術の問題ではない |

### 5-3. 実施が決まっているが未実施

| レコード | 内容 |
|---|---|
| `kunowaki-shinsui` / `yagi-camp` | `priceVerified: true` → `false` + **`needsPrice: true`**。現在 `0/0` なのに `priceVerified: true` で「0円と確認した」と読める |
| `motosulakeside` | **`tel`** を `null` → `0555-87-2093`（富士河口湖町観光連盟）。`telNote` に由来を残す |
| `motosulakeside` | `priceMin`/`priceMax`/`priceNote` を **3,000 / 4,000 / 公式料金表**へ。**施設公式の料金表で確定済み**（Sサイト＝最大2名 標準3,000・ハイ3,500・ピーク4,000・お盆4,000／普通車1台目無料） |

### 5-4. 触らないと決めたもの

| レコード | 理由 |
|---|---|
| `kuragari-camp` の `id` | 実体は**丹沢湖キャンプサイト**（山北町玄倉490-2）。`id` は玄倉の読み違い。`slug` でもあり URL になるので変えるとリンクが切れる。**記録だけ残す**（引き継ぎ §20-6） |
| `takaranoyama-fureai` の `closedReason` | **`abolished` のまま**が正しい（都留市の施設＝公共施設の用途廃止）。Manus の `closed_business` 提案は誤り |

---

## 6. 【4】引き継ぎへの追記（§20-6 〜 §20-9）

`scripts/引き継ぎ_2026-08-07.md` の §20 に4節を足す案。**まだ書いていない。**

```markdown
### 20-6. `id` は名前ではない — `kuragari-camp` の実体は丹沢湖キャンプサイト

`kuragari-camp` の中身は **`丹沢湖キャンプサイト`（神奈川県足柄上郡山北町玄倉490-2）**。
**愛知県岡崎市の「くらがりキャンプ場」とは無関係。**

由来は `b817f37 feat: add batch6 36 camps` の初出時の名前 **「玄倉キャンプ場」**で、
**玄倉（くろくら）を「くらがり」と読んで id を付けた**もの。
`name` は後に直されたが `id` だけ残った。実在は山北町公式・山北町観光協会の両方で確認済み
（観光協会の住所が DB と完全一致）。

`id` は `slug` でもあり `/camp/kuragari-camp` という **URL になる**ので直していない。

**教訓: `id` で施設を同定しない。**2026-08-16 に外部から
「愛知県の施設が入っている」という指摘が来たが、見ていたのは `id` だけだった。
突き合わせは `name` と `address` で行う。

### 20-7. `season: "通年"` を疑う — 2件とも誤りだった

`motosulakeside` と `tanzawako-lodge` が両方 `"通年"` だったが、**両方とも誤り。**

- 本栖レークサイド … 施設公式に「**2026年度の営業期間 4月16日〜11月末（予定）**」。
  6・10・11月の火水は定休。12月と年末年始は別途HPで案内（前年度は1月4日まで営業）
- 丹沢湖ロッヂ … **山北町公式と山北町観光協会の2本が揃って「3月〜12月」**

**「通年」は「調べていない」の言い換えになりやすい。**
`season` は自治体系か施設公式で必ず裏を取ること。
**冬に行って閉まっている**型の実害が出るので、料金の誤りより重い場合がある。

なお `season` は詳細ページの表示だけでなく**メタディスクリプションにも
`${camp.season}営業。` の形で入る**ので、長すぎる文字列を入れない
（本栖は一度72字で書いて53字に詰めた。既存の最長は47字）。

### 20-8. ★ 403 の出方は UA で決まる。取得層ではない

2026-08-16 に「同じ UA でも取得層で結果が違う」と書いたが、**誤り。**

`district-sweep.js` と `check-official-urls.js` の `UA` は **Chrome を名乗る文字列**、
`.parked-scan.js` と `l1-link-rot.js` は **`ClaudeBot`**。**UA が違っていただけ。**

実測（`scripts/.fetch-layer-compare.js --no-cache`、officialUrl 116件）:

| | ClaudeBot | Chrome |
|---|---|---|
| OK | 92 | **114** |
| 403 | **23** | **1** |

**両方で403なのは `akikawaya.co.jp` の1件だけ。**逆方向は0件。
「最初の1回だけ403」ではないことも、同一URLへの2連投で確認済み。

**数字を引用するときは、どの UA で測ったかを必ず書くこと。**
`l1-link-rot` の「測れず26件」も、`.parked-scan.js` の403も、**ClaudeBot での数字**。

### 20-9. 外部の指摘は、検証してから優先度を付ける

2026-08-16 に外部（Manus）から「重い判定3件」として受け取ったものは、
**3件とも DB 側が正しかった。**

| 指摘 | 実際 |
|---|---|
| `doshi-no-mori` の住所が 10701 | DB は既に `10041`（道志村公式と一致） |
| `kuragari-camp` は愛知県の施設 | 実体は丹沢湖キャンプサイト（山北町玄倉490-2） |
| `akiyamagawa-camp` が山梨県上野原市 | DB は既に `相模原市緑区名倉25` |

そして**その3件を確認する過程で、指摘に無かった誤りが5件見つかった**
（`akiyamagawa` の soloComment と reservation、`takizawaso` の priceMax、
`motosulakeside` と `tanzawako-lodge` の season）。

**教訓: 外部の優先度をそのまま採らない。**
「重い」と言われたものが軽く、言われていない隣が重いことがある。
**まず DB の現在値を出し、次に一次情報を当て、それから優先度を付け直す。**
```

---

## 7. 今日ここまでで書き込んだもの

| ファイル | 内容 |
|---|---|
| `data/campgrounds.json` | **`season` 2件のみ**（motosulakeside / tanzawako-lodge）。`lastVerified` も更新 |
| `scripts/継続メモ_2026-08-16.md` | 電話リストを4件 → **6件**（唐沢を最優先で追加・丹沢湖ロッヂも追加） |

`npm run validate` は **17件のまま**（増減なし）。件数188件のまま。

**引き継ぎ §20-6〜20-9 はまだ書いていない**（§6 が本文案）。
**デプロイもしていない。**

## 8. していないこと

- 引き継ぎへの追記（§6 の4節）
- デプロイ（`season` 2件は本番に出ていない）
- UA をどちらに揃えるかの実装（§3。**方針の判断待ち**）
- `unverified` 32件・`suspended` 2件の URL チェック（`check-official-urls.js` の対象外）
- §5 の保留7件
