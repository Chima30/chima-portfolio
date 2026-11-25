'use client';
import { useEffect, useRef } from 'react';

// A short, muted, looping recording of a desktop app. It plays only while on screen, and not at all for people who
// ask for reduced motion (they see the still poster frame instead).
export default function ShipVideo({ mp4, webm, poster, label }) {
  const v = useRef(null);
  useEffect(() => {
    const el = v.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video ref={v} muted loop playsInline preload="none" poster={poster} aria-label={label}>
      <source src={webm} type="video/webm" />
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
