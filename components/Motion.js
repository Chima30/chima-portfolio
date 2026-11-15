'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
export default function Motion() {
  const path = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 });
    document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);
  useEffect(() => {
    // Once per frame at most: pointer events can arrive far faster than the screen refreshes.
    let raf = 0, ev = null;
    const apply = () => {
      raf = 0;
      const g = ev && ev.target.closest && ev.target.closest('.glass'); if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', ev.clientX - r.left + 'px'); g.style.setProperty('--my', ev.clientY - r.top + 'px');
    };
    const m = (e) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); };
    document.addEventListener('pointermove', m, { passive: true });
    return () => { document.removeEventListener('pointermove', m); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
