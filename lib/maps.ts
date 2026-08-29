import type { Campground } from "./types";

/**
 * Google マップへ飛ばすリンクを1か所で組み立てる。
 *
 * ここに集めた理由：「周辺施設を探す」だけが旧パス形式
 * `/maps/search/<検索語>/@lat,lng,11z` のまま取り残されていて、
 * 押してもそのキャンプ場を中心にした地図にならなかった。
 * 同じ式が page.tsx / MapModal / MapView の3か所にベタ書きされていたので、
 * 1か所だけ直しても残り2か所が古いまま残る形になっていた。
 *
 * 旧パス形式が中心を外す理由は2つ：
 *
 * 1. `/maps/search/` はテキスト検索を実行する形式で、`@lat,lng` は
 *    **Google 側へのヒントでしかない**。検索結果が見つかればそちらに
 *    ビューポートを持っていかれる。座標は「必ずここを中心にしろ」という
 *    指示にはならない。
 * 2. `11z` は緯度35°で 62m/px ＝ 1000px 幅の画面でおよそ **横60km**。
 *    仮に中心が効いてもキャンプ場は点にしかならず、
 *    「そのキャンプ場のアングル」には見えない。
 *
 * なので座標をURLに埋めるのをやめ、公式の Maps URLs API
 * (`/maps/search/?api=1&query=`) に寄せる。これは「Googleマップで開く」が
 * すでに使っていて正しく動いている形式で、ズーム指定を持たない代わりに
 * **クエリが指す場所にGoogleが勝手に寄せてくれる**。
 */
const MAPS_SEARCH = "https://www.google.com/maps/search/?api=1&query=";

/** 施設そのものを開く。施設名＋住所で一意に引ける。 */
export function campMapUrl(camp: Pick<Campground, "name" | "address">): string {
  return MAPS_SEARCH + encodeURIComponent(`${camp.name} ${camp.address ?? ""}`.trim());
}

type NearbyTarget = Pick<Campground, "address" | "lat" | "lng">;

/**
 * 周辺の「用事」を1語で探す。
 *
 * 場所の指定は座標ではなく **住所** を使う。`api=1` 形式に中心を渡す手段が
 * 無いこと、そして「Googleマップで開く」が施設名＋住所で正しく動いている
 * 実績があること、加えて座標が疑わしいレコード（`coordsVerified` 未確定）でも
 * 住所は使えることによる。
 */
function nearbySearchUrl(what: string, camp: NearbyTarget): string {
  // 住所が無いレコードだけ座標にフォールバックする（現データでは0件）
  const near = camp.address?.trim() || `${camp.lat},${camp.lng}`;
  return MAPS_SEARCH + encodeURIComponent(`${what} ${near}`);
}

/**
 * 周辺の買い物先を探す。
 *
 * 検索語を「スーパー」1語に絞った。**Google マップに OR は無い**ので、
 * `api=1` 形式にしても「スーパーマーケット 精肉店 鮮魚店 スーパー銭湯 銭湯」は
 * 5語まとめて1本の検索文字列として扱われる。5語すべてに当たる店は存在せず、
 * あいまい一致に落ちて無関係な土地へ飛ぶ。URL形式を直しても、
 * 検索語の意味は変わらないのでここを絞らないと直らない。
 */
export function nearbyShoppingUrl(camp: NearbyTarget): string {
  return nearbySearchUrl("スーパー", camp);
}

/**
 * 周辺の日帰り温泉を探す。
 *
 * 買い物と風呂は別の用事なので、1本の検索語にまとめない。
 * Google マップに OR は無く、「スーパー 日帰り温泉」は2語すべてに当たる場所を
 * 探しにいって当たらない。用事ごとにリンクを分けるのが唯一の直し方。
 *
 * 検索語を「日帰り温泉」にしたのは、宿泊施設の温泉ではなく
 * その日に立ち寄れる風呂を探しているから。銭湯・スーパー銭湯も
 * この語でおおむね拾える。
 */
export function nearbyBathUrl(camp: NearbyTarget): string {
  return nearbySearchUrl("日帰り温泉", camp);
}
