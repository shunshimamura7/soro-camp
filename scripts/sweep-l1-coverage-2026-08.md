# L1 の網羅率（2026-08）

`node scripts/district-sweep.js --l1-coverage`

**測り方**: `priceVerified: true` かつ `needsVerify` なしのレコード＝実在がほぼ確実な群。
その市町村ぶんを取り出して、L1 の一覧に何件が載っているかを数えた（名前一致、または大字＋番地の一致）。

**なぜ測るか**: `tiny-camp-village`（厚木市七沢1854・料金確認済み）が ORPHAN に落ちた。
一覧に載らない実在施設がある L1 では、「載っていない」ことに意味が無い。

**判定**: 網羅率 70% 以上の L1 が1つでもあれば、その市町村の ORPHAN は判定として読む。
無ければ参考値に落とす（地区の md にも同じ判定が出る）。

| 市町村 | L1 | 一覧件数 | 実在確実 | うち掲載 | 網羅率 | ORPHAN 判定 |
|---|---|---|---|---|---|---|
| 相模原市 | 相模原市観光協会 キャンプ場一覧 | 22 | 15 | 12 | 80% | 使える |
|  | 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ | 17 | 15 | 9 | 60% |  |
| 厚木市 | 厚木市観光協会 あつぎ観光なび 泊まる | 1 | 1 | 0 | 0% | **使えない** |
| 松田町 | 松田町公式 観光サイト キャンプ場 | 1 | 1 | 0 | 0% | **使えない** |
| 山北町 | 山北町公式 キャンプ場の紹介 | 7 | 8 | 3 | 38% | **使えない** |
|  | 山北町観光協会 自然に泊まる | 9 | 8 | 5 | 63% |  |
| 伊東市 | （L1_NOT_FOUND） | – | 1 | – | – | **使えない** |
| 富士河口湖町 | 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる | 17 | 13 | 5 | 38% | **使えない** |
| 山梨市 | （L1_NOT_FOUND） | – | 1 | – | – | **使えない** |
| 川根本町 | 川根本町公式 キャンプ（詳細は川根本町観光協会 okuooi.gr.jp） | 5 | 8 | 5 | 63% | **使えない** |
| 道志村 | 道志村役場観光情報サイト キャンプ場紹介 | 31 | 12 | 9 | 75% | 使える |
| 山中湖村 | 山中湖観光協会 キャンプ特集 | 0 | 6 | 0 | 0% | **使えない** |
| 北杜市 | （L1_NOT_FOUND） | – | 9 | – | – | **使えない** |
| 伊豆市 | （L1_NOT_FOUND） | – | 8 | – | – | **使えない** |
| 静岡市 | （L1_NOT_FOUND） | – | 5 | – | – | **使えない** |
| 富士宮市 | （L1_NOT_FOUND） | – | 13 | – | – | **使えない** |
| 南部町 | （L1_NOT_FOUND） | – | 4 | – | – | **使えない** |

## 落ちている施設

実在がほぼ確実なのに L1 の一覧に無いもの。**この分だけ ORPHAN は誤検出する。**

- **相模原市 / 相模原市観光協会 キャンプ場一覧** — `doshi-no-yu-camp`, `ogurabashi-kasenjiki`, `takadabashi-kasenjiki`
- **相模原市 / 相模原市 ぐるっと緑区ミドナビ（市公式）キャンプ** — `aone`, `doshi-no-yu-camp`, `sagamiko-pleasure-camp`, `ogurabashi-kasenjiki`, `takadabashi-kasenjiki`, `fujino-art-camp`
- **厚木市 / 厚木市観光協会 あつぎ観光なび 泊まる** — `tiny-camp-village`
- **松田町 / 松田町公式 観光サイト キャンプ場** — `hachibanaen-miroku`
- **山北町 / 山北町公式 キャンプ場の紹介** — `ootaki`, `wellcamp-nishitanzawa`, `yamakita-camp`, `mitsumata-camp`, `shiraishi-auto-camp`
- **山北町 / 山北町観光協会 自然に泊まる** — `wellcamp-nishitanzawa`, `yamakita-camp`, `mitsumata-camp`
- **富士河口湖町 / 富士河口湖町観光連盟 富士河口湖町観光情報サイト 泊まる** — `picafuji-saiko`, `fujigane-kogen`, `shojiko-camping`, `kawaguchiko-hanto`, `retreat-camp-mahoroba`, `pica-fujiyama-camp`, `camp-akaike`, `oishii-camp`
- **川根本町 / 川根本町公式 キャンプ（詳細は川根本町観光協会 okuooi.gr.jp）** — `okooigawa-lake`, `sumatakyo-camp`, `fudonotaki-auto`
- **道志村 / 道志村役場観光情報サイト キャンプ場紹介** — `woodsman-camp`, `suigennnomori`, `doshi-mori-cottage`
- **山中湖村 / 山中湖観光協会 キャンプ特集** — `yamanakako-misaki`, `komeidoso-auto`, `muraei-yamanakako`, `fujigoko-auto-camp`, `fujinomori-yamanakako`, `yamanakako-minami-auto`

## この測り方の限界

- **母数が小さい市町村がある。**実在確実が1〜2件だと網羅率は0%か100%にしかならず、
  7割の線を引く意味が薄い。件数を必ず併せて見ること
- `priceVerified: true` は「料金を一次情報で確認した」であって実在の証明ではない。
  §6-13 のとおり**閉鎖した施設ほど料金付きの情報が残る**ので、
  この群にも実在しないものが混じりうる
- **網羅率は下限値。**名前一致は共通の `name-match.js` を使っているので、名寄せの穴が
  そのまま網羅率の穴になる。実例: `camp-akaike`（データ名「CAMP AKAIKE」）は
  富士河口湖町の一覧に「キャンプあかいけ」で載っているが、**ローマ字と かな は照合できず**落ちている。
  つまり実際の網羅率はここに出た数字より高い。
  **ORPHAN を「使えない」側に倒す誤差なので、安全側ではある**（§6-7）
