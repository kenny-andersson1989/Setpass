import { useEffect, useState } from 'react';
import { imageUrl } from '../lib/exercises';
import type { Exercise } from '../types';

/** Visar start- och slutbilden omväxlande med mjuk övertoning, som en enkel animation. */
export function ExerciseImage({ exercise, size = 'large', animate = true }: { exercise?: Exercise; size?: 'thumb' | 'large'; animate?: boolean }) {
  const [frame, setFrame] = useState(0);
  const imgs = exercise?.images ?? [];
  useEffect(() => {
    if (!animate || imgs.length < 2) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % imgs.length), size === 'thumb' ? 1400 : 1100);
    return () => clearInterval(id);
  }, [animate, imgs.length, size]);

  if (!imgs.length) {
    return <div className={`ex-img ex-img-${size} ex-img-empty`}>{exercise?.name?.[0] ?? '?'}</div>;
  }
  return (
    <div className={`ex-img ex-img-${size}`}>
      {imgs.slice(0, 2).map((src, i) => (
        <img key={src} src={imageUrl(src)} alt="" loading="lazy" decoding="async"
          style={{ opacity: i === frame || imgs.length === 1 ? 1 : 0 }} />
      ))}
    </div>
  );
}
