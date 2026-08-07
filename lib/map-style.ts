/**
 * 一覧地図（MapView / MapModal）で共有する地図スタイルとピン描画。
 *
 * ── なぜ共有するか ──────────────────────────────────────────────────────
 * 以前は MapView.tsx と MapModal.tsx がタイル定義・マーカー生成・タップ処理を
 * まるごと重複して持っていた。ピンの半径や色を変えるたびに2箇所直す必要があり、
 * 実際に両者のドット径が 12px と 14px でズレていた。ここに一本化する。
 *
 * ── なぜ DOM マーカーをやめたか ────────────────────────────────────────
 * 旧実装は施設ごとに div を作って `maplibregl.Marker` で貼っていた。
 * DOM マーカーはズームに応じたサイズ変化を CSS で自前計算するしかなく、
 * MapLibre の `interpolate` 式（ズーム連動）も `circle-stroke-width` も使えない。
 * GeoJSON ソース＋circle レイヤに移すことで、
 *   - ズーム連動の半径を宣言的に書ける
 *   - 白ストロークで重なりを分離できる
 *   - 絞り込みのたびに 170 個の div を作り直さず `setData()` で済む
 * が同時に得られる。クラスタリングを検討できるのもこの形にした場合だけ。
 */
import type {
  Map as MlMap,
  StyleSpecification,
  CircleLayerSpecification,
  GeoJSONSource,
  RasterTileSource,
  Point as MlPoint,
} from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { Campground } from "./types";

// ── 色 ────────────────────────────────────────────────────────────────────
export const EMBER = "#e8611f";
/** 選択中のピン。通常の ember より明るい熾火の色 */
export const EMBER_BRIGHT = "#ff7a00";

/** 昼モードのストローク。明るい地図では白が最も分離して見える */
const STROKE_LIGHT = "#ffffff";
/**
 * 夜モードのストローク。地の色に寄せた暗色。
 *
 * 白い輪郭は「UIのピン」に見えて、暗い地図では浮きすぎる。
 * 背景色に近い色で縁取ると、輪郭線ではなく「隣の熾火との隙間」として読める。
 * 分離の役目は果たしつつ、発光は下の GLOW レイヤに任せる。
 */
const STROKE_DARK = "#12100e";

// ── タイル ────────────────────────────────────────────────────────────────
/**
 * CartoDB Positron（light_all）。APIキー不要。
 *
 * 以前は素の OpenStreetMap タイルを使っていたが、緑（森林）と青（水域）の彩度が高く、
 * ember のオレンジと同じ強さで主張して地図が騒がしくなっていた。
 * Positron は明るいグレー基調で彩度がほぼ無いので、色を持つのはピンだけになる。
 *
 * 夜モードの dark_all と同じ CARTO 系なので、道路網の描き方やラベル位置が揃い、
 * 昼夜を切り替えても地図の骨格が動かない。
 */
export const LIGHT_TILES = [
  "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
];

export const DARK_TILES = [
  "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
];

/** CARTO のタイルは OSM と CARTO 両方の帰属表示が必要 */
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors ' +
  '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

export const TILE_SOURCE_ID = "carto";

export const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    [TILE_SOURCE_ID]: {
      type: "raster",
      tiles: LIGHT_TILES, // 既定は昼モード
      tileSize: 256,
      attribution: ATTRIBUTION,
    },
  },
  layers: [
    { id: "carto-layer", type: "raster", source: TILE_SOURCE_ID, minzoom: 0, maxzoom: 22 },
  ],
};

// ── レイヤ id ─────────────────────────────────────────────────────────────
export const PIN_SOURCE = "camps";
const GLOW_LAYER = "camp-glow";
export const PIN_LAYER = "camp-pin";
const SELECTED_LAYER = "camp-pin-selected";

// ── ピンの寸法 ────────────────────────────────────────────────────────────
type CirclePaint = NonNullable<CircleLayerSpecification["paint"]>;
type RadiusValue = NonNullable<CirclePaint["circle-radius"]>;

/**
 * ズーム連動の半径。
 *
 *   zoom 7 → 4px / zoom 10 → 6px / zoom 13 → 9px
 *
 * 広域（初期表示の zoom 8 付近）では点を小さくして密集地の輪郭を残し、
 * 寄るほど大きくしてタップしやすくする。旧実装は全ズームで 12〜14px 固定だった。
 * 停止点の外側は MapLibre が端の値でクランプする（zoom 5 なら 4px のまま）。
 */
function radiusExpr(scale: number): RadiusValue {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    7,
    4 * scale,
    10,
    6 * scale,
    13,
    9 * scale,
  ];
}

/**
 * ストロークの太さ。半径と違って固定 1.5px。
 * ズームで太さまで変えると、寄ったときに輪郭だけが目立ってしまう。
 */
const STROKE_WIDTH = 1.5;

/** タップ判定の許容半径（px）。ピン自体は 6px 前後なので指では狙えない */
const TAP_PAD = 16;

// ── GeoJSON 変換 ──────────────────────────────────────────────────────────
/**
 * 座標未確認（lat/lng が 0）のものはピンを打たない。
 * 0,0 はギニア湾沖なので、描くと地図の外に飛ぶだけでなく
 * 「確認済みの座標」だと誤認させる。
 */
export function toPinFeatures(camps: Campground[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: camps
      .filter((c) => c.lat !== 0 && c.lng !== 0)
      .map((c) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
        properties: { slug: c.slug, name: c.name },
      })),
  };
}

