import type { Restriction, RestrictionType } from "./types";

/**
 * 期間限定制限のビルド時ユーティリティ。
 *
 * 「今日が制限期間内か」の判定はここには置かない。静的サイトなのでビルド時に
 * 判定すると翌日には嘘になる。判定は閲覧時に `public/restrictions.js` が行い、
 * このファイルは常に「要確認」側の初期表示を組み立てる役に徹する。
 */

export const RESTRICTION_META: Record<RestrictionType, { icon: string; label: string }> = {
  bonfire: { icon: "🔥", label: "焚き火" },
  camping: { icon: "⛺", label: "キャンプ" },
  access:  { icon: "🚧", label: "立入" },
};

/**
 * MM-DD の書式検査（`isValidMD`）と期間判定（`isActive`）は
 * `public/restrictions.js` を唯一の実装とする。あちらは閲覧時に実際に走るコードで、
 * かつ素の JS なので validate-data.js とテストからそのまま require できる。
 * ここに同じ判定を書くと二重管理になるので置かない。
 */

/** 年をまたぐ期間か（12-10 〜 04-25 のような冬期閉鎖） */
export function wrapsYear(r: Pick<Restriction, "from" | "to">): boolean {
  return r.from > r.to;
}

/** "07-03" → "7/3" */
export function formatMD(md: string): string {
  return `${Number(md.slice(0, 2))}/${Number(md.slice(3, 5))}`;
}

/** "7/3〜8/31" */
export function formatPeriod(r: Pick<Restriction, "from" | "to">): string {
  return `${formatMD(r.from)}〜${formatMD(r.to)}`;
}

/**
 * source から表示用ラベルとリンク先を切り出す。
 * "三浦市海水浴場ルール第25条 https://example.jp/x.pdf"
 *   → { label: "三浦市海水浴場ルール第25条", url: "https://example.jp/x.pdf" }
 */
export function parseSource(source: string): { label: string; url?: string } {
  const m = source.match(/https?:\/\/\S+/);
  if (!m) return { label: source.trim() };
  const label = source.replace(m[0], "").trim();
  return { label: label || m[0], url: m[0] };
}

/** 静的HTMLに出す既定のラベル。JS が動かなければこれが残る。 */
export function defaultLabel(type: RestrictionType): string {
  const { icon, label } = RESTRICTION_META[type];
  return `${icon} ${label}（期間制限あり・要確認）`;
}

/** 同じ type の制限をまとめる。バッジは type ごとに1つ出す。 */
export function groupByType(restrictions: Restriction[]): Array<[RestrictionType, Restriction[]]> {
  const order: RestrictionType[] = ["camping", "access", "bonfire"];
  return order
    .map((t) => [t, restrictions.filter((r) => r.type === t)] as [RestrictionType, Restriction[]])
    .filter(([, list]) => list.length > 0);
}
