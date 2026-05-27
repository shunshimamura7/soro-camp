"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

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
function createEmberEl(large = false): HTMLDivElement {
  const el = document.createElement("div");
  // CSS クラスはアニメーション用。inline styles で寸法・色を保証する
  el.className = large ? "camp-marker camp-marker--lg" : "camp-marker";
  const size = large ? 18 : 14;
  el.style.cssText =
    `width:${size}px;height:${size}px;` +
    "background:#e8611f;" +
    "border-radius:50%;" +
    "cursor:pointer;" +
    "box-shadow:0 0 0 2px rgba(232,97,31,0.35),0 0 10px rgba(232,97,31,0.65);";
  return el;
}

type Props = {
  lat: number;
  lng: number;
  name: string;
  height?: number;
};

export default function CampMap({ lat, lng, name, height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: 13,
      cooperativeGestures: true,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    map.once("load", () => {
      const el = createEmberEl(true);

      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: false,
        maxWidth: "220px",
      }).setHTML(`<span class="camp-popup-name">${name}</span>`);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      // マーカーをクリックせずにポップアップを自動開示
      setTimeout(() => marker.togglePopup(), 700);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, name]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height }}
    />
  );
}
