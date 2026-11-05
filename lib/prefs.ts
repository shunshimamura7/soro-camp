/** 県名と県別ページの URL（/pref/<slug>）。県別の着地ページは 2026-11-05 新設（審査員8） */
export const PREF_SLUG: Record<string, string> = {
  神奈川: "kanagawa",
  静岡: "shizuoka",
  山梨: "yamanashi",
  千葉: "chiba",
};
export const PREF_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(PREF_SLUG).map(([name, slug]) => [slug, name])
);
