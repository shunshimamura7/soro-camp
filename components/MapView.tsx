"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Campground } from "@/lib/types";

// CartoDB Dark Matter — dark_all は確実に存在するパス
const CARTO_TILES = [
  "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
];

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: CARTO_TILES,
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

/** ember ドット要素を生成（inline styles で確実に描画） */
function createEmberEl(): HTMLDivElement {
  const el = document.createElement("div");
  // CSS クラスはアニメーション用。inline styles で寸法・色を保証する
  el.className = "camp-marker";
  el.style.cssText =
    "width:14px;height:14px;" +
    "background:#e8611f;" +
    "border-radius:50%;" +
    "cursor:pointer;" +
    "position:relative;" +
    "flex-shrink:0;" +
    "box-shadow:0 0 0 2px rgba(232,97,31,0.35),0 0 10px rgba(232,97,31,0.65);";
  return el;
}

type Props = {
  camps: Campground[];
  height?: number;
};

export default function MapView({ camps, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // ── Map init (once) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [138.6, 35.5],
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

  // ── Marker sync (on every camps change) ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMarkers = () => {
      // 古いマーカーを削除
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (camps.length === 0) return;

      const bounds = new maplibregl.LngLatBounds();

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
        bounds.extend([camp.lng, camp.lat]);
      });

      if (camps.length === 1) {
        map.flyTo({
          center: [camps[0].lng, camps[0].lat],
          zoom: 12,
          duration: 700,
        });
      } else {
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          maxZoom: 11,
          duration: 700,
        });
      }
    };

    if (map.loaded()) {
      syncMarkers();
    } else {
      map.once("load", syncMarkers);
    }
  }, [camps]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden"
      style={{ height }}
    />
  );
}
