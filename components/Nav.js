'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export default function Nav({ items }) {
  const p = usePathname();
  return (<nav aria-label="Main">{items.map(([h, l]) => <Link key={h} href={h} aria-current={p === h ? 'page' : undefined}>{l}</Link>)}</nav>);
}
