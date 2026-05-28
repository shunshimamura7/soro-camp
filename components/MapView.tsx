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
      tiles: LIGHT_TILES, // default: 白基調
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
/**
 * 44×44px transparent tap-area wrapper around a 14px visible ember dot.
 * position:relative は MapLibre の transform と競合するため設定しない。
 */
function createEmberEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText =
    "width:44px;height:44px;" +
    "display:flex;align-items:center;justify-content:center;" +
    "cursor:pointer;" +
    "pointer-events:all;";
  const dot = document.createElement("div");
  dot.style.cssText =
    "width:14px;height:14px;" +
    "background:#e8611f;" +
    "border-radius:50%;" +
    "box-shadow:0 0 0 2px rgba(232,97,31,0.35),0 0 10px rgba(232,97,31,0.65);" +
    "pointer-events:none;";
  el.appendChild(dot);
  return el;
}

/**
 * マーカー要素にタップ判定付きのイベントを登録する。
 *
 * touchstart で preventDefault → MapLibre がタッチをパン操作として
 * 横取りするのを防ぎ、touchend を確実に受け取れるようにする。
 * setPopup() が内部で登録する click リスナーと二重発火しないよう、
 * touch 系は独自管理し、click はマウス専用とする。
 */
function bindTapHandler(
  el: HTMLDivElement,
  onTap: () => void,
): void {
  let isTap = false;
  let startX = 0;
  let startY = 0;

  el.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      e.stopPropagation();
      e.preventDefault(); // ← MapLibre のパン横取りを防ぐ / synthesized click を抑制
      isTap = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      const wrapper = el.parentElement;
      if (wrapper) wrapper.style.zIndex = "20";
    },
    { passive: false },
  );

  el.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      if (!isTap) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 8 || dy > 8) {
        isTap = false;
        const wrapper = el.parentElement;
        if (wrapper) wrapper.style.zIndex = "";
      }
    },
    { passive: true },
  );

  el.addEventListener(
    "touchend",
    (e: TouchEvent) => {
      e.stopPropagation();
      const wrapper = el.parentElement;
      if (wrapper) wrapper.style.zIndex = "";
      if (!isTap) return;
      isTap = false;
      e.preventDefault();
      onTap();
    },
    { passive: false },
  );

  // マウス（PC）用 — touch 系とは排他
  el.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    onTap();
  });
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
      center: [138.65, 35.3],
      zoom: 7.5,
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
          `</a>` +
          `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(camp.name + ' ' + (camp.address ?? ''))}" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:6px;font-size:11px;color:#e8611f;text-decoration:none;">Googleマップ →</a>`
        );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([camp.lng, camp.lat])
          .addTo(map);

        // ポップアップの開閉は bindTapHandler → marker.togglePopup() で管理。
        // setPopup() を使わないことで MapLibre 内部の click リスナーと競合しない。
        popup.setLngLat([camp.lng, camp.lat]);
        bindTapHandler(el, () => {
          // 他のポップアップを閉じてから自分を開く
          markersRef.current.forEach((m) => {
            if (m !== marker && m.getPopup()?.isOpen()) m.togglePopup();
          });
          if (!popup.isOpen()) popup.addTo(map);
          else popup.remove();
        });

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
