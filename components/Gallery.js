'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { titleOf, altOf, detailsOf } from '@/lib/art';

// Orientation decides how much room a piece gets, so every work keeps its own proportions.
const orient = (r) => (!r ? 'u' : r > 1.2 ? 'l' : r < 0.85 ? 'p' : 's');

export default function Gallery({ items }) {
  const [open, setOpen] = useState(null);
  const [ratios, setRatios] = useState({});
  const n = items.length;
  const closeRef = useRef(null), viewerRef = useRef(null), back = useRef(null), touch = useRef(null);

  const go = useCallback((d) => setOpen((o) => (o === null ? o : (o + d + n) % n)), [n]);
  const close = useCallback(() => setOpen(null), []);
  const launch = (i) => { back.current = document.activeElement; setOpen(i); };

  // Keyboard, scroll lock, focus return and a simple focus trap while the viewer is open.
  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab' && viewerRef.current) {
        const f = [...viewerRef.current.querySelectorAll('button, a[href]')];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; back.current?.focus?.(); };
  }, [open === null, close, go]);

  // Load the neighbours so Previous and Next feel immediate.
  useEffect(() => {
    if (open === null || n < 2) return;
    [1, -1].forEach((d) => { const im = new Image(); im.src = items[(open + d + n) % n].src; });
  }, [open, items, n]);

  const measure = (id) => (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (w && h) setRatios((r) => (r[id] ? r : { ...r, [id]: w / h }));
  };

  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = [t.clientX, t.clientY]; };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const t = e.changedTouches[0], dx = t.clientX - touch.current[0], dy = t.clientY - touch.current[1];
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
  };

  if (!n) return <p className="empty">Nothing here yet.</p>;
  const a = open !== null ? items[open] : null;
  const stop = (e) => e.stopPropagation();

  return (<>
    <ul className="wall">
      {items.map((x, i) => (
        <li key={x.id} className={`fig o-${orient(ratios[x.id])}`}>
          <button className="piece" onClick={() => launch(i)} aria-label={`View ${titleOf(x) || 'artwork'}${x.year ? `, ${x.year}` : ''}`}>
            <img src={x.src} alt={altOf(x)} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" onLoad={measure(x.id)} />
          </button>
          {(titleOf(x) || x.year) && <p className="cap"><span>{titleOf(x)}</span>{x.year ? <time>{x.year}</time> : null}</p>}
        </li>))}
    </ul>
    {a && (
      <div className="viewer" ref={viewerRef} role="dialog" aria-modal="true" aria-label={titleOf(a) || 'Artwork'}
        onClick={close} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="vtop" onClick={stop}>
          <span className="vcount" aria-live="polite">{open + 1} of {n}</span>
          <button ref={closeRef} className="vbtn" onClick={close}>Close</button>
        </div>
        <div className="vstage"><img key={a.id} src={a.src} alt={altOf(a)} onClick={stop} /></div>
        <div className="vinfo" onClick={stop}>
          <div className="vtext">
            {titleOf(a) && <h2>{titleOf(a)}</h2>}
            {detailsOf(a) && <p className="vmeta">{detailsOf(a)}</p>}
            {a.description && <p className="vdesc">{a.description}</p>}
            {a.link && <p><a href={a.link} target="_blank" rel="noopener noreferrer">Visit link</a></p>}
          </div>
          {n > 1 && <div className="vnav"><button className="vbtn" onClick={() => go(-1)}>Previous</button><button className="vbtn" onClick={() => go(1)}>Next</button></div>}
        </div>
      </div>)}
  </>);
}
