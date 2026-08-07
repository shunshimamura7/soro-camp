'use client';
import { useSyncExternalStore } from 'react';

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
  return localStorage.getItem(KEY) ?? '[]';
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

export default function FavoriteButton({ slug }: { slug: string }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const fav = parse(raw).includes(slug);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs = parse(localStorage.getItem(KEY) ?? '[]');
    const next = fav ? favs.filter((s) => s !== slug) : [...favs, slug];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <button
      onClick={toggle}
      className={`text-lg leading-none transition-transform hover:scale-125 ${fav ? 'text-[#e8611f]' : 'text-slate-300'}`}
      title={fav ? 'お気に入り解除' : 'お気に入り追加'}
      aria-label={fav ? 'お気に入り解除' : 'お気に入り追加'}
    >
      🔥
    </button>
  );
}
