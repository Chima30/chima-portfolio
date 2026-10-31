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
    const m = (e) => {
      const g = e.target.closest && e.target.closest('.glass'); if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', e.clientX - r.left + 'px'); g.style.setProperty('--my', e.clientY - r.top + 'px');
    };
    document.addEventListener('pointermove', m, { passive: true });
    return () => document.removeEventListener('pointermove', m);
  }, []);
  return null;
}
