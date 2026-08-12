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
 * 「誰が使えるか」の制限の型。調査で4種類が出てきた（scripts/batch76-check.md）。
 *
 * - `exclusive`  … 排他型。市外の人は使えない（甲府市 森林浴広場＝利用対象者が甲府市民）
 * - `discount`   … 料金差型。使えるが市外は割高（乙女森林公園＝市民800円／市外2,000円）
 * - `priority`   … 申込先行型。居住者の予約受付が先に始まる（ふれあいの森日向）
 * - `membership` … 会員制。登録しないと使えない（BUSHCRAFT湘南）
 *
 * このサイトの読者は市外から来る人が大半なので、`discount` の場合
 * `priceMin` には**市外料金**を入れる。
 */
export type EligibilityType = "exclusive" | "discount" | "priority" | "membership";

/**
 * 利用できる人の制限（例: 甲府市民限定）。
 * 日付に依存しないのでビルド時に静的出力する。
 * restrictions の JS が失敗しても、この表示は必ず残る。
 */
export type Eligibility = {
  /** 制限の型。表示の文言を型ごとに変える */
  type: EligibilityType;
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
   * - `"suspended"` … **再開予定のある休業**。一覧から外し、詳細ページに休業中である旨を出す。
   *
   * `closed` と `suspended` を分けている理由。`closed` は「もう行ってはいけない」だが、
   * `suspended` は「今は行けないが将来復活する」。`hayakawa-camp`（早川町オートキャンプ場）が
   * 災害復旧のため数ヵ年の休業に入っており、閉鎖と同じ警告を出すと事実と違う。
   *
   * 既存リンク対策として `"active"` 以外もページ自体は残し、サイトマップにも含める。
   */
  status: "active" | "closed" | "unverified" | "suspended";
  /**
   * `status: "suspended"` のときの休業理由と再開見込み。出典URLを含めて書く。
   * 例: "災害復旧後のリニューアルオープンを目指して休業中。再開まで数ヵ年を要する見込み https://example.jp/"
   */
  suspendedNote?: string;
  /**
   * `status: "closed"` の**内訳**。詳細ページの赤い警告の文面がこれで変わる。
   *
   * 3値に分けた理由。以前は closed 全件に
   * 「この場所は現在キャンプが禁止されています。訪問しないでください」を出していたが、
   * これが正しいのは自治体がキャンプを禁じた `sanogawa-camp` だけだった。
   * **廃止された市営施設や閉業した民間キャンプ場に「禁止されている」と書くのは事実と違う。**
   * 逆に、閉業した施設に「訪問しないでください」と書くと、
   * その土地に立ち入ること自体が禁じられているように読める。
   *
   * - `prohibited` … 場所は在るが**キャンプ行為が禁じられた**。管理者・自治体の判断。
   *   利用者への意味は「行っても泊まれない。行為が違反になる」
   * - `abolished` … **公共施設として用途を廃止**した。行政の決定で、跡地は別用途になることが多い
   * - `closed_business` … **民間の施設が営業を終了**した。倒産・撤退・移転など
   *
   * `abolished` と `closed_business` を分けているのは、確かめ先が違うため。
   * 前者は自治体の告知に当たれば確定するが、後者は公式サイトの生死・予約サイトの表記から推定する。
   * 復活の芽も違う（廃止された公共施設は戻らない。民間は事業者が変わって再開しうる）。
   */
  closedReason?: "prohibited" | "abolished" | "closed_business";
  /**
   * `status: "closed"` のときの補足。**いつ・誰が・何をしたか**を1文で書き、出典URLを含める。
   * `suspendedNote` と同じ扱いで、詳細ページの警告の下に出す。
   * 例: "伊勢原市が令和6年3月に用途を廃止。跡地は企業の森として利用されている https://example.jp/"
   */
  closedNote?: string;
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
   * `needsVerify` の中身。**何を探して何が無かったか**を1文で書き、出典URLを含める。
   *
   * **「まだ調べていない」と「調べたが確認できなかった」を区別するために要る。**
   * フラグだけでは次に見た人が同じ調査を最初からやり直す。
   * `needsPrice` を新設したのと同じ理由（あちらは料金、こちらは実在・同定）。
   *
   * 書き方の型: 「YYYY-MM-DD 調査。◯◯（自治体公式など）に該当名なし URL。◯◯は別施設」
   *
   * **一覧に無いことは存在しないことの証明ではない**（§6-7）。
   * だから `status` は変えず、`needsVerify` に留める。
   */
  needsVerifyNote?: string;
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
  /**
   * ## 定義（2026-08-12 に立て直した）
   *
   * **一次情報（施設公式サイト・電話・自治体ページ）で料金を確認し、
   * その出典が `officialUrl` / `tel` / `cautions` のいずれかに記録されている**なら true。
   *
   * 「確認した」と「出典を残した」の両方が要る。出典が1つも記録されていないレコードは、
   * あとから誰も検算できないので確認済みとは言えない。
   *
   * ## 旧定義と、なぜ変えたか
   *
   * 当初の判定基準は **`priceNote`（内訳）を書けたかどうか**だった。
   * 「料金を実際に調べた人は内訳を必ず書ける」という推定に基づく代理指標で、
   * 2026-08-07 の `9fd15e3` が `scripts/apply-price-verified.js` で
   * **`priceNote` の有無だけを見て126件に機械的に true を立てた**（人が1件ずつ確認したのではない）。
   *
   * この推定は**内訳ごと生成されうる状況で崩れる**。`yadoriki-camp` の
   * 「大人500円+サイト500円〜」は出典がどこにも無い生成値だったが、内訳の体裁があるため
   * true が立っていた。生成された内訳が確認済みフラグの根拠になる循環になっていた。
   * 経緯は `scripts/pricenote-format-check.md`。
   *
   * ## 現状
   *
   * **`9fd15e3` で立った126件は、この新定義を満たしているか未検証。**
   * `scripts/validate-data.js` が「true なのに出典が1つも無い」を警告として出すので、
   * まずそこに出る件数を潰し、そのうえで残りを再判定する。
   *
   * ## 表示への影響
   *
   * false のときは金額を表示せず「料金 要確認」とし、価格順ソートの末尾に回し、
   * soloScore の計算では `scores.value` の代わりに中立値3を使う
   * （`scores.value` 自体は書き換えない。料金を確認したら元の値がそのまま復活する）。
   */
  priceVerified?: boolean;
  /**
   * 料金を一次情報まで当たって探したが、**公開されていなかった**ものに true。
   *
   * `priceVerified` が false なだけでは「調べていない」のか「調べたが出なかった」のかが
   * 区別できず、次に絞り込んだ人が同じ手順で調べ直すことになる。本フラグはその再調査を止める印。
   * どこを当たって何が無かったかは `scripts/price24-check.md` に1件ずつ書いてある。
   *
   * 立てるときは `priceMin`/`priceMax` を 0 に落とす。根拠のない数字を残すと、
   * 将来 `priceVerified` を立て直した瞬間にその数字が表に出るため。
   * `scripts/validate-data.js` が「needsPrice なのに priceMin に数字がある」をエラーにする。
   *
   * 出なかった理由には型がある（詳細は price24-check.md）。
   * - 変動料金体系で固定料金が存在しない（PICAさがみ湖）
   * - 会員制で1泊単価が定義できない（キャンプ場此処野静岡）
   * - 同名の別拠点があって料金の帰属が決まらない（接岨YANBY）
   * - 施設の同定自体ができていない（静波海岸キャンプサイト。`needsVerify` も併用）
   */
  needsPrice?: boolean;
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
