'use client';
import { useState } from 'react';
import Gallery from '@/components/Gallery';
const TABS = [['all','All'],['featured','Featured'],['personal','Personal'],['client','Client work'],['nft','NFTs']];
export default function Work({ items }) {
  const [tab, setTab] = useState('all');
  const has = (k) => k === 'all' || items.some((a) => (k === 'featured' ? a.featured : a.categories?.includes(k)));
  const shown = items.filter((a) => tab === 'all' || (tab === 'featured' ? a.featured : a.categories?.includes(tab)));
  return (<>
    <div className="tabs" role="tablist">{TABS.filter(([k]) => has(k)).map(([k, l]) => (
      <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>))}</div>
    <Gallery key={tab} items={shown} />
  </>);
}
