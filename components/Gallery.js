'use client';
import { useEffect, useState } from 'react';
import Viewer from '@/components/Viewer';
export default function Gallery({ items }) {
  const [open, setOpen] = useState(null);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    document.querySelectorAll('.tile:not(.in)').forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [items]);
  if (!items.length) return <p className="empty">Nothing here yet.</p>;
  return (<>
    <div className="masonry">
      {items.map((x, i) => (
        <button key={x.id} className="tile" onClick={() => setOpen(i)} aria-label={`View ${x.title || 'artwork'}`}>
          <img src={x.src} alt={x.title || 'Artwork'} loading="lazy" />{x.title && <span>{x.title}</span>}
        </button>))}
    </div>
    {open !== null && <Viewer items={items} index={open} onChange={setOpen} />}
  </>);
}
