export type Campground = {
  id: string;
  slug: string;
  name: string;
  prefecture: "神奈川" | "静岡" | "山梨";
  area: string;
  address: string;
  /** 省略時は "campground"（管理されたキャンプ場）。"wild" は野営地。 */
  type?: "campground" | "wild";
  /** 野営地の注意事項。あれば詳細ページに ⚠️ セクションで表示する。 */
  cautions?: string[];
  lat: number;
  lng: number;
  /** 座標を目視確認済みなら true。未設定・false は要確認（scripts/coord-tool.html の対象）。 */
  coordsVerified?: boolean;
  /** 施設の同定そのものが怪しく、優先的に裏取りすべきものに true。 */
  needsVerify?: boolean;
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
    toilet: "和式" | "洋式" | "ウォシュレット" | "温水便座" | "簡易" | "なし";
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
