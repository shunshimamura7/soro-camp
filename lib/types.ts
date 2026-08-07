/** 期間限定の制限が何にかかるか。 */
export type RestrictionType = "bonfire" | "camping" | "access";

/**
 * 毎年繰り返される期間限定の制限。
 *
 * 年を持たない MM-DD で表すので、`from > to`（例 12-10 〜 04-25）は
 * 年をまたぐ期間を意味する。判定は閲覧時のローカル日付で行う（`public/restrictions.js`）。
 * ビルド時に判定すると翌日には嘘になるため、静的HTMLは常に「要確認」を出す。
 */
export type Restriction = {
  type: RestrictionType;
  /** "07-03" 形式の MM-DD。年は持たない（毎年繰り返すため） */
  from: string;
  /** "08-31" 形式の MM-DD。from より小さければ年またぎ */
  to: string;
  /** 制限の内容。利用者が読む文面 */
  reason: string;
  /**
   * 根拠。条例名・資料名と、あれば URL を続けて書く。
   * 例: "三浦市海水浴場ルール第25条 https://example.jp/rule.pdf"
   * 表示側は最初の http(s) URL をリンクにし、残りをラベルとして扱う。
   */
  source: string;
};

/**
 * 利用できる人の制限（例: 甲府市民限定）。
 * 日付に依存しないのでビルド時に静的出力する。
 * restrictions の JS が失敗しても、この表示は必ず残る。
 */
export type Eligibility = {
  /** チップに出す短い文言。例: "甲府市民限定" */
  label: string;
  /** 補足。詳細ページにのみ出す */
  note?: string;
  /** 根拠。Restriction.source と同じ書式 */
  source: string;
};

export type Campground = {
  id: string;
  slug: string;
  name: string;
  prefecture: "神奈川" | "静岡" | "山梨";
  area: string;
  address: string;
  /** 省略時は "campground"（管理されたキャンプ場）。"wild" は野営地。 */
  type?: "campground" | "wild";
  /**
   * 掲載状態。
   *
   * - `"active"` … 通常掲載。一覧に出る。
   * - `"closed"` … 閉鎖・利用禁止が確認できたもの。一覧から外し、詳細ページに警告を出す。
   * - `"unverified"` … 営業状況が確認できていないもの。一覧から外し、詳細ページに注意書きを出す。
   *
   * 既存リンク対策として `"active"` 以外もページ自体は残し、サイトマップにも含める。
   */
  status: "active" | "closed" | "unverified";
  /** 野営地の注意事項。あれば詳細ページに ⚠️ セクションで表示する。 */
  cautions?: string[];
  /** 毎年繰り返される期間限定の制限。一覧・詳細に警告チップを出す。 */
  restrictions?: Restriction[];
  /** 利用できる人の制限。日付に依存しないので静的に表示する。 */
  eligibility?: Eligibility;
  lat: number;
  lng: number;
  /**
   * **人が地図上で目視確認した**なら true。未設定・false は要確認（scripts/coord-tool.html の対象）。
   *
   * 機械検証の結果をここに書かないこと。両者を混ぜていたため、
   * 実際には海上・湖面を指している7件に true が立ったまま残り、
   * 「確認済み」を理由に検証対象から外れる危険があった（scripts/sea-coord-check.md）。
   */
  coordsVerified?: boolean;
  /**
   * 国土地理院の逆ジオコーディングを通過したなら true。
   * 「返ってきた市区町村が prefecture と矛盾せず、海上・湖面でもない」ことだけを意味する。
   *
   * 通過しても地点が正しいとは限らない（同じ市内の別地点でも通る）ので、
   * `coordsVerified` の代わりにはならない。scripts/verify-coords-gsi.js が判定の元になる。
   */
  coordsGsiChecked?: boolean;
  /** 施設の同定そのものが怪しく、優先的に裏取りすべきものに true。 */
  needsVerify?: boolean;
  /**
   * 正しい座標が確定していないものに true。次の2通りがある。
   *
   * 1. 座標をまだ取得できていない … lat/lng は 0 のまま残す（推測値で埋めない）。
   *    `scripts/validate-data.js` は lat===0 && lng===0 のとき本フラグを必須にする。
   * 2. 入っている座標が誤りと分かっているが、差し替える値をまだ確定できていない …
   *    誤った座標をそのまま残すよりフラグで示す。0 で潰すと「未取得」と区別できなくなるため、
   *    lat/lng は誤った値のまま残す（scripts/sea-coord-check.md の CANDIDATE 2件がこれ）。
   */
  needsCoord?: boolean;
  priceMin: number;
  priceMax: number;
  priceNote?: string;
  scores: {
    quietness: number;
    scenery: number;
    value: number;
    access: number;
    facility: number;
  };
  features: {
    bonfire: boolean;
    bonfireNote?: string;
    pet: boolean;
    petNote?: string;
    shower: boolean;
    showerNote?: string;
    bath: boolean;
    bathNote?: string;
    /** "不明" は「トイレはあるが様式が未確認」。無いことが確認できていれば "なし"。 */
    toilet: "和式" | "洋式" | "ウォシュレット" | "温水便座" | "簡易" | "なし" | "不明";
    toiletNote?: string;
    carIn: boolean;
    carInNote?: string;
    soloPlan: boolean;
    soloPlanNote?: string;
    reservation: "要" | "不要" | "ハイシーズンのみ";
    reservationNote?: string;
    convenience: boolean;
    shop: boolean;
    wifi?: boolean;
    firewood: boolean;
    firewoodNote?: string;
    ice: boolean;
    alcohol: boolean;
    garbage: string;
    nearbySupermarket: string;
    nearbyShop: string;
  };
  season: string;
  closedDays?: string;
  soloComment: string;
  officialUrl?: string;
  reservationUrl?: string;
  tel?: string | null;
  telNote?: string;
  /**
   * 情報を最後に確認した日（YYYY-MM-DD）。
   *
   * - `"2025-01-01"` … batch 一括投入時に入れたプレースホルダ。**未確認**を意味し、
   *   実際に確認した日ではない。二重登録として削除した2件はいずれもこの日付だった。
   * - `""`（空） … 確認日を持たないもの（野営地など）。同じく未確認扱い。
   * - それ以外の日付 … 実際に情報を確認した日。
   *
   * 未確認のものは詳細ページに注意書きを出す。件数は
   * `node scripts/unverified-list.js` で洗い出せる。
   */
  lastVerified: string;
  source?: string[];
};
