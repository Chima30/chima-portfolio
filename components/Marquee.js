'use client';
import { useState } from 'react';
import Viewer from '@/components/Viewer';
export default function Marquee({ items }) {
  const [open, setOpen] = useState(null);
  if (!items.length) return null;
  const n = items.length >= 9 ? 3 : items.length >= 4 ? 2 : 1;
  const rows = Array.from({ length: n }, () => []);
  items.forEach((a, i) => rows[i % n].push({ a, i }));
  return (<>
    <div className="mq" data-reveal>
      {rows.map((r, ri) => {
        let list = r; while (list.length < 6) list = [...list, ...r];
        return (<div key={ri} className={'mq-row' + (ri % 2 ? ' rev' : '')}>
          <div className="mq-track" style={{ animationDuration: Math.max(45, list.length * 8) + 's' }}>
            {[0, 1].map((c) => list.map(({ a, i }, k) => (
              <button key={c + '-' + k} className="mq-t" tabIndex={c ? -1 : 0} aria-hidden={c ? true : undefined}
                aria-label={`View ${a.title || 'artwork'}`} onClick={() => setOpen(i)}>
                <img src={a.src} alt={c ? '' : a.title || 'Artwork'} decoding="async" /></button>)))}
          </div></div>);
      })}
    </div>
    {open !== null && <Viewer items={items} index={open} onChange={setOpen} />}
  </>);
}
