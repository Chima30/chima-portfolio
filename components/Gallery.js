'use client';
import { useEffect, useState } from 'react';
import Viewer from '@/components/Viewer';
import { art, artSet } from '@/lib/img';
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
          <img src={art(x.src, 750)} srcSet={artSet(x.src, [384, 750, 1080])} sizes="(max-width: 700px) 50vw, 380px" alt={x.title || 'Artwork'} loading="lazy" decoding="async" />{x.title && <span>{x.title}</span>}
        </button>))}
    </div>
    {open !== null && <Viewer items={items} index={open} onChange={setOpen} />}
  </>);
}