// ── レイヤ構築 ────────────────────────────────────────────────────────────
/**
 * ピンのソースと3枚のレイヤを追加する。`map.load` 後に1度だけ呼ぶ。
 *
 * レイヤは下から glow → pin → selected の順。
 * glow は夜モード専用なので、既定では visibility:none で置いておく。
 */
export function addCampPinLayers(map: MlMap, camps: Campground[]): void {
  if (map.getSource(PIN_SOURCE)) return;

  map.addSource(PIN_SOURCE, {
    type: "geojson",
    data: toPinFeatures(camps),
  });

  /**
   * 夜モードの発光。circle-blur で縁をぼかした大きめの円を下に敷く。
   * 旧実装は box-shadow で光らせていたが、これは DOM マーカーでしか使えない。
   */
  map.addLayer({
    id: GLOW_LAYER,
    type: "circle",
    source: PIN_SOURCE,
    layout: { visibility: "none" },
    paint: {
      "circle-radius": radiusExpr(2.6),
      "circle-color": EMBER,
      "circle-blur": 1,
      "circle-opacity": 0.55,
    },
  });

  map.addLayer({
    id: PIN_LAYER,
    type: "circle",
    source: PIN_SOURCE,
    paint: {
      "circle-radius": radiusExpr(1),
      "circle-color": EMBER,
      // 半透明にしない。重なりを分離するのはストロークの役目で、
      // 透過に頼ると密集地で色が濁って団子になる
      "circle-opacity": 0.95,
      "circle-stroke-width": STROKE_WIDTH,
      "circle-stroke-color": STROKE_LIGHT,
      "circle-stroke-opacity": 1,
    },
  });

  /**
   * 選択中の1件だけを描く層。旧実装は DOM 要素の style を直接書き換えていたが、
   * circle レイヤではフィルタで対象を絞るほうが素直。
   * 初期状態は「どの slug にも一致しない」フィルタ。
   */
  map.addLayer({
    id: SELECTED_LAYER,
    type: "circle",
    source: PIN_SOURCE,
    filter: ["==", ["get", "slug"], ""],
    paint: {
      "circle-radius": radiusExpr(1.6),
      "circle-color": EMBER_BRIGHT,
      "circle-opacity": 1,
      "circle-stroke-width": 2,
      "circle-stroke-color": STROKE_LIGHT,
      "circle-stroke-opacity": 1,
    },
  });
}

/** 絞り込み結果を反映する。DOM マーカーの作り直しと違い、これは差分描画で済む */
export function setPinData(map: MlMap, camps: Campground[]): void {
  const src = map.getSource(PIN_SOURCE) as GeoJSONSource | undefined;
  src?.setData(toPinFeatures(camps));
}

/** 選択中のピンを切り替える。null で解除 */
export function setSelectedPin(map: MlMap, slug: string | null): void {
  if (!map.getLayer(SELECTED_LAYER)) return;
  map.setFilter(SELECTED_LAYER, ["==", ["get", "slug"], slug ?? ""]);
}

/**
 * 昼夜の切り替え。タイルとピンの見え方を同時に変える。
 *
 * 昼: 白ストローク・発光なし（明るい地図では白が最も分離して見える）
 * 夜: 暗色ストローク＋発光（白い輪郭は暗い地図で浮きすぎるため）
 */
export function setMapTheme(map: MlMap, isDark: boolean): void {
  (map.getSource(TILE_SOURCE_ID) as RasterTileSource | undefined)?.setTiles(
    isDark ? DARK_TILES : LIGHT_TILES
  );
  if (!map.getLayer(PIN_LAYER)) return;

  const stroke = isDark ? STROKE_DARK : STROKE_LIGHT;
  map.setPaintProperty(PIN_LAYER, "circle-stroke-color", stroke);
  map.setPaintProperty(SELECTED_LAYER, "circle-stroke-color", stroke);
  map.setLayoutProperty(GLOW_LAYER, "visibility", isDark ? "visible" : "none");
}

// ── タップ判定 ────────────────────────────────────────────────────────────
/**
 * タップ位置に最も近いピンの slug を返す。無ければ null。
 *
 * circle レイヤの当たり判定は描画された円そのものなので、そのままだと
 * 半径 6px を指で狙わせることになる。旧実装が 44px の透明な div を
 * かぶせていたのと同じ効果を、タップ点まわりの矩形で問い合わせて出す。
 *
 * 密集地では矩形に複数入るので、返ってきた順（描画順）ではなく
 * タップ点までの画面距離が最短のものを選ぶ。ここを手を抜くと
 * 「押したのと違う施設が開く」になる。
 */
export function pinAt(map: MlMap, point: MlPoint): string | null {
  if (!map.getLayer(PIN_LAYER)) return null;
  const feats = map.queryRenderedFeatures(
    [
      [point.x - TAP_PAD, point.y - TAP_PAD],
      [point.x + TAP_PAD, point.y + TAP_PAD],
    ],
    { layers: [PIN_LAYER] }
  );
  if (feats.length === 0) return null;

  let best: string | null = null;
  let bestDist = Infinity;
  for (const f of feats) {
    const coords = (f.geometry as Point).coordinates;
    const p = map.project([coords[0], coords[1]]);
    const d = (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = (f.properties?.slug as string) ?? null;
    }
  }
  return best;
}

/** ピンの上でカーソルを指マークにする（PC のみ意味がある） */
export function bindPinCursor(map: MlMap): void {
  map.on("mouseenter", PIN_LAYER, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", PIN_LAYER, () => {
    map.getCanvas().style.cursor = "";
  });
}
