"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Campground } from "@/lib/types";

const CARTO_TILES = [
  "https://a.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}@2x.png",
  "https://b.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}@2x.png",
  "https://c.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}@2x.png",
  "https://d.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}@2x.png",
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
      center: [138.82, 35.45],
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

  // ── Marker sync (on every camps change) ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMarkers = () => {
      // Remove previous markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (camps.length === 0) return;

      const bounds = new maplibregl.LngLatBounds();

      camps.forEach((camp) => {
        const el = document.createElement("div");
        el.className = "camp-marker";

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
          padding: { top: 48, bottom: 48, left: 48, right: 48 },
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
