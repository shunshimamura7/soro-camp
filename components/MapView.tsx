"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Campground } from "@/lib/types";

// ── Tile sets ─────────────────────────────────────────────────────────────────
const LIGHT_TILES = [
  "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
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
      tiles: LIGHT_TILES, // default: 白基調
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    },
  },
  layers: [
    { id: "carto-layer", type: "raster", source: "carto", minzoom: 0, maxzoom: 22 },
  ],
};

/** ember ドット（inline styles で確実に描画） */
function createEmberEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "camp-marker";
  el.style.cssText =
    "width:14px;height:14px;" +
    "background:#e8611f;" +
    "border-radius:50%;" +
    "cursor:pointer;" +
    "box-shadow:0 0 0 2px rgba(232,97,31,0.35),0 0 10px rgba(232,97,31,0.65);";
  return el;
}

type Props = { camps: Campground[]; height?: number };

export default function MapView({ camps, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
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

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Marker sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMarkers = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (camps.length === 0) return;

      camps.forEach((camp) => {
        const el = createEmberEl();

        const popup = new maplibregl.Popup({
          offset: 14,
          closeButton: false,
          maxWidth: "200px",
        }).setHTML(
          `<a href="/camp/${camp.slug}" class="camp-popup-link">` +
            `<span class="camp-popup-name">${camp.name}</span>` +
            `<span class="camp-popup-meta">★${camp.soloScore.toFixed(1)}&nbsp;·&nbsp;¥${camp.priceMin.toLocaleString()}〜</span>` +
          `</a>`
        );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([camp.lng, camp.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (map.loaded()) syncMarkers();
    else map.once("load", syncMarkers);
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
