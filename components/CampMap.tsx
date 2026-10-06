"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { MAP_STYLE, setMapTheme } from "@/lib/map-style";

/**
 * タイル定義はここに持たない。`lib/map-style.ts` の MAP_STYLE を共有する。
 *
 * 以前はこのファイルが CARTO の dark_all を独自に抱えていて、
 * 一覧地図の背景を差し替えても**詳細ページの地図だけ古い配信元のまま**だった。
 * 実際それで、CARTO がキー必須になったとき「API KEY REQUIRED」の透かしが
 * ここにだけ残った。背景の出所は 1 箇所に集める。
 *
 * この地図は常に夜（詳細ページの地の色が炭 #0e0d0b）なので、
 * 読み込み後に setMapTheme(map, true) で反転をかける。
 */

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
      // 詳細ページは常に夜モード。ピンのレイヤを持たない地図なので、
      // setMapTheme は背景のラスタ補正だけを掛けて戻る。
      setMapTheme(map, true);

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
