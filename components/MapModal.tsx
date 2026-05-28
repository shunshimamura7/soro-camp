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
    "transition:transform 0.15s ease,box-shadow 0.15s ease;" +
    "pointer-events:none;";
  el.appendChild(dot);
  return el;
}

/**
 * マーカー要素にタップ判定付きのイベントを登録する。
 *
 * ポイント：
 * - touchstart で stopPropagation + preventDefault → MapLibre がタッチを
 *   パン操作として横取りするのを防ぐ（これが「たまに反応しない」の根本原因）
 * - touchmove でドラッグ検知 → 8px 以上動いたらタップキャンセル
 * - touchend がタップと判定した場合のみ onTap() を呼ぶ
 * - click はマウス（PC）用
 */
function bindTapHandler(el: HTMLDivElement, onTap: () => void): void {
  let isTap = false;
  let startX = 0;
  let startY = 0;

  el.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      e.stopPropagation();
      e.preventDefault(); // ← Critical: これがないと MapLibre がタッチを奪う
      isTap = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      // タッチ中は z-index を上げて他のマーカーより前面に
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
        // スクロール / パン → タップキャンセル
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
      e.preventDefault(); // synthesized click を抑制して二重発火防止
      onTap();
    },
    { passive: false },
  );

  // マウス（PC）用
  el.addEventListener("click", (e: MouseEvent) => {
    e.stopPropagation();
    onTap();
  });
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
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const elMapRef = useRef(new Map<string, HTMLDivElement>());

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

  // 選択マーカーをハイライト（内部ドット要素を対象）
  useEffect(() => {
    elMapRef.current.forEach((el, slug) => {
      const dot = el.firstElementChild as HTMLDivElement | null;
      if (!dot) return;
      if (slug === selected?.slug) {
        dot.style.background = "#ff7a00";
        dot.style.transform = "scale(1.7)";
        dot.style.boxShadow =
          "0 0 0 3px rgba(255,122,0,0.5),0 0 20px rgba(255,122,0,0.9)";
      } else {
        dot.style.background = "#e8611f";
        dot.style.transform = "";
        dot.style.boxShadow =
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
      center: [138.65, 35.3],
      zoom: 7.5,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    // コンテナサイズ確定後にリサイズして位置ズレを解消
    setTimeout(() => mapRef.current?.resize(), 100);

    map.once("load", () => {
      camps.forEach((camp) => {
        const el = createEmberEl();
        elMapRef.current.set(camp.slug, el);

        bindTapHandler(el, () => openPanel(camp));

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
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${camp.lat},${camp.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", marginTop: "6px", fontSize: "11px", color: "#e8611f", textDecoration: "none" }}
      >
        Googleマップ →
      </a>
    </div>
  );
}
