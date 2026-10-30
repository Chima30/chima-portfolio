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
  return (<button className="tt" onClick={flip} aria-label={`Switch to ${t === 'dark' ? 'light' : 'dark'} mode`}>{t === 'dark' ? 'Light' : 'Dark'}</button>);
}
