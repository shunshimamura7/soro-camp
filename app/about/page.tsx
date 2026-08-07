import type { Metadata } from "next";
import Link from "next/link";
import { activeCampgrounds } from "@/lib/camp";

export const metadata: Metadata = {
  title: "このサイトについて — スコアの見方とデータの扱い",
  description:
    "ソロキャン羅針盤の5軸スコアの定義、soloScore の計算式（静けさ・絶景を2倍で重み付け）、データの出典と鮮度についての注意書き。",
};

const AXES: Array<{ key: string; label: string; weight: string; desc: string; scale: string[] }> = [
  {
    key: "quietness",
    label: "静けさ",
    weight: "×2",
    desc: "夜の静かさ、隣サイトとの距離、団体・ファミリー層の多さ。ソロで過ごす時間の質を最も左右する軸。",
    scale: [
      "5 — 区画が離れ、夜はほぼ無音。ソロ専用区画があるなど",
      "4 — 基本的に静か。混雑期でも落ち着いている",
      "3 — 平均的。週末はそれなりに賑わう",
      "2 — 団体・ファミリーが多く、話し声が届く",
      "1 — 常時賑やか。静けさは期待できない",
    ],
  },
  {
    key: "scenery",
    label: "絶景",
    weight: "×2",
    desc: "サイトから見える景色。富士山・湖・渓谷・海など、そこでしか得られない眺め。",
    scale: [
      "5 — 目的地になりうる景観。富士山や湖が正面に開ける",
      "4 — 印象に残る眺めがある",
      "3 — 平均的な林間・河原",
      "2 — 景色は特筆すべきものがない",
      "1 — 眺望なし",
    ],
  },
  {
    key: "value",
    label: "コスパ",
    weight: "×1",
    desc: "料金に対する満足度。ソロ料金の設定があるか、設備に見合う価格か。",
    scale: [
      "5 — 無料または相場よりかなり安い",
      "4 — 相場より安い、ソロ割がある",
      "3 — 相場どおり",
      "2 — やや高い",
      "1 — 設備に対して割高",
    ],
  },
  {
    key: "access",
    label: "アクセス",
    weight: "×1",
    desc: "主要道路からの距離、道の走りやすさ、買い出しのしやすさ。",
    scale: [
      "5 — 幹線道路沿い。買い出しも容易",
      "4 — 迷わず行ける。スーパーが近い",
      "3 — 平均的",
      "2 — 山道が長い、買い出しに戻れない",
      "1 — 悪路・長距離。四駆推奨など",
    ],
  },
  {
    key: "facility",
    label: "設備",
    weight: "×1",
    desc: "トイレの清潔さ・様式、シャワーや風呂、水場、売店の有無。",
    scale: [
      "5 — ウォシュレット、風呂、売店まで揃う",
      "4 — 清潔なトイレとシャワーがある",
      "3 — 一通り揃っている",
      "2 — 最低限。和式トイレのみなど",
      "1 — トイレ・水場なし",
    ],
  },
];

