/**
 * エリア別の着地ページ（2026-11-05 審査員8）。area の先頭（「・」の前）が同じ施設をまとめる。
 * キャンプ場が5件以上あるエリアだけ（薄いページを作らない）。件数は areas ページ側で数え直し、5件未満なら生成しない
 */
export const AREAS: { slug: string; pref: string; name: string }[] = [
  { slug: "doshimura", pref: "山梨", name: "道志村" },
  { slug: "hokuto", pref: "山梨", name: "北杜" },
  { slug: "kimitsu", pref: "千葉", name: "君津" },
  { slug: "asagiri", pref: "静岡", name: "朝霧高原" },
  { slug: "tateyama", pref: "千葉", name: "館山" },
  { slug: "yamanakako", pref: "山梨", name: "山中湖" },
  { slug: "minamiboso", pref: "千葉", name: "南房総" },
  { slug: "hamamatsu", pref: "静岡", name: "浜松" },
  { slug: "fujinomiya", pref: "静岡", name: "富士宮" },
  { slug: "izu", pref: "静岡", name: "伊豆" },
  { slug: "kawaguchiko", pref: "山梨", name: "河口湖" },
  { slug: "kawanehoncho", pref: "静岡", name: "川根本町" },
  { slug: "isumi", pref: "千葉", name: "いすみ" },
  { slug: "saiko", pref: "山梨", name: "西湖" },
  { slug: "fuji", pref: "静岡", name: "富士" },
  { slug: "futtsu", pref: "千葉", name: "富津" },
  { slug: "ichihara", pref: "千葉", name: "市原" },
  { slug: "doshigawa", pref: "神奈川", name: "道志川" },
  { slug: "nishitanzawa", pref: "神奈川", name: "西丹沢" },
  { slug: "minamiizu", pref: "静岡", name: "南伊豆" },
  { slug: "susono", pref: "静岡", name: "裾野" },
  { slug: "kiyosato", pref: "山梨", name: "清里" },
  { slug: "yamanashishi", pref: "山梨", name: "山梨市" },
  { slug: "minamialps", pref: "山梨", name: "南アルプス" },
  { slug: "kakegawa", pref: "静岡", name: "掛川" },
  { slug: "gotemba", pref: "静岡", name: "御殿場" },
  { slug: "nishiizu", pref: "静岡", name: "西伊豆町" },
  { slug: "kashiwa", pref: "千葉", name: "柏" },
];
export const areaKey = (area: string) => area.split("・")[0];
