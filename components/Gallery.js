'use client';
import { useEffect, useState } from 'react';
export default function Gallery({ items }) {
  const [open, setOpen] = useState(null);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  if (!items.length) return <p className="empty">Nothing here yet.</p>;
  return (<>
    <div className="masonry">
      {items.map((a) => (
        <button key={a.id} className="tile" onClick={() => setOpen(a)} aria-label={`View ${a.title || 'artwork'}`}>
          <img src={a.src} alt={a.title || ''} loading="lazy" />
          <span>{a.title}</span>
        </button>))}
    </div>
    {open && (
      <div className="viewer" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
        <button className="close" autoFocus onClick={() => setOpen(null)}>Close</button>
        <img src={open.src} alt={open.title || ''} onClick={(e) => e.stopPropagation()} />
        <p onClick={(e) => e.stopPropagation()}>
          <b>{open.title}</b> {open.year || ''} {open.project ? `· ${open.project}` : ''}<br />
          {open.description}{' '}
          {open.link && <a href={open.link} target="_blank" rel="noopener noreferrer">Visit link</a>}
        </p>
      </div>)}
  </>);
}
