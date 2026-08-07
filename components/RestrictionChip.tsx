import type { Restriction, RestrictionType, Eligibility } from "@/lib/types";
import {
  defaultLabel,
  formatPeriod,
  groupByType,
  parseSource,
} from "@/lib/restrictions";

/**
 * 期間限定制限のチップ。
 *
 * ビルド時は必ず「期間制限あり・要確認」で出す。今日が期間内かの判定は
 * 閲覧時に public/restrictions.js が data-restrictions を読んで行い、
 * ラベルと data-state だけを書き換える。JS が動かなければ要確認のまま残る。
 */
export function RestrictionChip({
  type,
  list,
}: {
  type: RestrictionType;
  list: Restriction[];
}) {
  return (
    <span
      data-restriction-chip=""
      data-restriction-type={type}
      data-state="unknown"
      data-restrictions={JSON.stringify(list)}
      className="restriction-chip"
    >
      <span data-restriction-label="">{defaultLabel(type)}</span>
    </span>
  );
}

/** 施設が持つ制限をまとめて type ごとに1つずつ出す */
export function RestrictionChips({ restrictions }: { restrictions?: Restriction[] }) {
  if (!restrictions || restrictions.length === 0) return null;
  return (
    <>
      {groupByType(restrictions).map(([type, list]) => (
        <RestrictionChip key={type} type={type} list={list} />
      ))}
    </>
  );
}

/**
 * 期間・理由・出典。サーバ側で静的に出す。
 *
 * チップのラベルは JS 頼みだが、こちらは JS が失敗しても必ず読める。
 * 「いつ・何が・どの根拠で」が消えないようにするための土台。
 */
export function RestrictionDetails({ restrictions }: { restrictions?: Restriction[] }) {
  if (!restrictions || restrictions.length === 0) return null;
  return (
    <section className="mb-4 rounded-xl border-2 border-amber-500 bg-amber-50 px-4 py-3">
      <h2 className="text-xs sm:text-sm font-bold text-amber-800 mb-1.5">
        期間限定の制限
      </h2>
      <ul className="flex flex-col gap-1.5">
        {restrictions.map((r) => {
          const src = parseSource(r.source);
          return (
            <li
              key={`${r.type}-${r.from}-${r.to}`}
              className="text-[13px] sm:text-sm text-amber-900 leading-relaxed"
            >
              <span className="font-bold">{formatPeriod(r)}</span>：{r.reason}
              {src.url ? (
                <>
                  {" "}
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    {src.label} ↗
                  </a>
                </>
              ) : (
                <span className="text-amber-700"> （{src.label}）</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * 「誰が使えるか」の型ごとの見出し文。
 *
 * 4つは利用者にとって意味がまるで違う。
 * 排他型は行っても使えない、料金差型は使えるが高い、申込先行型は取りにくい、会員制は登録が要る。
 * 同じ文言でまとめると、行けるかどうかの判断を誤らせる。
 */
const ELIGIBILITY_HEADLINE: Record<Eligibility["type"], string> = {
  exclusive: "利用できる人が限られています",
  discount: "市外からの利用は割高になります",
  priority: "地元の方の申込が先に始まります",
  membership: "会員登録が必要です",
};

/** チップの色。排他型と会員制は「そもそも使えないことがある」ので強め */
const ELIGIBILITY_STYLE: Record<Eligibility["type"], string> = {
  exclusive: "bg-rose-50 text-rose-800 border-rose-500",
  discount: "bg-amber-50 text-amber-800 border-amber-500",
  priority: "bg-amber-50 text-amber-800 border-amber-500",
  membership: "bg-rose-50 text-rose-800 border-rose-500",
};

/**
 * 利用できる人の制限（例: 甲府市民限定）。
 * 日付に依存しないので完全に静的。restrictions の JS が失敗しても必ず残る。
 */
export function EligibilityChip({ eligibility }: { eligibility?: Eligibility }) {
  if (!eligibility) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${ELIGIBILITY_STYLE[eligibility.type]}`}
    >
      {eligibility.label}
    </span>
  );
}

/** 詳細ページ用。型ごとの見出しに、補足と出典リンクを添える。 */
export function EligibilityNote({ eligibility }: { eligibility?: Eligibility }) {
  if (!eligibility) return null;
  const src = parseSource(eligibility.source);
  const strong = eligibility.type === "exclusive" || eligibility.type === "membership";
  return (
    <div
      className={`mb-4 rounded-xl border-2 px-4 py-3 ${
        strong ? "border-rose-500 bg-rose-50" : "border-amber-500 bg-amber-50"
      }`}
    >
      <p
        className={`text-[13px] sm:text-sm font-bold leading-relaxed ${
          strong ? "text-rose-800" : "text-amber-800"
        }`}
      >
        {ELIGIBILITY_HEADLINE[eligibility.type]}
      </p>
      <p
        className={`mt-1 text-[13px] sm:text-sm leading-relaxed ${
          strong ? "text-rose-900" : "text-amber-900"
        }`}
      >
        <span className="font-bold">{eligibility.label}</span>
        {eligibility.note ? ` — ${eligibility.note}` : null}
        {src.url ? (
          <>
            {" "}
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              {src.label} ↗
            </a>
          </>
        ) : (
          <span className="opacity-80"> （{src.label}）</span>
        )}
      </p>
    </div>
  );
}
