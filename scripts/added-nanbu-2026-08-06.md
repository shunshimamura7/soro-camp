# 南部町（山梨）のキャンプ場追加（2026-08-06）

追加候補 6件 → **追加 6件 / 重複スキップ 0件**

重複チェックは slug の一致と、正規化した施設名の一致の両方で実施。

## scores の根拠

料金は e/f を除き未提示のため `priceMin/priceMax = 0`（表示は「要問合せ」）。
ターキーズハウスのみ `priceNote` に実額を記載。

| slug | 名前 | 静けさ | 絶景 | コスパ | アクセス | 設備 |
| --- | --- | --- | --- | --- | --- | --- |
| `fukushigawa-seishonen` | 福士川渓谷青少年旅行村 | 5<br><sub>渓谷奥・青少年旅行村</sub> | 4<br><sub>七ッ釜の滝・風吹の滝・吊り橋</sub> | 4<br><sub>**根拠なし**</sub> | 2<br><sub>奥山温泉と同エリアの山間部</sub> | 3<br><sub>奥山グリーンロッジ併設・徒歩圏に温泉</sub> |
| `fukushigawa-auto` | 福士川オートキャンプ場 | 4<br><sub>**根拠なし**</sub> | 3<br><sub>**根拠なし**</sub> | 4<br><sub>**根拠なし**</sub> | 2<br><sub>井出駅から徒歩約40分</sub> | 3<br><sub>**根拠なし**</sub> |
| `turkeys-house` | ターキーズハウス | 4<br><sub>こぢんまりとした規模</sub> | 3<br><sub>**根拠なし**</sub> | 5<br><sub>大人500円</sub> | 2<br><sub>井出駅から徒歩約59分</sub> | 3<br><sub>**根拠なし**</sub> |
| `lumberjack-nanbu` | ランバージャック | 5<br><sub>小さなオートキャンプ場</sub> | 3<br><sub>**根拠なし**</sub> | 3<br><sub>**根拠なし**</sub> | 2<br><sub>**根拠なし**</sub> | 4<br><sub>炊事場・トイレ・入浴施設・薪販売</sub> |
| `nekumasanso-auto` | 福士川根熊山荘ファミリーオートキャンプ場 | 4<br><sub>**根拠なし**</sub> | 3<br><sub>福士川がサイト横を流れる</sub> | 4<br><sub>**根拠なし**</sub> | 2<br><sub>**根拠なし**</sub> | 3<br><sub>民宿の敷地内</sub> |
| `sanogawa-camp` | 佐野川キャンプ場 | 5<br><sub>管理者不在の無料野営地</sub> | 3<br><sub>**根拠なし**</sub> | 5<br><sub>無料</sub> | 2<br><sub>**根拠なし**</sub> | 1<br><sub>設備情報なし</sub> |

### 根拠がない軸

- `fukushigawa-seishonen`: コスパ(4)
- `fukushigawa-auto`: 静けさ(4)、絶景(3)、コスパ(4)、設備(3)
- `turkeys-house`: 絶景(3)、設備(3)
- `lumberjack-nanbu`: 絶景(3)、コスパ(3)、アクセス(2)
- `nekumasanso-auto`: 静けさ(4)、コスパ(4)、アクセス(2)
- `sanogawa-camp`: 絶景(3)、アクセス(2)

## needsVerify を立てたもの

| slug | 理由 |
| --- | --- |
| `minobe-camp` | 南部町にその名称の施設を確認できず |
| `nekumasanso-auto` | tel・詳細が未取得 |
| `sanogawa-camp` | 無料野営地のため現況・正式名称とも未確認 |

## 銀河もみじキャンプ場の記述修正

「日本一の星空」は出典不明の最上級表現のため削除した。
川根本町の他施設が「澄んだ星空 全国第2位」としているため、
同一の町について異なる順位を主張する矛盾も解消される。
順位の言及自体を外し、観測できる事実（天の川が見える暗さ）の記述に置き換えた。
