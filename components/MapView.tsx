"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { hasUsableCoord } from "@/lib/camp";
import maplibregl from "maplibre-gl";
import type { Campground } from "@/lib/types";
import {
  MAP_STYLE,
  addCampPinLayers,
  setPinData,
  setMapTheme,
  bindPinCursor,
  pinAt,
} from "@/lib/map-style";

type Props = { camps: Campground[]; height?: number };

function popupHtml(camp: Campground): string {
  // 正しい位置が分からない施設では買い物リンクを出さない（判定は hasUsableCoord に一本化）。
  // @0,0 はギニア湾沖を指し、誤った座標は無関係な場所の周辺を出してしまう。
  const hasCoord = hasUsableCoord(camp);
  const shop =
    `https://www.google.com/maps/search/` +
    `スーパーマーケット+精肉店+鮮魚店+スーパー銭湯+銭湯/@${camp.lat},${camp.lng},11z`;
  return (
    `<a href="/camp/${camp.slug}" class="camp-popup-link">` +
      `<span class="camp-popup-name">${camp.name}</span>` +
    `</a>` +
    (hasCoord
      ? `<a href="${shop}" target="_blank" rel="noopener noreferrer" ` +
        `style="display:block;margin-top:6px;font-size:11px;color:#e8611f;text-decoration:none;">` +
        `🛒 周辺の買い物を探す</a>`
      : '')
  );
}

export default function MapView({ camps, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const readyRef = useRef(false);
  const [isDark, setIsDark] = useState(false);

  /**
   * クリックハンドラは初期化時に1度だけ登録するので、
   * そのままだと初回レンダー時の camps を握り続ける。
   * 絞り込み後の一覧を見せるために ref 経由で最新を参照する。
   *
   * 代入はレンダー中ではなくエフェクトで行う（react-hooks/refs）。
   * このエフェクトを先に宣言しておくことで、マウント時に
   * 地図初期化より先に走ることを保証する。
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

  // ── Map init (once) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [138.8, 35.45],
      zoom: 8.0,
      cooperativeGestures: false,
      attributionControl: { compact: true },
    });

    map.touchZoomRotate.enable();
    map.touchPitch.disable();
    map.dragPan.enable();

    mapRef.current = map;

    const popup = new maplibregl.Popup({
      offset: 14,
      closeButton: false,
      maxWidth: "200px",
    });
    popupRef.current = popup;

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
       * MapLibre がタッチをパンとして横取りするのと競合していた（「たまに反応しない」）。
       * circle レイヤなら MapLibre 自身がドラッグとタップを判別したうえで
       * click を発火するので、その競合自体が無くなる。
       */
      map.on("click", (e) => {
        const slug = pinAt(map, e.point);
        if (!slug) {
          popup.remove();
          return;
        }
        const camp = campsRef.current.find((c) => c.slug === slug);
        if (!camp) return;
        popup.setLngLat([camp.lng, camp.lat]).setHTML(popupHtml(camp)).addTo(map);
      });
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── 絞り込みの反映 ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    setPinData(map, camps);
    // 絞り込みで消えた施設のポップアップが残らないように閉じる
    popupRef.current?.remove();
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
