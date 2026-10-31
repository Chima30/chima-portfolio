'use client';
import { useEffect, useState } from 'react';
export default function Intro() {
  const [s, setS] = useState('show');
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('intro') || matchMedia('(prefers-reduced-motion: reduce)').matches; sessionStorage.setItem('intro', '1'); } catch (e) {}
    if (seen) return setS('gone');
    const a = setTimeout(() => setS('out'), 2900), b = setTimeout(() => setS('gone'), 3600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (s === 'gone') return null;
  return (<div className={`intro-cover ${s}`} onClick={() => setS('gone')}>
    <div><p>hi, i'm chima</p><p>i make art.</p><p>take a look.</p></div>
    <button onClick={() => setS('gone')}>Skip</button></div>);
}
