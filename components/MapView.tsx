"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
        soloScore: c.soloScore,
        priceMin: c.priceMin,
      },
    })),
  };
}

type Props = { camps: Campground[]; height?: number };

export default function MapView({ camps, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
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

  // ── Map init (once) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [138.9, 35.7],
      zoom: 7.2,
      cooperativeGestures: true,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

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
            "#e8611f",
            5,  "#c94f17",
            10, "#a03a0c",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            5,  22,
            10, 28,
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

      // ── Individual pin click → popup ────────────────────────────────────
      map.on("click", "unclustered-point", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
        if (!features.length) return;
        const props = features[0].properties;
        if (!props) return;

        const geom = features[0].geometry as GeoJSON.Point;
        new maplibregl.Popup({ offset: 12, closeButton: false, maxWidth: "200px" })
          .setLngLat(geom.coordinates as [number, number])
          .setHTML(
            `<a href="/camp/${props.slug}" class="camp-popup-link">` +
              `<span class="camp-popup-name">${props.name}</span>` +
              `<span class="camp-popup-meta">★${Number(props.soloScore).toFixed(1)}&nbsp;·&nbsp;¥${Number(props.priceMin).toLocaleString()}〜</span>` +
            `</a>`
          )
          .addTo(map);
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

  // ── camps 変更時に GeoJSON source を更新 ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;
    const src = map.getSource("camps") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(buildGeoJSON(camps));
  }, [camps]);

  // ── 昼夜ボタンのスタイル（isDark で切り替え） ────────────────────────────
  const btnStyle: React.CSSProperties = {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
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

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ height, minWidth: 0 }}
    >
      {/* MapLibre canvas */}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0 }}
      />
      {/* 昼夜切り替えボタン */}
      <button style={btnStyle} onClick={toggleTheme}>
        {isDark ? "☀️ 昼モード" : "🌙 夜モード"}
      </button>
    </div>
  );
}
