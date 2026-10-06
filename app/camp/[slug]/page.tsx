import type { Metadata } from "next";
import type { Campground } from "@/lib/types";
import { hasEvidence, hasUsableCoord, hasVerifiedScores, isToleratedWildSite } from "@/lib/camp";
import { campMapUrl, nearbyBathUrl, nearbyShoppingUrl } from "@/lib/maps";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampground, getAllSlugs } from "@/lib/camp";
import { SITE_URL } from "@/lib/site";
import {
  RestrictionChips,
  RestrictionDetails,
  EligibilityChip,
  EligibilityNote,
} from "@/components/RestrictionChip";
import { formatPeriod, parseSource } from "@/lib/restrictions";


export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const camp = getCampground(slug);
  if (!camp) return {};

  const title = `${camp.name}【${camp.prefecture}・${camp.area}】`;
  // 料金が未確認の施設は、検索結果に出る description にも金額を書かない
  // soloComment は実態が確定するまで空にすることがある（推測で埋めない方針）。
  // 空のまま連結すると description が半角スペースで始まるので trim する。
  const description = (
    camp.type === "wild"
      ? `${camp.soloComment} 無料。${camp.season}。`
      : camp.priceVerified !== true
        ? `${camp.soloComment} 料金は未確認。${camp.season}営業。`
        : camp.priceMin === 0 && camp.priceMax === 0
          ? `${camp.soloComment} 料金は要問合せ。${camp.season}営業。`
          : `${camp.soloComment} 最安値${camp.priceMin.toLocaleString()}円〜。${camp.season}営業。`
  ).trim();

  const shouldNoIndex = camp.status !== "active" || !hasEvidence(camp);

  return {
    title,
    description,
    robots: shouldNoIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/camp/${slug}`,
      type: "article",
    },
  };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100">
      <span className="w-24 sm:w-28 shrink-0 text-slate-500 text-xs sm:text-sm">{label}</span>
      <span className="text-xs sm:text-sm text-slate-700 break-words min-w-0">{value}</span>
    </div>
  );
}

/**
 * 「1名向けの料金プラン」があるか。**ソロで泊まれるかどうかではない。**
 *
 * `features.soloPlan` は false が130件あるが、その大半は `soloPlanNote` が空で、
 * 公式に「1名プランなし」と確認した記録がない。ソロ利用を前提に選んだ施設だけを載せている
 * このサイトで「ソロプラン なし」と断定すると、**ソロで行ける施設を行けないと読ませてしまう**。
 *
 * 根拠（note）のない false は「なし」と言い切らず「確認できず」に留める。
 * データは書き換えない。出典が付いた時点で「なし」に戻る。
 */
function soloPlanLabel(f: Campground["features"]): string {
  const note = f.soloPlanNote ? `（${f.soloPlanNote}）` : "";
  if (f.soloPlan === true) return `あり${note}`;
  if (f.soloPlan === false && f.soloPlanNote) return `なし${note}`;
  return `確認できず${note}`;
}

/** false と note の組合せが「可否要確認」を示すデータを、不可と誤表示しない。 */
function featureAvailability(available: boolean | undefined, yes: string, no: string, note?: string) {
  const noteText = note ? `（${note}）` : "";
  // 未指定は「なし」ではなく未確認。新規候補の根拠不足を不可表示に変換しない。
  if (available === undefined) return `要確認${noteText}`;
  if (available) return `${yes}${noteText}`;
  if (note && /要確認|不明/.test(note)) return `要確認${noteText}`;
  return `${no}${noteText}`;
}

export default async function CampDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const camp = getCampground(slug);
  if (!camp) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Campground",
    name: camp.name,
    description: camp.soloComment,
    address: {
      "@type": "PostalAddress",
      addressLocality: camp.area,
      addressRegion: camp.prefecture,
      streetAddress: camp.address,
      addressCountry: "JP",
    },
    // 正しい位置が分からない場合は geo を出さない（hasUsableCoord）。
    // 構造化データは検索エンジンがそのまま拾うので、誤った座標を流すと外まで汚す
    ...(hasUsableCoord(camp)
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: camp.lat,
            longitude: camp.lng,
          },
        }
      : {}),
    ...(camp.tel ? { telephone: camp.tel } : {}),
    ...(camp.officialUrl ? { url: camp.officialUrl } : {}),
    // 野営地は無料。価格未調査（0/0）と、裏を取っていない料金は priceRange を出さない。
    // 構造化データは検索エンジンがそのまま拾うので、根拠のない金額を流さない
    ...(camp.type === "wild"
      ? { priceRange: "0" }
      : camp.priceVerified !== true
        ? {}
        : camp.priceMin === 0 && camp.priceMax === 0
          ? {}
          : { priceRange: `¥${camp.priceMin.toLocaleString()}〜¥${camp.priceMax.toLocaleString()}` }),
  };

  const f = camp.features;
  const isWild = camp.type === "wild";
  const priceUnknown = !isWild && camp.priceMin === 0 && camp.priceMax === 0;
  // 値は入っているが裏を取っていないもの。根拠のない金額は出さない
  const priceUnverified = !isWild && camp.priceVerified !== true;
  // 閉鎖済みの施設に金額を出さない。type:"wild" の「無料」も同じで、
  // キャンプが禁じられた場所に「無料」と出ると、行けば無料で泊まれると読める
  // （sanogawa-camp で実際にそうなっていた）。金額の裏取り状況より status が優先。
  const isClosed = camp.status === "closed";
  const priceLabel = isClosed
    ? "利用不可"
    : isWild
      ? "無料"
      : priceUnverified
        ? "料金 要確認"
        : priceUnknown
          ? (camp.priceNote || "要問合せ")
          : `¥${camp.priceMin.toLocaleString()}〜`;

  // "2025-01-01" は一括投入時のプレースホルダなので確認済みとは扱わない
  const isUnverified =
    !camp.lastVerified ||
    camp.lastVerified.trim() === "" ||
    camp.lastVerified === "2025-01-01";

  const featureBadges: Array<[string, string]> = [];
  if (f.bath)     featureBadges.push(["bath",    "♨️ 風呂"]);
  if (f.shower)   featureBadges.push(["shower",  "🚿 シャワー"]);
  if (f.carIn)    featureBadges.push(["carIn",   "🚗 車横付け"]);
  if (f.wifi)     featureBadges.push(["wifi",    "📶 Wi-Fi"]);
  // 焚き火に期間制限がある施設は、素の「🔥 焚き火」を出すと制限チップと矛盾して見える。
  // 設備欄からは外し、タイトル横の3状態チップに一本化する。
  const bonfireRestricted = (camp.restrictions ?? []).some((r) => r.type === "bonfire");
  if (f.bonfire && !bonfireRestricted) featureBadges.push(["bonfire", "🔥 焚き火"]);
  const noBonfire = f.bonfire === false && /禁止|不可|できない|NG/.test(f.bonfireNote ?? "");
  if (f.firewood) featureBadges.push(["firewood","🪵 薪販売"]);
  if (f.fishing)  featureBadges.push(["fishing", "🎣 釣り可"]);
  if (f.shop)     featureBadges.push(["shop",    "🏪 売店"]);

  // URL の組み立ては lib/maps.ts に集約（3か所にベタ書きされていたのをまとめた）。
  // api=1 形式を使う理由もそちらに書いてある。
  const mapsUrl = campMapUrl(camp);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Safe-area spacer — active when viewport-fit=cover */}
      <div className="h-[env(safe-area-inset-top,0px)]" />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-[96px] md:pb-8">
        {/*
          掲載状態の警告。施設名より前に出す。
          名前を見てから警告に気づくのでは遅いので、パンくず（施設名を含む）よりも
          さらに前、ページ内容の先頭に置くこと。
        */}
        {/*
          閉鎖の警告。closedReason で文面を変える。
          以前は closed 全件に「キャンプが禁止されています。訪問しないでください」を出していたが、
          これが正しいのは自治体がキャンプを禁じた sanogawa-camp だけだった。
          廃止・閉業に「禁止」と書くのは事実と違う。

          prohibited 側からも「訪問しないでください」を外した。禁じられているのは
          キャンプと火気であって立ち入りではない。sanogawa-camp は南部町が管理する
          河川公園、yadoriki-camp は神奈川県の水源林（毎週土日に県の森林ガイドがある）で、
          どちらも訪れること自体は自由。禁止の対象を取り違えて書かないこと。
        */}
        {camp.status === "closed" && (
          <div
            role="alert"
            className="mb-4 rounded-xl border-2 border-red-600 bg-red-50 px-4 py-3.5"
          >
            <p className="text-[13px] sm:text-[15px] font-bold leading-relaxed text-red-700">
              {camp.closedReason === "abolished" ||
              camp.closedReason === "closed_business"
                ? "この施設は営業を終了しています。現地に施設はありません。"
                : "この場所でのキャンプ・火気の使用は禁止されています。宿泊目的で訪れないでください。"}
            </p>
            {camp.closedNote && (() => {
              const src = parseSource(camp.closedNote);
              return (
                <p className="mt-2 text-[12px] sm:text-[13px] leading-relaxed text-red-900">
                  {src.label}
                  {src.url && (
                    <>
                      {" "}
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        出典 ↗
                      </a>
                    </>
                  )}
                </p>
              );
            })()}
          </div>
        )}
        {camp.status === "unverified" && (
          <div
            role="alert"
            className="mb-4 rounded-xl border-2 border-amber-500 bg-amber-50 px-4 py-3.5"
          >
            <p className="text-[13px] sm:text-[15px] font-bold leading-relaxed text-amber-700">
              営業状況が確認できていません。訪問前に必ず最新情報を確認してください。
            </p>
          </div>
        )}
        {/*
          休業中。closed（もう行ってはいけない）とは分けて、
          「今は行けないが将来復活する」ことが伝わる文言にする。
        */}
        {camp.status === "suspended" && (
          <div
            role="alert"
            className="mb-4 rounded-xl border-2 border-sky-600 bg-sky-50 px-4 py-3.5"
          >
            <p className="text-[13px] sm:text-[15px] font-bold leading-relaxed text-sky-800">
              現在は休業中です。今は利用できませんが、再開の予定があります。
            </p>
            {camp.suspendedNote && (() => {
              const src = parseSource(camp.suspendedNote);
              return (
                <p className="mt-2 text-[12px] sm:text-[13px] leading-relaxed text-sky-900">
                  {src.label}
                  {src.url && (
                    <>
                      {" "}
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        出典 ↗
                      </a>
                    </>
                  )}
                </p>
              );
            })()}
          </div>
        )}

        {/*
          期間限定の制限と利用対象の制限。掲載状態の警告と同じく施設名より前に出す。
          どちらもサーバ側で静的に書き出すので、restrictions.js が動かなくても残る。
        */}
        <RestrictionDetails restrictions={camp.restrictions} />
        <EligibilityNote eligibility={camp.eligibility} />

        {/*
          料金が未確認であること自体を伝える。金額を隠すだけだと
          「なぜ分からないのか」「どうすれば分かるのか」が伝わらないので、
          確認先（公式サイト・電話）があれば併記する。
        */}
        {priceUnverified && (
          <div className="mb-4 rounded-xl border-2 border-amber-500 bg-amber-50 px-4 py-3">
            <p className="text-[13px] sm:text-sm font-bold leading-relaxed text-amber-900">
              料金は未確認です。訪問前に公式サイトか電話で確認してください
            </p>
            {(camp.officialUrl || camp.tel) && (
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] sm:text-sm">
                {camp.officialUrl && (
                  <a
                    href={camp.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-900 underline hover:no-underline"
                  >
                    公式サイトで確認 ↗
                  </a>
                )}
                {camp.tel && (
                  <a href={`tel:${camp.tel}`} className="text-amber-900 underline hover:no-underline">
                    📞 {camp.tel}
                  </a>
                )}
              </p>
            )}
            {!camp.officialUrl && !camp.tel && (
              <p className="mt-2 text-[12px] sm:text-[13px] leading-relaxed text-amber-800">
                この施設は公式サイトも電話番号も確認できていません。施設名で検索して最新情報をご確認ください
              </p>
            )}
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-4 flex gap-1 items-center flex-wrap">
          <Link href="/" className="hover:text-slate-700">← 一覧</Link>
          <span>›</span>
          <span>{camp.prefecture}</span>
          <span>›</span>
          <span className="text-slate-700 truncate max-w-[180px] sm:max-w-none">{camp.name}</span>
        </nav>

        {/* Title */}
        <div className="mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm text-slate-500 mb-1">{camp.prefecture} · {camp.area}</p>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 leading-tight">{camp.name}</h1>
          <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
            <span className="text-green-600 font-bold text-sm sm:text-base">{priceLabel}</span>
            {hasEvidence(camp) ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {/* 野営地に公式サイトは無い。「情報源あり」と書くと、確かめていないものを確かめたことにしてしまう */}
                {isWild ? "場所・注意点を記録" : "情報源あり"}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">情報確認中</span>
            )}
            {camp.priceVerified === true ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">料金を公式確認</span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">料金 要確認</span>
            )}
            {hasUsableCoord(camp) ? (
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">地図位置あり</span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">地図位置 要確認</span>
            )}
            {!hasVerifiedScores(camp) && (
              <span className="inline-flex items-center rounded-full border border-[#e2ddd8] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#6b5a4e]">5軸評価は確認中</span>
            )}
            <RestrictionChips restrictions={camp.restrictions} />
            <EligibilityChip eligibility={camp.eligibility} />
            {isToleratedWildSite(camp) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#fdf3ea] text-[#9a5b1c] border border-[#e3c6a6]">
                公認なし
              </span>
            )}
            {isWild && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white text-[#e8611f] border border-[#e8611f]">
                野営地
              </span>
            )}
            {noBonfire && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f0ee] text-[#6b6560] border border-[#d8d3ce]">
                🚫 焚き火不可
              </span>
            )}
            <span className="text-slate-500 text-xs sm:text-sm">{camp.season}</span>
          </div>
        </div>

        {/* 施設の同定そのものが未確定 — 情報の鮮度より重い警告なので先に出す */}
        {camp.needsVerify && (
          <p className="mb-3 rounded-xl border border-[#e8611f] bg-white px-3 py-2.5 text-[12px] sm:text-[13px] leading-relaxed text-[#e8611f]">
            この施設は情報の裏取りが済んでいません。訪問前に必ず公式情報をご確認ください
          </p>
        )}

        {/* 情報の鮮度 */}
        {isUnverified ? (
          <p className="mb-5 sm:mb-6 rounded-xl border border-[#e8611f] bg-white px-3 py-2.5 text-[12px] sm:text-[13px] leading-relaxed text-[#e8611f]">
            この情報は未確認です。訪問前に公式サイト等でご確認ください
          </p>
        ) : (
          <p className="mb-5 sm:mb-6 text-[11px] sm:text-xs text-[#9a8e84]">
            最終確認: {camp.lastVerified}
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/*
              野営地の前提。cautions の前に必ず出す。
              個別の注意事項を読む前に「ここは管理された施設ではない」と分かっていないと、
              「トイレなし」を設備の不足として読んでしまう。不足ではなく前提である。
            */}
            {isWild && (
              <section className="bg-[#fff8f2] rounded-2xl p-4 sm:p-5 border border-[#e3c6a6]">
                <h2 className="text-xs sm:text-sm font-bold text-[#9a5b1c] mb-2">この場所について</h2>
                <ul className="flex flex-col gap-1.5 text-[13px] sm:text-sm text-[#7a4a16] leading-relaxed">
                  <li>管理者・受付・公式サイトがありません。料金や営業時間という概念もありません。</li>
                  <li>
                    掲載しているのは、場所と現地の制約を調べて記録したものです。
                    施設の公式発表ではないので、<strong>現地の掲示が常に優先します</strong>。
                  </li>
                  {isToleratedWildSite(camp) && (
                    <li>
                      <strong>ここは自治体が公認した野営地ではありません。</strong>
                      黙認されている状態なので、禁止される可能性があります。
                      現地に禁止の掲示があれば、その時点で利用できません。
                    </li>
                  )}
                  <li>状況は予告なく変わります。行く前に最新の情報を確認してください。</li>
                </ul>
              </section>
            )}

            {/* Cautions — 野営地の注意事項 */}
            {camp.cautions && camp.cautions.length > 0 && (
              <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8611f]">
                <h2 className="text-xs sm:text-sm font-bold text-[#e8611f] mb-2">⚠️ 注意事項</h2>
                <ul className="flex flex-col gap-1.5">
                  {camp.cautions.map((c) => (
                    <li key={c} className="text-[13px] sm:text-sm text-[#e8611f] leading-relaxed flex gap-2">
                      <span aria-hidden="true">・</span>
                      <span className="min-w-0">{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Comment */}
            <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-2">ソロキャンパーへのコメント</h2>
              <p className="text-[15px] text-slate-600 leading-[1.8] tracking-[0.02em]">{camp.soloComment}</p>
            </section>

            {/* 根拠不足の候補に仮の高評価を表示しない */}
            {!hasVerifiedScores(camp) && (
              <section className="rounded-2xl border border-[#ead6c8] bg-[#fff9f4] p-4 sm:p-5">
                <h2 className="mb-1 text-xs font-bold text-[#8b3516] sm:text-sm">5軸評価は確認中です</h2>
                <p className="text-[13px] leading-relaxed text-[#704d3b]">静けさ・景観・コスパ・アクセス・設備の根拠が十分に揃うまで点数は公開しません。おすすめ順では中立扱いにし、推測の高評価を付けていません。</p>
              </section>
            )}

            {/* Feature badges — 2 col grid, 44px tap targets */}
            {featureBadges.length > 0 && (
              <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100">
                <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-3">設備・特徴</h2>
                <div className="grid grid-cols-2 gap-2">
                  {featureBadges.map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center min-h-[44px] px-3 bg-white rounded-xl text-[13px] font-medium text-[#5a4a3a] border border-[#e2ddd8]"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Action links — full-height buttons for easy tapping */}
            <div className="flex flex-col gap-2">
              {camp.officialUrl && (
                <a
                  href={camp.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center min-h-[52px] gap-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  公式サイトを見る ↗
                </a>
              )}
              {camp.reservationUrl && (
                <a
                  href={camp.reservationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center min-h-[52px] gap-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  予約ページへ ↗
                </a>
              )}
              {camp.tel && (
                <a
                  href={`tel:${camp.tel}`}
                  className="flex items-center justify-center min-h-[52px] gap-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  📞 {camp.tel}
                </a>
              )}
              {camp.telNote && !camp.tel && (
                <p className="text-xs text-slate-500 text-center py-2">{camp.telNote}</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Map */}
            <section>
              <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-2">アクセスマップ</h2>
              <div className="flex flex-wrap gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#e8611f] border border-[#e8611f]/40 rounded-lg font-mono text-sm hover:bg-[#e8611f] hover:text-white transition-colors"
                >
                  📍 Googleマップで開く
                </a>
                {/*
                  URL に座標を埋めるのはやめたが、場所を特定できていない施設に
                  「周辺の買い物」を出しても意味がないので hasUsableCoord の門は残す。
                  「Googleマップで開く」は施設名＋住所で引くので座標が無くても成立する。
                */}
                {hasUsableCoord(camp) && (
                  <a
                    href={nearbyShoppingUrl(camp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 border border-slate-300 rounded-lg font-mono text-sm hover:bg-slate-100 transition-colors"
                  >
                    🛒 周辺の買い物を探す
                  </a>
                )}
                {hasUsableCoord(camp) && (
                  <a
                    href={nearbyBathUrl(camp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 border border-slate-300 rounded-lg font-mono text-sm hover:bg-slate-100 transition-colors"
                  >
                    ♨️ 周辺の温泉を探す
                  </a>
                )}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(camp.name)}&tbm=isch`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#e8611f] border border-[#e8611f]/40 rounded-lg font-mono text-sm hover:bg-[#e8611f] hover:text-white transition-colors"
                >
                  📷 写真を見る
                </a>
              </div>
              <p className="text-xs text-slate-500 mt-2">📍 {camp.address}</p>
            </section>

            {/* Facility details */}
            <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100">
              <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-1">施設情報</h2>
              <div>
                <Row
                  label="料金"
                  value={
                    isClosed
                      ? "利用不可（閉鎖のため料金は表示しません）"
                      : isWild
                        ? "無料"
                        : priceUnverified
                          ? "未確認（公式サイトまたは電話で要確認）"
                          : priceUnknown
                            ? (camp.priceNote || "要問合せ")
                            : `¥${camp.priceMin.toLocaleString()}〜¥${camp.priceMax.toLocaleString()}${camp.priceNote ? `（${camp.priceNote}）` : ""}`
                  }
                />
                <Row label="営業期間" value={camp.season} />
                <Row label="予約" value={f.reservation ? `${f.reservation}${f.reservationNote ? `（${f.reservationNote}）` : ""}` : "要確認"} />
                <Row
                  label="焚き火"
                  value={
                    <>
                      {featureAvailability(f.bonfire, "可", "不可", f.bonfireNote)}
                      {(camp.restrictions ?? [])
                        .filter((r) => r.type === "bonfire")
                        .map((r) => (
                          <span key={`${r.from}-${r.to}`} className="block text-amber-700 mt-1">
                            ※ {formatPeriod(r)} は{r.reason}
                          </span>
                        ))}
                    </>
                  }
                />
                <Row label="シャワー" value={featureAvailability(f.shower, "あり", "なし", f.showerNote)} />
                <Row label="風呂" value={featureAvailability(f.bath, "あり", "なし", f.bathNote)} />
                <Row label="トイレ" value={f.toilet ? `${f.toilet}${f.toiletNote ? `（${f.toiletNote}）` : ""}` : "要確認"} />
                <Row label="車横付け" value={featureAvailability(f.carIn, "可", "不可", f.carInNote)} />
                <Row
                  label="ソロ向けプラン"
                  value={
                    <>
                      {soloPlanLabel(f)}
                      <span className="block text-slate-400 mt-0.5">※ 1名向けの料金プランの有無。ソロ利用そのものの可否ではありません</span>
                    </>
                  }
                />
                <Row label="釣り" value={featureAvailability(f.fishing, "可", "要確認", f.fishingNote)} />
                <Row label="売店" value={f.shop === true ? "あり" : f.shop === false ? "なし" : "要確認"} />
                <Row label="Wi-Fi" value={f.wifi === true ? "あり" : f.wifi === false ? "なし" : "要確認"} />
                <Row label="薪" value={featureAvailability(f.firewood, "あり", "なし", f.firewoodNote)} />
                <Row label="氷販売" value={f.ice === true ? "あり" : f.ice === false ? "なし" : "要確認"} />
                <Row label="酒販売" value={f.alcohol === true ? "あり" : f.alcohol === false ? "なし" : "要確認"} />
                {camp.closedDays && <Row label="定休日" value={camp.closedDays} />}
                <Row label="情報確認日" value={isUnverified ? "未確認" : camp.lastVerified} />
              </div>
            </section>

            {camp.source && camp.source.length > 0 && (
              <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100">
                <h2 className="text-xs sm:text-sm font-bold text-slate-700 mb-2">確認した情報源</h2>
                <ul className="space-y-2 text-[12px] sm:text-[13px] leading-relaxed text-slate-600">
                  {camp.source.map((source) => {
                    const url = source.match(/https?:\/\/\S+/)?.[0];
                    const label = url ? source.replace(url, "").trim() : source;
                    return <li key={source}>{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:no-underline">{label || url} ↗</a> : label}</li>;
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          <Link href="/" className="text-blue-500 text-sm hover:underline">← キャンプ場一覧に戻る</Link>
        </div>
      </div>

      {/* Fixed bottom CTA bar — mobile only */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur border-t border-slate-200"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex gap-2 px-4 py-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center h-[52px] rounded-xl bg-[#e8611f] text-white text-[14px] font-semibold hover:bg-[#d0551a] transition-colors"
          >
            📍 Googleマップで開く
          </a>
          {camp.tel && (
            <a
              href={`tel:${camp.tel}`}
              className="flex items-center justify-center h-[52px] px-5 rounded-xl bg-slate-100 text-slate-700 text-[14px] font-semibold hover:bg-slate-200 transition-colors"
            >
              📞 電話
            </a>
          )}
        </div>
      </div>
    </>
  );
}
