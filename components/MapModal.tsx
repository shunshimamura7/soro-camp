"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import type { Campground } from "@/lib/types";

// ── Tile / Style ──────────────────────────────────────────────────────────────
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
    { id: "carto-dark-layer", type: "raster", source: "carto-dark", minzoom: 0, maxzoom: 22 },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function createEmberEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText =
    "width:14px;height:14px;" +
    "background:#e8611f;" +
    "border-radius:50%;" +
    "cursor:pointer;" +
    "box-shadow:0 0 0 2px rgba(232,97,31,0.35),0 0 10px rgba(232,97,31,0.65);" +
    "transition:transform 0.15s ease,box-shadow 0.15s ease;";
  return el;
}

function buildTags(camp: Campground): string[] {
  const t: string[] = [];
  if (camp.features.bonfire) t.push("🔥 焚き火OK");
  if (camp.features.reservation === "不要") t.push("📋 予約不要");
  if (camp.features.soloPlan) t.push("🏕 ソロプランあり");
  if (camp.features.pet) t.push("🐶 ペットOK");
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
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const elMapRef = useRef(new Map<string, HTMLDivElement>());

  const [selected, setSelected] = useState<Campground | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Open panel with a camp
  const openPanel = useCallback((camp: Campground) => {
    setSelected(camp);
    setPanelOpen(true);
  }, []);

  // Close just the panel (map stays open)
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    // Clear content after slide-out animation (250ms)
    setTimeout(() => setSelected(null), 260);
  }, []);

  // ESC key: close panel first, then modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panelOpen) closePanel();
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [panelOpen, closePanel, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Highlight / reset active marker
  useEffect(() => {
    elMapRef.current.forEach((el, slug) => {
      if (slug === selected?.slug) {
        el.style.background = "#ff7a00";
        el.style.transform = "scale(1.7)";
        el.style.boxShadow =
          "0 0 0 3px rgba(255,122,0,0.5),0 0 20px rgba(255,122,0,0.9)";
      } else {
        el.style.background = "#e8611f";
        el.style.transform = "";
        el.style.boxShadow =
          "0 0 0 2px rgba(232,97,31,0.35),0 0 10px rgba(232,97,31,0.65)";
      }
    });
  }, [selected]);

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

    map.once("load", () => {
      camps.forEach((camp) => {
        const el = createEmberEl();
        elMapRef.current.set(camp.slug, el);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          openPanel(camp);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([camp.lng, camp.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      elMapRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // camps is a snapshot taken when modal opens — intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0e0d0b" }}
    >
      {/* ── Map canvas ── */}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, minWidth: 0, display: "block" }}
      />

      {/* ── × Close modal button (top-right) ── */}
      <button
        onClick={onClose}
        className="map-modal-close-btn"
        aria-label="地図を閉じる"
      >
        ✕
      </button>

      {/* ── Transparent backdrop: click to close panel ── */}
      {panelOpen && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 6 }}
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* ── Detail panel ── */}
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

// ── Sub-component: Camp detail panel ─────────────────────────────────────────
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
      {/* Panel header */}
      <div className="panel-header">
        <button onClick={onClose} className="panel-close-btn" aria-label="パネルを閉じる">
          ✕
        </button>
      </div>

      {/* Prefecture · Area */}
      <p className="panel-area">
        {camp.prefecture}&nbsp;·&nbsp;{camp.area}
      </p>

      {/* Camp name */}
      <h2 className="panel-name">{camp.name}</h2>

      {/* Solo score + price */}
      <div className="panel-score-row">
        <span className="panel-score">★&nbsp;{camp.soloScore.toFixed(1)}</span>
        <span className="panel-price">¥{camp.priceMin.toLocaleString()}〜</span>
      </div>

      {/* Feature tags */}
      {tags.length > 0 && (
        <div className="panel-tags">
          {tags.map((t) => (
            <span key={t} className="panel-tag">{t}</span>
          ))}
        </div>
      )}

      {/* CTA link */}
      <a href={`/camp/${camp.slug}`} className="panel-detail-link">
        詳細を見る →
      </a>
    </div>
  );
}
