'use client';
import { useEffect, useState } from 'react';
export default function Gallery({ items }) {
  const [open, setOpen] = useState(null);
  const n = items.length;
  useEffect(() => {
    const k = (e) => {
      if (open === null) return;
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((o) => (o + 1) % n);
      if (e.key === 'ArrowLeft') setOpen((o) => (o - 1 + n) % n);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open, n]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    document.querySelectorAll('.tile:not(.in)').forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [items]);
  if (!n) return <p className="empty">Nothing here yet.</p>;
  const a = open !== null ? items[open] : null, stop = (e) => e.stopPropagation();
  return (<>
    <div className="masonry">
      {items.map((x, i) => (
        <button key={x.id} className="tile" onClick={() => setOpen(i)} aria-label={`View ${x.title || 'artwork'}`}>
          <img src={x.src} alt={x.title || ''} loading="lazy" /><span>{x.title}</span>
        </button>))}
    </div>
    {a && (
      <div className="viewer" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
        <div className="vhead" onClick={stop}><b>{a.title}</b><span>{[a.year, a.project].filter(Boolean).join(' · ')}</span>
          <em>{open + 1} / {n}</em><button className="close" autoFocus onClick={() => setOpen(null)}>Close</button></div>
        <img src={a.src} alt={a.title || ''} onClick={stop} />
        {n > 1 && <><button className="vn l" aria-label="Previous" onClick={(e) => { stop(e); setOpen((open - 1 + n) % n); }}>‹</button>
          <button className="vn r" aria-label="Next" onClick={(e) => { stop(e); setOpen((open + 1) % n); }}>›</button></>}
        {(a.description || a.link) && <p onClick={stop}>{a.description} {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer">Visit link</a>}</p>}
        <div className="thumbs" onClick={stop}>{items.map((t, j) => <button key={t.id} className={j === open ? 'on' : ''} aria-label={`Open ${t.title || 'artwork'}`} onClick={() => setOpen(j)}><img src={t.src} alt="" /></button>)}</div>
      </div>)}
  </>);
}
