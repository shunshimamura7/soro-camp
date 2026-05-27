"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

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
      // Ember dot marker
      const el = document.createElement("div");
      el.className = "camp-marker camp-marker--lg";

      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: false,
        maxWidth: "220px",
      }).setHTML(`<span class="camp-popup-name">${name}</span>`);

      new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      // Auto-open popup
      setTimeout(() => {
        popup.addTo(map);
        popup.setLngLat([lng, lat]);
      }, 600);
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
