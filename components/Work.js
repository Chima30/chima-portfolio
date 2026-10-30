'use client';
import { useState } from 'react';
import Gallery from '@/components/Gallery';
const TABS = [['all', 'All'], ['featured', 'Featured'], ['personal', 'Personal'], ['client', 'Client work'], ['nft', 'NFTs']];
export default function Work({ items }) {
  const [tab, setTab] = useState('all');
  const has = (k) => k === 'all' || items.some((a) => (k === 'featured' ? a.featured : a.categories?.includes(k)));
  const shown = items.filter((a) => tab === 'all' || (tab === 'featured' ? a.featured : a.categories?.includes(tab)));
  const tabs = TABS.filter(([k]) => has(k));
  return (<>
    {tabs.length > 2 && <div className="filter" role="group" aria-label="Filter artwork">{tabs.map(([k, l]) => (
      <button key={k} aria-pressed={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>))}</div>}
    <Gallery key={tab} items={shown} />
  </>);
}
