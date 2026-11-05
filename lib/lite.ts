import type { Campground } from "./types";
import { hasEvidence, isToleratedWildSite, hasUsableCoord } from "./camp-core";

/**
 * トップ（一覧・地図）に渡す軽い版のレコード（2026-11-05）。
 *
 * 以前はトップの画面コードが data/campgrounds.json（1.17MB）をまるごと読んでいて、
 * 同じデータが HTML と JS の両方に入っていた（審査員9：スマホ回線で表示まで6秒、
 * JS gzip 約385KB）。一覧のカードに要らない長文（設備の根拠文・注意事項・出典）を落とす。
 *
 * **判定が変わらないことをビルド時に確かめる。** 根拠あり／公認なし／地図に出せるかの
 * 3つを、元のレコードと軽い版の両方で計算し、1件でも食い違えばビルドを止める。
 */
const cut = (s: string | undefined | null, n: number) =>
  !s ? s ?? undefined : s.length > n ? s.slice(0, n) + "…" : s;

export function toLite(c: Campground): Campground {
  const hasDirectUrl = Boolean(c.officialUrl || c.reservationUrl);
  const urlSource = hasDirectUrl ? [] : (c.source ?? []).filter((s) => /https?:\/\//.test(s)).slice(0, 1);
  const cautions =
    c.type === "wild"
      ? c.cautions
      : hasDirectUrl || urlSource.length > 0
        ? undefined
        : (c.cautions ?? []).filter((s) => /https?:\/\//.test(s)).slice(0, 1);
  const f = c.features;
  const lite = {
    id: c.id,
    slug: c.slug,
    name: c.name,
    prefecture: c.prefecture,
    area: c.area,
    status: c.status,
    type: c.type,
    wildStatus: c.wildStatus,
    address: c.address,
    lat: c.lat,
    lng: c.lng,
    needsCoord: c.needsCoord,
    priceMin: c.priceMin,
    priceMax: c.priceMax,
    priceVerified: c.priceVerified,
    needsPrice: c.needsPrice,
    priceNote: cut(c.priceNote, 90),
    features: {
      bath: f.bath, shower: f.shower, carIn: f.carIn, wifi: f.wifi, bonfire: f.bonfire,
      bonfireNote: f.bonfire === false ? cut(f.bonfireNote, 40) : undefined,
      firewood: f.firewood, fishing: f.fishing, shop: f.shop, pet: f.pet,
      toilet: f.toilet, reservation: f.reservation,
      nearbyOnsen: cut(f.nearbyOnsen, 30),
    },
    season: c.season,
    scores: c.scores,
    scoresVerified: c.scoresVerified,
    soloComment: cut(c.soloComment, 170),
    restrictions: c.restrictions,
    eligibility: c.eligibility,
    needsVerify: c.needsVerify,
    lastVerified: c.lastVerified,
    officialUrl: c.officialUrl,
    reservationUrl: c.reservationUrl,
    source: urlSource,
    cautions,
    // 一覧の絞り込みとカードに使う分だけ（原文の引用は詳細ページで出す）
    officialFacts: c.officialFacts
      ? Object.fromEntries(
          Object.entries(c.officialFacts)
            .filter(([k]) => k !== "fetchedAt")
            .map(([k, v]) => {
              const f = v as { status: string; in?: string; out?: string; price?: string };
              return [k, { status: f.status, in: f.in, out: f.out, price: f.price }];
            })
        )
      : undefined,
  } as unknown as Campground;

  if (
    hasEvidence(lite) !== hasEvidence(c) ||
    isToleratedWildSite(lite) !== isToleratedWildSite(c) ||
    hasUsableCoord(lite) !== hasUsableCoord(c)
  ) {
    throw new Error(`toLite で判定が変わった: ${c.slug}`);
  }
  return lite;
}
