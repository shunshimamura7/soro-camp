'use client';
import { useState, useSyncExternalStore } from 'react';

const KEY = 'soro-favs';
/** 同じページ内の他のボタンに変更を伝えるためのイベント。storage イベントは別タブにしか飛ばない */
const CHANGE_EVENT = 'soro-favs-change';

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * スナップショットは localStorage の生文字列にする。
 * ここで配列を返すと呼ばれるたびに新しい参照になり、useSyncExternalStore が
 * 変化し続けていると判断して無限に再レンダリングする。
 */
function getSnapshot() {
  try {
    return localStorage.getItem(KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

/** 静的エクスポート時は localStorage を触れない。空として描き、マウント後に実値へ入れ替わる */
function getServerSnapshot() {
  return '[]';
}

function parse(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/** 保存したキャンプ場の slug 一覧。トップの「保存済みだけ表示」でも使う */
export function useFavorites(): string[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return parse(raw);
}

/**
 * 保存ボタン（2026-11-05 に 🔥 から ☆／★ に変更）。
 * 🔥 は「焚き火OK」や「人気」に読まれ、詳細ページの「🔥 焚き火」チップとも意味が衝突していた
 * （審査員1・5）。保存の意味が伝わる形にし、文字ラベルも付ける。
 */
export default function FavoriteButton({ slug, name }: { slug: string; name?: string }) {
  const favs = useFavorites();
  const fav = favs.includes(slug);
  /** 押した結果を読み上げる（審査員6：aria-pressed だけでは結果が音で分からない） */
  const [said, setSaid] = useState('');

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = parse(getSnapshot());
    const next = fav ? current.filter((s) => s !== slug) : [...current, slug];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ストレージが使えない環境では保存しない */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
    setSaid(fav ? `${name ?? ''}を保存から外しました（${next.length}件）` : `${name ?? ''}を保存しました（${next.length}件）`);
  };

  // ラベルは固定し、状態は aria-pressed だけで伝える（ラベルと状態が食い違って読まれていた。審査員6）
  const label = `${name ? `${name}を` : ''}保存`;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={fav}
      aria-label={label}
      title={label}
      className={`relative z-10 inline-flex items-center justify-center gap-1 min-w-[44px] h-11 -my-2 -mr-2 px-2 rounded-lg text-[13px] font-semibold transition-colors ${
        fav ? 'text-[#b5440e]' : 'text-[#6b5d50] hover:text-[#b5440e]'
      }`}
    >
      <span aria-hidden="true" className="text-[18px] leading-none">{fav ? '★' : '☆'}</span>
      <span className="text-[12px]">{fav ? '保存済み' : '保存'}</span>
      <span role="status" className="sr-only">{said}</span>
    </button>
  );
}
