# L1 が指す外部リンクの腐食 — 2026-08-15

**「L1 に載っているから正しい」を疑う検査。**
自治体公式・観光協会が施設の公式サイトへ貼っているリンクを叩いて、生きているかを見る。

> **403 は「リンク切れ」ではない。**先方がこの UA を拒否しているだけで、サイトは生きていることが多い。
> `district-sweep` の `FORBIDDEN` と同じ理屈で、**生存率の分母から外す**（測れていない）。
> **UA は ClaudeBot。偽装しない。**

対象は登録済み L1 のうち外部リンクを持つもの。詳細ページは1ソース 6 件で打ち切っている。

> **旅行代理店・予約導線は別枠にしてある**（ANA旅作・JAL・びゅうトラベル等）。
> 施設公式ではないので腐食率の分母に入れない。**混ぜると山中湖村が33%に見えたが、実際は0%だった。**

## ソース別の生存率

| 市町村 | L1 | 外部リンク | 生存 | 切れ | 売却/停止 | 測れず(403) | **腐食率** |
|---|---|---|---|---|---|---|---|
| 山北町 | 山北町公式 キャンプ場の紹介 | 9 | 4 | 3 | 0 | 2 | **43%**（3/7） |
| 松田町 | 松田町公式 観光サイト キャンプ場 | 9 | 3 | 1 | 0 | 5 | **25%**（1/4） |
| 相模原市 | 相模原市観光協会 キャンプ場一覧 | 7 | 4 | 0 | 0 | 3 | **0%**（0/4） |
| 相模原市 | 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | 13 | 9 | 0 | 0 | 4 | **0%**（0/9） |
| 厚木市 | 厚木市観光協会 あつぎ観光なび 泊まる | 4 | 4 | 0 | 0 | 0 | **0%**（0/4） |
| 山北町 | 山北町観光協会 自然に泊まる | 6 | 3 | 0 | 0 | 3 | **0%**（0/3） |
| 富士河口湖町 | 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる | 7 | 6 | 0 | 0 | 1 | **0%**（0/6） |
| 道志村 | 道志村役場観光情報サイト キャンプ場紹介 | 12 | 10 | 0 | 0 | 2 | **0%**（0/10） |
| 山中湖村 | 山中湖観光協会 泊まる | 6 | 6 | 0 | 0 | 0 | **0%**（0/6） |
| 上野原市 | 上野原市公式 発見うえのはら キャンプ | 3 | 2 | 0 | 0 | 1 | **0%**（0/2） |
| 川根本町 | 川根本町公式 キャンプ（詳細は川根本町観光協会 okuooi.gr.jp） | 5 | 0 | 0 | 0 | 5 | **測れず**（0/0） |

## 切れているリンク（DEAD / PARKED）

| 市町村 | L1 | 判定 | リンク文言 | URL | 理由 |
|---|---|---|---|---|---|
| 松田町 | matsuda-town | **DEAD** | http://www.kanagawa-kank | http://www.kanagawa-kankou.or.jp/stay/camp/nishitanzawa/camp-332.html | HTTP 404 |
| 山北町 | yamakita-town | **DEAD** | バウアーハウスジャパン | http://www.bowerhouse-japan.com/ | HTTP 401 |
| 山北町 | yamakita-town | **DEAD** | 西丹沢中川ロッジ | http://r.goope.jp/nakagawa-lodge | HTTP 404 |
| 山北町 | yamakita-town | **DEAD** | くろくら森の家 | http://kurokuramorinoietanzawa.web.fc2.com/ | HTTP 503 |

## 測れなかったリンク（403 / 429）

**これらは「切れている」ではない。**この収集器から見えないだけ。

| 市町村 | L1 | URL | 理由 |
|---|---|---|---|
| 相模原市 | e-sagamihara | https://oshima-sagami.com/sbd/2025/11/25/%E4%BB%A4%E5%92%8C%ef%bc%97%E5%B9%B4%E5%96%B6%E6%A5%AD%E7%B5%82%E4%BA%86%E3%81%A8%E4%BB%A4%E5%92%8C%ef%bc%98%E5%B9%B4%E5%96%B6%E6%A5%AD%E9%96%8B%E5%A7%8B%E6%97%A5%E7%A8%8B%E3%81%AA%E3%81%A9%E3%81%AE/ | この UA を拒否（測れず） |
| 相模原市 | e-sagamihara | http://www.oshima-sagami.com/ | この UA を拒否（測れず） |
| 相模原市 | e-sagamihara | http://www.akikawaya.co.jp/ | この UA を拒否（測れず） |
| 相模原市 | midori-navi | http://www.oshima-sagami.com/sbd/ | この UA を拒否（測れず） |
| 相模原市 | midori-navi | https://sagamiko.info/ | この UA を拒否（測れず） |
| 相模原市 | midori-navi | https://info-fujino.com/ | この UA を拒否（測れず） |
| 相模原市 | midori-navi | https://morilab-fujino.jp/news/e2026829/ | この UA を拒否（測れず） |
| 松田町 | matsuda-town | https://nomukuu.com/ | この UA を拒否（測れず） |
| 松田町 | matsuda-town | http://www.ashigarakami-sci.net/ | この UA を拒否（測れず） |
| 松田町 | matsuda-town | https://matsuda.ashigarakami-sci.net/ | この UA を拒否（測れず） |
| 松田町 | matsuda-town | https://nisihira-park.org/ | この UA を拒否（測れず） |
| 松田町 | matsuda-town | https://ashigara-local.jp/ | この UA を拒否（測れず） |
| 山北町 | yamakita-town | http://sbs.sakura.ne.jp/tanzawa-camp/index.html | この UA を拒否（測れず） |
| 山北町 | yamakita-town | https://www.yodukugawa.com/ | この UA を拒否（測れず） |
| 山北町 | yamakita-kankou | https://www.yodukugawa.com/ | この UA を拒否（測れず） |
| 山北町 | yamakita-kankou | https://tanzawakolodge.com/ | この UA を拒否（測れず） |
| 山北町 | yamakita-kankou | https://tanzawa-camp.sakura.ne.jp/ | この UA を拒否（測れず） |
| 富士河口湖町 | fujikawaguchiko-renmei | https://www.fujilake.co.jp/ | この UA を拒否（測れず） |
| 川根本町 | kawanehon-town | https://okuooi.gr.jp/outdoor/details.php?id=79 | この UA を拒否（測れず） |
| 川根本町 | kawanehon-town | https://okuooi.gr.jp/outdoor/details.php?id=81 | この UA を拒否（測れず） |
| 川根本町 | kawanehon-town | https://okuooi.gr.jp/outdoor/details.php?id=80 | この UA を拒否（測れず） |
| 川根本町 | kawanehon-town | https://okuooi.gr.jp/outdoor/details.php?id=76 | この UA を拒否（測れず） |
| 川根本町 | kawanehon-town | https://okuooi.gr.jp/outdoor/details.php?id=78 | この UA を拒否（測れず） |
| 道志村 | doshi-kanko-jp | http://doshi-kanko.com/ | この UA を拒否（測れず） |
| 道志村 | doshi-kanko-jp | http://doshi-kanko.com/moricote/ | この UA を拒否（測れず） |
| 上野原市 | uenohara-city | https://www.calmmountainakiyama.com/ | この UA を拒否（測れず） |

## 旅行代理店・予約導線（腐食率の分母に入れない）

（なし）

**合計 81リンク: 生存 51 / 切れ 4 / 売却・停止 0 / 測れず 26。腐食率 7%（4/55）**