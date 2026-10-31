'use client';
import { useRef, useState } from 'react';
import Viewer from '@/components/Viewer';
const DEFS = [['featured', 'Featured Art'], ['personal', 'Personal Artwork'], ['client', 'Client and Community Work'], ['nft', 'NFTs']];
export default function Folders({ items }) {
  const [open, setOpen] = useState(null), [view, setView] = useState(null);
  const panel = useRef(null);
  const keys = DEFS.map((d) => d[0]);
  const folders = DEFS.map(([k, l]) => ({ k, l, items: items.filter((a) => (k === 'featured' ? a.featured : false) || (a.categories || []).includes(k)) }));
  const rest = items.filter((a) => !a.featured && !(a.categories || []).some((c) => keys.includes(c)));
  if (rest.length) folders.push({ k: 'more', l: 'More work', items: rest });
  const list = folders.filter((f) => f.items.length);
  const cur = list.find((f) => f.k === open);
  const toggle = (k) => {
    setOpen(open === k ? null : k);
    if (open !== k) setTimeout(() => panel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };
  if (!list.length) return <p className="empty">Nothing here yet.</p>;
  return (<>
    <div className="fgrid">
      {list.map((f, n) => (
        <button key={f.k} className={'folder' + (open === f.k ? ' open' : '')} style={{ '--n': n }} aria-expanded={open === f.k} onClick={() => toggle(f.k)}>
          <span className="fd-back"><span className="fd-tab" /></span>
          <span className="fd-pics">{f.items.slice(0, 3).map((a, i) => <img key={a.id} className={'p' + i} src={a.src} alt="" loading="lazy" />)}</span>
          <span className="fd-front"><b>{f.l}</b><small>{f.items.length} {f.items.length === 1 ? 'piece' : 'pieces'}</small><i aria-hidden="true">{open === f.k ? '−' : '+'}</i></span>
        </button>))}
    </div>
    {cur && (
      <div className="fpanel" ref={panel} key={cur.k}>
        <div className="fp-head"><h3>{cur.l}</h3><span>{cur.items.length} {cur.items.length === 1 ? 'piece' : 'pieces'}</span>
          <button onClick={() => setOpen(null)}>Close folder</button></div>
        <div className="masonry">
          {cur.items.map((x, i) => (
            <button key={x.id} className="ft" style={{ '--i': i }} onClick={() => setView(i)} aria-label={`View ${x.title || 'artwork'}`}>
              <img src={x.src} alt={x.title || 'Artwork'} loading="lazy" />{x.title && <span>{x.title}</span>}
            </button>))}
        </div>
      </div>)}
    {view !== null && cur && <Viewer items={cur.items} index={view} onChange={setView} />}
  </>);
}
