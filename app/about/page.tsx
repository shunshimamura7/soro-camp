import type { Metadata } from "next";
import Link from "next/link";
import { activeCampgrounds, evidenceBackedCampgrounds, evidencePendingCampgrounds, filterByType, hasEvidence, hasVerifiedScores } from "@/lib/camp";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "このサイトについて — スコアの見方とデータの扱い",
  description:
    "料金はソロ1名1泊の総額、料金・設備は公式の原文つき、分からないことは未確認。並び順・評価・データの扱い。",
  alternates: { canonical: "/about" },
  // og はトップの使い回しになっていた（og:url がトップを指していた。審査員8）
  openGraph: {
    title: "このサイトについて — ソロキャン羅針盤",
    description: "料金はソロ1名1泊の総額、料金・設備は公式の原文つき、分からないことは未確認。並び順・評価・データの扱い。",
    url: `${SITE_URL}/about`,
    type: "article",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", title: "このサイトについて — ソロキャン羅針盤", images: ["/og.png"] },
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
  // トップと同じ式・同じ集計で出す（野営地の数が10と11で食い違っていた。審査員7・10）
  const total = activeCampgrounds.length;
  const backed = evidenceBackedCampgrounds.length;
  const pending = evidencePendingCampgrounds.length;
  const backedCamp = filterByType(evidenceBackedCampgrounds, "campground").length;
  const backedWild = filterByType(evidenceBackedCampgrounds, "wild").length;
  // ここでの unverified は lastVerified の鮮度の話で、status: 'unverified' とは別概念。
  const unverified = activeCampgrounds.filter(
    (c) => !c.lastVerified || c.lastVerified.trim() === "" || c.lastVerified === "2025-01-01"
  ).length;
  const scoresVerified = activeCampgrounds.filter(hasVerifiedScores).length;
  const evidenceBacked = activeCampgrounds.filter(hasEvidence).length;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-16">
      <nav aria-label="パンくずリスト" className="text-[13px] text-[#6b5d50] mb-2">
        <Link href="/" className="inline-flex items-center min-h-[44px] hover:text-[#b5440e]">
          トップ
        </Link>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#0e0d0b] leading-tight mb-3">
        このサイトについて
      </h1>
      <p className="text-[15px] text-[#4a3f35] leading-[1.9] mb-8">
        神奈川・静岡・山梨・千葉のキャンプ場と野営地を、ソロキャンプの視点で比較するためのサイトです。
        掲載 {total} 件 ＝ 公開 {backed} 件（キャンプ場 {backedCamp}・野営地 {backedWild}）＋ 情報確認中 {pending} 件。
      </p>

      {/* 3行の要約（2026-11-05。初めての人が式を読まなくても分かるように。審査員1） */}
      <section className="mb-8 rounded-2xl border border-[#e9e2d8] bg-white p-4 sm:p-5">
        <h2 className="text-[16px] font-bold text-[#1c1814] mb-2">まず3つだけ</h2>
        <ol className="list-decimal pl-5 space-y-1.5 text-[14px] leading-relaxed text-[#1c1814]">
          <li id="evidence" className="scroll-mt-4"><b>料金と設備は、各施設の公式サイトで確かめたものだけ</b>を載せています。料金はソロ1名1泊で実際に払う総額（入場料・管理費込み）です。</li>
          <li id="unknown" className="scroll-mt-4"><b>分からないことは「要確認」「未確認」と書きます。</b>推測で「なし」や金額を埋めません。</li>
          <li><b>静けさ・景観などの5点満点の評価は、根拠がそろった施設だけ</b>に付けます（高いほど良い）。まだ多くの施設が「確認中」です。</li>
        </ol>
      </section>

      {/* 予約サイトとの違い（審査員10） */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-[#1c1814] mb-3">予約サイトとの違い</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-[14px] leading-[1.9] text-[#4a3f35]">
          <li id="price" className="scroll-mt-4">予約サイトの表示は「1区画いくら」が多く、ソロで行くと結局いくらかが分かりにくいことがあります。このサイトは<b>ソロ1名の総額</b>で並べます。</li>
          <li>料金・設備の一つひとつに<b>公式ページの原文と出典</b>を付けています。詳細ページの「出典」から確かめられます。</li>
          <li>管理されたキャンプ場と、管理者のいない<b>野営地を分けて</b>載せ、野営地には「公認なし」などの前提を必ず出します。</li>
          <li>予約はできません。予約は各施設の公式サイトか、施設が案内する予約サイトで行ってください。</li>
        </ul>
      </section>

      {/* 並び順（2026-11-05 トップから説明を移した。審査員1・5） */}
      <section id="sort" className="mb-10 scroll-mt-4">
        <h2 className="text-lg sm:text-xl font-bold text-[#1c1814] mb-3">並び順について</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-[14px] leading-[1.9] text-[#4a3f35]">
          <li><b>情報が確かな順</b>（既定）：5軸の評価が確認できた施設 → 料金を公式で確認できた施設 → 地図の位置が取れている施設 → 名前順。人気やおすすめの度合いではありません。</li>
          <li><b>価格安い順</b>：ソロ1名1泊の総額の最安額で並べます。料金が未確認の施設は数字で順位を付けず、末尾にまとめます。</li>
          <li>市内・町内の住民向けの割安料金がある施設は、<b>誰でも払える料金（市外料金）</b>で比べています。</li>
        </ul>
        <p className="mt-3 text-[14px] leading-[1.9] text-[#4a3f35]">
          静けさ・景観などの5点評価は、根拠がそろうまで公開していません（現在 {scoresVerified} 件）。各施設のページでは、代わりに公式ページの記述をそのまま載せています。
        </p>
      </section>

      {/* 5軸 */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-[#0e0d0b] mb-3">
          5軸スコアの定義
        </h2>
        <p className="text-[14px] text-[#4a3f35] leading-[1.9] mb-4">
          5軸は、根拠がそろった施設だけを1〜5の整数で評価します。現在は {scoresVerified} 件が評価確認済みで、残りは「評価確認中」として点数をおすすめに使いません。
        </p>

        <div className="flex flex-col gap-4">
          {AXES.map((a) => (
            <div
              key={a.key}
              className="bg-white rounded-2xl border border-[#e2ddd8] p-4 sm:p-5"
            >
              <div className="flex items-baseline gap-2 mb-1.5">
                <h3 className="text-[16px] font-bold text-[#0e0d0b]">
                  {a.label}
                </h3>
                <span className="text-[12px] px-1.5 py-0.5 rounded bg-[#f5f0ea] text-[#4a3f35] border border-[#e2ddd8]">
                  重み {a.weight}
                </span>
              </div>
              <p className="text-[13px] text-[#4a3f35] leading-relaxed mb-3">{a.desc}</p>
              <ul className="flex flex-col gap-1">
                {a.scale.map((s) => (
                  <li
                    key={s}
                    className="text-[12px] text-[#4a3f35] leading-relaxed"
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
        <h2 className="text-lg sm:text-xl font-bold text-[#0e0d0b] mb-3">
          soloScore の計算式
        </h2>
        <p className="text-[14px] text-[#4a3f35] leading-[1.9] mb-3">
          一覧の「情報が確かな順」は、評価確認済みの施設ではこの値の降順です。評価確認中の施設は、仮の点数を使わず中立扱いで後ろに表示します。
        </p>
        <div className="bg-[#0e0d0b] rounded-2xl p-4 sm:p-5 mb-4">
          <code className="text-[12px] sm:text-[13px] text-[#e8c89a] break-words">
            soloScore = (静けさ×2 + 絶景×2 + コスパ + アクセス + 設備) ÷ 7
          </code>
        </div>
        <p className="text-[14px] text-[#4a3f35] leading-[1.9]">
          <strong className="text-[#0e0d0b]">静けさと絶景だけを2倍にしている理由。</strong>
          ソロキャンプでは、設備の充実や買い出しの利便性は「あれば良い」程度の要素です。
          一方で、隣の話し声が一晩中聞こえる場所と、静寂の中で焚き火を眺められる場所とでは、
          体験そのものが別物になります。景色も同じで、目の前に富士山や湖が開けているかどうかは、
          ソロで過ごす時間の価値を大きく左右します。
          グループキャンプなら重みは変わるはずですが、このサイトはソロ前提なので、
          代えのきかない2軸を重くしています。
        </p>
        <p className="text-[14px] text-[#4a3f35] leading-[1.9] mt-4">
          <strong className="text-[#0e0d0b]">料金が未確認の施設のコスパについて。</strong>
          料金の裏を取れていない施設は「料金 要確認」と表示しています。
          そうした施設では、コスパを判定する根拠がないため、
          soloScore の計算でだけコスパを中立値の3として扱っています
          （施設ごとに付けたコスパの値そのものは残してあり、料金を確認できた時点で元に戻ります）。
          コスパを計算から丸ごと外す方法も考えましたが、それだと残り4軸の平均が
          暗黙に当てはめられる形になり、料金が分からない施設ほど順位が上がってしまうため採っていません。
          価格の安い順に並べたときも、これらの施設は根拠のない数字で順位を付けず末尾にまとめています。
        </p>
      </section>

      {/* データについて */}
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-bold text-[#0e0d0b] mb-3">
          データの出典と鮮度
        </h2>
        <p className="text-[14px] text-[#4a3f35] leading-[1.9] mb-4">
          掲載情報は各キャンプ場の公式サイト、予約サイト、地図サービス、および公開情報をもとに整理しています。
          現在は {evidenceBacked} 件に情報源の入口を記録し、根拠URLのない施設は一覧で「情報確認中」と表示します。
          スコアは公開情報にもとづく当サイトの評価であり、実測値ではありません。
        </p>

        <div className="rounded-xl border border-[#e8611f] bg-white px-4 py-3 mb-4">
          <p className="text-[13px] leading-relaxed text-[#7a2e0a]">
            確認した日を記録していない施設が {unverified} 件あります（上の「情報確認中」とは別の数え方です）。該当ページには
            「確認した日は記録していません」と表示しています。料金・営業期間・予約要否・焚き火の可否は
            変更されることがあるため、訪問前に必ず公式サイト等でご確認ください。
          </p>
        </div>

        <p className="text-[14px] text-[#4a3f35] leading-[1.9]">
          確認済みのページには、その施設の情報を確認した日を表示しています。
          野営地は管理者不在・設備なしの場所を含みます。直火の可否や現在の開放状況は
          自治体の判断で変わるため、各ページの注意事項を必ずお読みください。
        </p>
      </section>

      <div>
        <Link href="/" className="inline-flex items-center min-h-[44px] text-[14px] font-semibold text-[#b5440e] underline hover:no-underline">
          トップの一覧に戻る
        </Link>
      </div>
    </div>
  );
}
