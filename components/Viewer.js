'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
export default function Viewer({ items, index, onChange }) {
  const n = items.length, a = items[index];
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onChange(null);
      if (e.key === 'ArrowRight') onChange((index + 1) % n);
      if (e.key === 'ArrowLeft') onChange((index - 1 + n) % n);
    };
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [index, n, onChange]);
  if (!a || !ready) return null;
  const stop = (e) => e.stopPropagation();
  return createPortal(
    <div className="viewer" role="dialog" aria-modal="true" onClick={() => onChange(null)}>
      <div className="vhead" onClick={stop}><b>{a.title || 'Untitled'}</b><span>{[a.year, a.project].filter(Boolean).join(' · ')}</span>
        <em>{index + 1} / {n}</em><button className="close" autoFocus onClick={() => onChange(null)}>Close</button></div>
      <img src={a.src} alt={a.title || 'Artwork'} onClick={stop} />
      {n > 1 && <><button className="vn l" aria-label="Previous" onClick={(e) => { stop(e); onChange((index - 1 + n) % n); }}>‹</button>
        <button className="vn r" aria-label="Next" onClick={(e) => { stop(e); onChange((index + 1) % n); }}>›</button></>}
      {(a.description || a.link) && <p onClick={stop}>{a.description} {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer">Visit link</a>}</p>}
      <div className="thumbs" onClick={stop}>{items.map((t, j) => <button key={t.id} className={j === index ? 'on' : ''} aria-label={`Open ${t.title || 'artwork'}`} onClick={() => onChange(j)}><img src={t.src} alt="" /></button>)}</div>
    </div>, document.body);
}
