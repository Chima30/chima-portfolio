'use client';
import { useEffect, useRef, useState } from 'react';
import Viewer from '@/components/Viewer';
export default function Featured({ items }) {
  const ref = useRef(null);
  const [act, setAct] = useState(0), [open, setOpen] = useState(null);
  const pick = () => {
    const t = ref.current; if (!t) return;
    const c = t.scrollLeft + t.clientWidth / 2; let best = 0, d = 1e9;
    [...t.children].forEach((el, i) => { const dd = Math.abs(el.offsetLeft + el.offsetWidth / 2 - c); if (dd < d) { d = dd; best = i; } });
    setAct(best);
  };
  useEffect(pick, []);
  const go = (d) => { const el = ref.current?.children[Math.max(0, Math.min(items.length - 1, act + d))]; el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); };
  return (<div className="fc" data-reveal>
    <h2 className="h2">Selected <em>work</em></h2>
    <button className="fc-arrow l" aria-label="Previous piece" onClick={() => go(-1)}>‹</button>
    <div className="fc-track" ref={ref} onScroll={pick}>
      {items.map((a, i) => (
        <button key={a.id} className={'glass fcard' + (i === act ? ' act' : '')} onClick={() => setOpen(i)} aria-label={`View ${a.title || 'artwork'}`}>
          <img src={a.src} alt={a.title || 'Artwork'} />
          {(a.title || a.project) && <span>{a.title}{a.title && a.project ? ' · ' : ''}{a.project}</span>}
        </button>))}
    </div>
    <button className="fc-arrow r" aria-label="Next piece" onClick={() => go(1)}>›</button>
    {open !== null && <Viewer items={items} index={open} onChange={setOpen} />}
  </div>);
}
