import './globals.css';
import Link from 'next/link';
import Backdrop from '@/components/Backdrop';
import ThemeToggle from '@/components/ThemeToggle';
import Nav from '@/components/Nav';
import BackToTop from '@/components/BackToTop';
import { getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Chima — Digital Artist', template: '%s — Chima' },
  description: 'Digital artist and illustrator. Art first, with development and Web3 work on the side.',
  openGraph: { title: 'Chima — Digital Artist', description: 'Digital artist, illustrator, creative.', type: 'website' },
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23151413'/><circle cx='16' cy='16' r='7' fill='%23ee6a2c'/></svg>" },
};
const nav = [['/', 'Art'], ['/development', 'Development'], ['/about', 'About'], ['/contact', 'Contact']];
export default async function Root({ children }) {
  const s = await getSettings();
  return (<html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('theme')||'dark'}catch(e){}" }} /></head><body><Backdrop />
    <header className="top" id="top"><Link href="/" className="mark">chima</Link><Nav items={nav} />
      <div className="act"><ThemeToggle /><a className="cta" href="https://x.com/therichworth" target="_blank" rel="noopener noreferrer">Get in touch</a></div></header>
    <main>{children}</main>
    <footer className="bigfoot">
      <div className="fcta"><h2>Let's work together.</h2><p>{s.contact_text}</p><a className="cta" href="https://x.com/therichworth" target="_blank" rel="noopener noreferrer">Get in touch</a></div>
      <div className="fcols"><div><h4>Pages</h4>{nav.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</div>
        <div><h4>Elsewhere</h4><a href="https://x.com/therichworth" target="_blank" rel="noopener noreferrer">X ↗</a></div></div>
      <div className="wordmark" aria-hidden="true">chima</div>
      <div className="fbase"><span>© 2026 Chima. {s.tagline}</span><BackToTop /></div>
    </footer></body></html>);
}
