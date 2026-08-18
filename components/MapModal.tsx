"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { hasUsableCoord } from "@/lib/camp";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import type { Campground } from "@/lib/types";
import {
  MAP_STYLE,
  addCampPinLayers,
  setSelectedPin,
  setMapTheme,
  bindPinCursor,
  pinAt,
} from "@/lib/map-style";

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
  const readyRef = useRef(false);

  const [selected, setSelected] = useState<Campground | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  /**
   * クリックハンドラは初期化時に1度だけ登録するので ref 経由で最新を参照する。
   * 代入はレンダー中ではなくエフェクトで行う（react-hooks/refs）。
   * このエフェクトを先に宣言し、マウント時に地図初期化より先に走らせる。
   */
  const campsRef = useRef(camps);
  useEffect(() => {
    campsRef.current = camps;
  }, [camps]);

  // 昼夜切り替え
  const toggleTheme = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = !isDark;
    setIsDark(next);
    setMapTheme(map, next);
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

  /**
   * 選択中のピンをハイライト。
   * 旧実装は保持していた div の style を直接書き換えていたが、
   * circle レイヤでは専用レイヤのフィルタを差し替えるだけで済む。
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    setSelectedPin(map, selected?.slug ?? null);
  }, [selected]);

  // Map init (once on mount)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [138.8, 35.45],
      zoom: 8.0,
      attributionControl: { compact: true },
      cooperativeGestures: false,
      touchZoomRotate: true,
      touchPitch: false,
      dragPan: true,
      dragRotate: false,
      scrollZoom: true,
      boxZoom: false,
      doubleClickZoom: true,
    });

    mapRef.current = map;

    map.dragPan.enable({ deceleration: 1200, maxSpeed: 2000 });

    // コンテナサイズ確定後にリサイズして位置ズレを解消
    setTimeout(() => mapRef.current?.resize(), 100);

    map.once("load", () => {
      map.setMaxBounds([
        [136.5, 34.2],
        [140.0, 36.2],
      ]);

      addCampPinLayers(map, campsRef.current);
      bindPinCursor(map);
      readyRef.current = true;

      /**
       * 旧実装はマーカーの div に touchstart/touchmove/touchend を自前で張り、
       * MapLibre のパン処理と競合していた。circle レイヤなら MapLibre 自身が
       * ドラッグとタップを判別してから click を発火するので、その競合が無くなる。
       */
      map.on("click", (e) => {
        const slug = pinAt(map, e.point);
        if (!slug) return;
        const camp = campsRef.current.find((c) => c.slug === slug);
        if (camp) openPanel(camp);
      });
    });

    return () => {
      readyRef.current = false;
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
        style={{ position: "absolute", inset: 0, minWidth: 0, display: "block", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
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
      {/* 正しい位置が分からない施設では出さない（hasUsableCoord）。@0,0 はギニア湾沖を指す */}
      {hasUsableCoord(camp) && (
        <a
          href={`https://www.google.com/maps/search/スーパーマーケット+精肉店+鮮魚店+スーパー銭湯+銭湯/@${camp.lat},${camp.lng},11z`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", marginTop: "6px", fontSize: "11px", color: "#e8611f", textDecoration: "none" }}
        >
          🛒 周辺の買い物を探す
        </a>
      )}
    </div>
  );
}
