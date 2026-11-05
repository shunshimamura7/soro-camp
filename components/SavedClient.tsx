"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Campground } from "@/lib/types";
import { useFavorites } from "@/components/FavoriteButton";

/**
 * 保存した施設の比較（2026-11-05 新設。審査員2・10）。
 * - 最大4件を横に並べる。値は一覧と同じデータ（公式で確認できたもの）だけで、未確認は「未確認」と書く
 * - `?ids=a,b,c` で共有できる。共有URLで開いたときは、その施設を表示する（自分の保存は書き換えない）
 */
const MAX = 4;

function priceText(c: Campground) {
  if (c.type === "wild") return "無料";
  if (c.priceVerified !== true || c.priceMin <= 0) return "未確認";
  return c.priceMax > c.priceMin ? `¥${c.priceMin.toLocaleString()}〜¥${c.priceMax.toLocaleString()}` : `¥${c.priceMin.toLocaleString()}`;
}
const yn = (v: boolean | undefined, yes = "あり", no = "なし") => (v === true ? yes : v === false ? no : "未確認");

const ROWS: [string, (c: Campground) => string][] = [
  ["ソロ1名1泊", priceText],
  ["チェックイン", (c) => { const x = c.officialFacts?.checkin; return x ? [x.in && `IN ${x.in}`, x.out && `OUT ${x.out}`].filter(Boolean).join(" ／ ") : "記載なし"; }],
  ["営業期間", (c) => (c.season.includes("要確認") ? "未確認" : c.season)],
  ["風呂（場内）", (c) => yn(c.features.bath)],
  ["シャワー", (c) => yn(c.features.shower)],
  ["トイレ", (c) => (!c.features.toilet || /不明|要確認/.test(c.features.toilet) ? "未確認" : c.features.toilet)],
  ["焚き火", (c) => yn(c.features.bonfire, "可", "不可")],
  ["直火", (c) => c.officialFacts?.jikabi?.status ?? "記載なし"],
  ["薪の販売", (c) => yn(c.features.firewood)],
  ["バイク", (c) => c.officialFacts?.bike?.status ?? "記載なし"],
  ["管理人・夜間", (c) => c.officialFacts?.manager?.status ?? "記載なし"],
  ["女性向け", (c) => c.officialFacts?.women?.status ?? "記載なし"],
  ["予約", (c) => c.features.reservation || "未確認"],
  ["確認した日", (c) => (c.lastVerified && c.lastVerified !== "2025-01-01" ? c.lastVerified : "未記録")],
];

export default function SavedClient({ camps }: { camps: Campground[] }) {
  const favs = useFavorites();
  const [shared, setShared] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const ids = new URLSearchParams(window.location.search).get("ids");
    if (ids) setShared(ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX));
  }, []);
  const ids = shared ?? favs;
  const bySlug = useMemo(() => new Map(camps.map((c) => [c.slug, c])), [camps]);
  const list = ids.map((s) => bySlug.get(s)).filter((c): c is Campground => Boolean(c)).slice(0, MAX);

  const share = async () => {
    const url = `${window.location.origin}/saved?ids=${list.map((c) => c.slug).join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("このURLをコピーしてください", url);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 sm:pt-8">
      <nav aria-label="パンくずリスト" className="text-[13px] text-[#6b5d50] mb-2 flex gap-1 items-center">
        <Link href="/" className="inline-flex items-center min-h-[44px] pr-1 hover:text-[#b5440e]">トップ</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">保存した施設を比べる</span>
      </nav>
      <h1 className="text-[22px] sm:text-3xl font-bold text-[#1c1814] leading-tight">{shared ? "共有された施設を比べる" : "保存した施設を比べる"}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#4a3f35]">
        最大{MAX}件まで横に並べます。値は公式で確認できたものだけで、確認できていないものは「未確認」「記載なし」と書きます。
      </p>

      {list.length === 0 ? (
        <p className="mt-8 text-[14px] text-[#4a3f35]">
          まだ保存した施設はありません。一覧のカードの「☆保存」で保存できます。
          <Link href="/" className="ml-1 font-semibold text-[#b5440e] underline">一覧へ</Link>
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={share} className="min-h-[44px] px-4 rounded-xl bg-[#b5440e] text-white text-[14px] font-semibold">
              比較のURLをコピー
            </button>
            {shared && (
              <button type="button" onClick={() => { setShared(null); history.replaceState(null, "", "/saved"); }} className="min-h-[44px] px-4 rounded-xl border border-[#b5440e] bg-white text-[#b5440e] text-[14px] font-semibold">
                自分の保存を表示
              </button>
            )}
            <p role="status" className="self-center text-[13px] text-[#2a6e3f]">{copied ? "コピーしました" : ""}</p>
          </div>
          {ids.length > MAX && <p className="mt-2 text-[13px] text-[#6b5d50]">保存は{ids.length}件あります。先頭の{MAX}件を表示しています。</p>}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#e9e2d8] bg-white">
            <table className="min-w-[640px] w-full text-[14px]">
              <caption className="sr-only">保存した施設の比較</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-28 p-3 text-left text-[12px] text-[#6b5d50] font-semibold">項目</th>
                  {list.map((c) => (
                    <th key={c.slug} scope="col" className="p-3 text-left align-top">
                      <Link href={`/camp/${c.slug}`} className="font-bold text-[#1c1814] underline decoration-[#d8c3ad] underline-offset-2 hover:text-[#b5440e]">{c.name}</Link>
                      <span className="block text-[12px] font-normal text-[#6b5d50]">{c.prefecture}・{c.area}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, fn]) => (
                  <tr key={label} className="border-t border-[#f0eae1]">
                    <th scope="row" className="p-3 text-left text-[13px] font-normal text-[#6b5d50] align-top">{label}</th>
                    {list.map((c) => {
                      const v = fn(c);
                      const muted = /^(未確認|記載なし|未記録)$/.test(v);
                      return <td key={c.slug} className={`p-3 align-top ${muted ? "text-[#6b5d50]" : "font-semibold text-[#1c1814]"}`}>{v}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12px] text-[#6b5d50]">「記載なし」は公式ページで見つからなかった項目です。「不可」や「なし」という意味ではありません。</p>
        </>
      )}
    </div>
  );
}