export default function AboutPage() {
  // 「掲載しています」と書く以上、一覧に出る件数（status === 'active'）と一致させる。
  const total = activeCampgrounds.length;
  const wild = activeCampgrounds.filter((c) => c.type === "wild").length;
  // ここでの unverified は lastVerified の鮮度の話で、status: 'unverified' とは別概念。
  const unverified = activeCampgrounds.filter(
    (c) => !c.lastVerified || c.lastVerified.trim() === "" || c.lastVerified === "2025-01-01"
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-16">
      <nav className="text-xs text-slate-500 mb-4">
        <Link href="/" className="hover:text-slate-700">
          ← 一覧
        </Link>
      </nav>

      <h1 className="font-['Shippori_Mincho_B1','Noto_Serif_JP',serif] text-2xl sm:text-3xl font-bold text-[#0e0d0b] leading-tight mb-3">
        このサイトについて
      </h1>
      <p className="text-[15px] text-slate-600 leading-[1.9] mb-8">
        神奈川・静岡・山梨のキャンプ場と野営地を、ソロキャンプの視点で比較するためのサイトです。
        現在 {total} 件（うち野営地 {wild} 件）を掲載しています。
      </p>

      {/* 5軸 */}
      <section className="mb-10">
        <h2 className="font-['Shippori_Mincho_B1','Noto_Serif_JP',serif] text-lg sm:text-xl font-bold text-[#0e0d0b] mb-3">
          5軸スコアの定義
        </h2>
        <p className="text-[14px] text-slate-600 leading-[1.9] mb-4">
          各キャンプ場を5つの軸で1〜5の整数で評価しています。
        </p>

        <div className="flex flex-col gap-4">
          {AXES.map((a) => (
            <div
              key={a.key}
              className="bg-white rounded-2xl border border-[#e2ddd8] p-4 sm:p-5"
            >
              <div className="flex items-baseline gap-2 mb-1.5">
                <h3 className="font-['Shippori_Mincho_B1','Noto_Serif_JP',serif] text-[16px] font-bold text-[#0e0d0b]">
                  {a.label}
                </h3>
                <span className="font-['JetBrains_Mono',monospace] text-[11px] px-1.5 py-0.5 rounded bg-[#f5f0ea] text-[#6b5a4e] border border-[#e2ddd8]">
                  重み {a.weight}
                </span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-3">{a.desc}</p>
              <ul className="flex flex-col gap-1">
                {a.scale.map((s) => (
                  <li
                    key={s}
                    className="font-['JetBrains_Mono',monospace] text-[12px] text-[#5a5050] leading-relaxed"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* soloScore */}
      <section className="mb-10">
        <h2 className="font-['Shippori_Mincho_B1','Noto_Serif_JP',serif] text-lg sm:text-xl font-bold text-[#0e0d0b] mb-3">
          soloScore の計算式
        </h2>
        <p className="text-[14px] text-slate-600 leading-[1.9] mb-3">
          一覧の「おすすめ順」はこの値の降順です。5軸から計算した派生値なので、
          データに直接持たせてはいません。
        </p>
        <div className="bg-[#0e0d0b] rounded-2xl p-4 sm:p-5 mb-4 overflow-x-auto">
          <code className="font-['JetBrains_Mono',monospace] text-[12px] sm:text-[13px] text-[#e8c89a] whitespace-nowrap">
            soloScore = (静けさ×2 + 絶景×2 + コスパ + アクセス + 設備) ÷ 7
          </code>
        </div>
        <p className="text-[14px] text-slate-600 leading-[1.9]">
          <strong className="text-[#0e0d0b]">静けさと絶景だけを2倍にしている理由。</strong>
          ソロキャンプでは、設備の充実や買い出しの利便性は「あれば良い」程度の要素です。
          一方で、隣の話し声が一晩中聞こえる場所と、静寂の中で焚き火を眺められる場所とでは、
          体験そのものが別物になります。景色も同じで、目の前に富士山や湖が開けているかどうかは、
          ソロで過ごす時間の価値を大きく左右します。
          グループキャンプなら重みは変わるはずですが、このサイトはソロ前提なので、
          代えのきかない2軸を重くしています。
        </p>
      </section>

      {/* データについて */}
      <section className="mb-10">
        <h2 className="font-['Shippori_Mincho_B1','Noto_Serif_JP',serif] text-lg sm:text-xl font-bold text-[#0e0d0b] mb-3">
          データの出典と鮮度
        </h2>
        <p className="text-[14px] text-slate-600 leading-[1.9] mb-4">
          掲載情報は各キャンプ場の公式サイト、予約サイト、地図サービス、および公開情報をもとに整理しています。
          座標は OpenStreetMap との照合と目視確認を併用しています。
          スコアは公開情報にもとづく当サイトの評価であり、実測値ではありません。
        </p>

        <div className="rounded-xl border border-[#e8611f] bg-white px-4 py-3 mb-4">
          <p className="text-[13px] leading-relaxed text-[#e8611f]">
            現在 {unverified} 件は情報を確認できていません。該当ページには
            「この情報は未確認です」と表示しています。料金・営業期間・予約要否・焚き火の可否は
            変更されることがあるため、訪問前に必ず公式サイト等でご確認ください。
          </p>
        </div>

        <p className="text-[14px] text-slate-600 leading-[1.9]">
          確認済みのページには「最終確認: YYYY-MM-DD」を表示しています。
          野営地は管理者不在・設備なしの場所を含みます。直火の可否や現在の開放状況は
          自治体の判断で変わるため、各ページの注意事項を必ずお読みください。
        </p>
      </section>

      <div>
        <Link href="/" className="text-blue-500 text-sm hover:underline">
          ← キャンプ場一覧に戻る
        </Link>
      </div>
    </div>
  );
}
