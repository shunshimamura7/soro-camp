'use client';
import { useState, useEffect } from 'react';

export default function FavoriteButton({ slug }: { slug: string }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('soro-favs') ?? '[]');
    setFav(favs.includes(slug));
  }, [slug]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs: string[] = JSON.parse(localStorage.getItem('soro-favs') ?? '[]');
    const next = fav
      ? favs.filter(s => s !== slug)
      : [...favs, slug];
    localStorage.setItem('soro-favs', JSON.stringify(next));
    setFav(!fav);
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
