"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import type { Campground } from "@/lib/types";

// ── Tile sets ─────────────────────────────────────────────────────────────────
const LIGHT_TILES = [
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
];
const DARK_TILES = [
  "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
];

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: LIGHT_TILES,
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    { id: "carto-layer", type: "raster", source: "carto", minzoom: 0, maxzoom: 22 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildGeoJSON(camps: Campground[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: camps.map((c) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lng, c.lat] },
      properties: {
        slug: c.slug,
        name: c.name,
        prefecture: c.prefecture,
        area: c.area,
        soloScore: c.soloScore,
        priceMin: c.priceMin,
        soloPlan: c.features.soloPlan,
        bath: c.features.bath,
        shower: c.features.shower,
        wifi: c.features.wifi ?? false,
        bonfire: c.features.bonfire,
        reservation: c.features.reservation,
      },
    })),
  };
}

function buildTags(camp: Campground): string[] {
  const t: string[] = [];
  if (camp.features.bonfire) t.push("🔥 焚き火OK");
  if (camp.features.reservation === "不要") t.push("📋 予約不要");
  if (camp.features.soloPlan) t.push("🏕 ソロプランあり");
  if (camp.features.bath) t.push("♨ 風呂あり");
  if (camp.features.shower) t.push("🚿 シャワーあり");
  if (camp.features.wifi) t.push("📶 Wi-Fi");
  return t;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = { camps: Campground[]; onClose: () => void };

// ── Main component ────────────────────────────────────────────────────────────
export default function MapModal({ camps, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const campsMapRef = useRef<Map<string, Campground>>(new Map());

  const [selected, setSelected] = useState<Campground | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 昼夜切り替え
  const toggleTheme = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = !isDark;
    setIsDark(next);
    (map.getSource("carto") as maplibregl.RasterTileSource)?.setTiles(
      next ? DARK_TILES : LIGHT_TILES
    );
  }, [isDark]);

  const openPanel = useCallback((camp: Campground) => {
    setSelected(camp);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setTimeout(() => setSelected(null), 260);
  }, []);

  // ESC: パネル→閉、モーダル→閉
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panelOpen) closePanel();
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [panelOpen, closePanel, onClose]);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Build camps lookup map
  useEffect(() => {
    campsMapRef.current = new Map(camps.map((c) => [c.slug, c]));
  }, [camps]);

  // Map init (once on mount)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [138.9, 35.7],
      zoom: 7.2,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    // コンテナサイズ確定後にリサイズして位置ズレを解消
    setTimeout(() => mapRef.current?.resize(), 100);

    map.once("load", () => {
      const fc = buildGeoJSON(camps);

      // ── GeoJSON source with clustering ──────────────────────────────────
      map.addSource("camps", {
        type: "geojson",
        data: fc,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      });

      // ── Cluster circles ─────────────────────────────────────────────────
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "camps",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#e8611f",   // 1–4件: ember
            5,  "#c94f17",  // 5–9件: 濃いember
            10, "#a03a0c",  // 10件以上: ダーク
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,  // 1–4件
            5,  22,  // 5–9件
            10, 28,  // 10件以上
          ],
          "circle-opacity": 0.92,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(232,97,31,0.4)",
        },
      });

      // ── Cluster count text ──────────────────────────────────────────────
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "camps",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 13,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // ── Unclustered individual pins ─────────────────────────────────────
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "camps",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#e8611f",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(232,97,31,0.45)",
          "circle-opacity": 1,
        },
      });

      // ── Cluster click → zoom in ─────────────────────────────────────────
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id as number;
        const source = map.getSource("camps") as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geom = features[0].geometry as GeoJSON.Point;
          map.easeTo({ center: geom.coordinates as [number, number], zoom: zoom ?? 12 });
        }).catch(() => {});
      });

      // ── Individual pin click → open detail panel ────────────────────────
      map.on("click", "unclustered-point", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        if (!features.length) return;
        const slug = features[0].properties?.slug as string;
        const camp = campsMapRef.current.get(slug);
        if (camp) openPanel(camp);
      });

      // ── Cursor pointer on hover ─────────────────────────────────────────
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 昼夜ボタンスタイル ────────────────────────────────────────────────────
  const themeBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 9,
    background: isDark ? "rgba(14,13,11,0.9)" : "rgba(255,255,255,0.9)",
    color: isDark ? "#e8c89a" : "#333",
    border: "1px solid rgba(0,0,0,0.2)",
    padding: "6px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "inherit",
    lineHeight: 1.4,
    userSelect: "none",
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0e0d0b" }}
    >
      {/* Map canvas */}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, minWidth: 0, display: "block" }}
      />

      {/* 昼夜切り替えボタン（左上） */}
      <button style={themeBtnStyle} onClick={toggleTheme}>
        {isDark ? "☀️ 昼モード" : "🌙 夜モード"}
      </button>

      {/* × モーダル閉じるボタン（右上） */}
      <button
        onClick={onClose}
        className="map-modal-close-btn"
        aria-label="地図を閉じる"
      >
        ✕
      </button>

      {/* パネル外クリックでパネルを閉じる透明backdrop */}
      {panelOpen && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 6 }}
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* 詳細パネル */}
      <div
        className={`map-modal-panel${panelOpen ? " panel-open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {selected && <CampDetailPanel camp={selected} onClose={closePanel} />}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

// ── 詳細パネルコンテンツ ──────────────────────────────────────────────────────
function CampDetailPanel({
  camp,
  onClose,
}: {
  camp: Campground;
  onClose: () => void;
}) {
  const tags = buildTags(camp);

  return (
    <div className="panel-inner">
      <div className="panel-header">
        <button onClick={onClose} className="panel-close-btn" aria-label="パネルを閉じる">
          ✕
        </button>
      </div>

      <p className="panel-area">
        {camp.prefecture}&nbsp;·&nbsp;{camp.area}
      </p>

      <h2 className="panel-name">{camp.name}</h2>

      <div className="panel-score-row">
        <span className="panel-score">★&nbsp;{camp.soloScore.toFixed(1)}</span>
        <span className="panel-price">¥{camp.priceMin.toLocaleString()}〜</span>
      </div>

      {tags.length > 0 && (
        <div className="panel-tags">
          {tags.map((t) => (
            <span key={t} className="panel-tag">{t}</span>
          ))}
        </div>
      )}

      <a href={`/camp/${camp.slug}`} className="panel-detail-link">
        詳細を見る →
      </a>
    </div>
  );
}
