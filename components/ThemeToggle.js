'use client';
import { useEffect, useState } from 'react';
export default function ThemeToggle() {
  const [t, setT] = useState('dark');
  useEffect(() => setT(document.documentElement.dataset.theme || 'dark'), []);
  const flip = () => {
    const n = t === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = n; setT(n);
    try { localStorage.setItem('theme', n); } catch (e) {}
  };
  return (<button className="tt" onClick={flip} aria-label={`Switch to ${t === 'dark' ? 'light' : 'dark'} mode`}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      {t === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> : <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />}
    </svg></button>);
}
