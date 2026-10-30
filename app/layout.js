import './globals.css';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Nav from '@/components/Nav';
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
  return (<html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('theme')||'dark'}catch(e){}" }} /></head>
    <body>
      <header className="top" id="top"><Link href="/" className="mark">chima</Link><Nav items={nav} /><ThemeToggle /></header>
      <main>{children}</main>
      <footer className="foot">
        <p>{s.tagline}</p>
        <p className="fine"><a href="https://x.com/therichworth" target="_blank" rel="noopener noreferrer">X</a><Link href="/contact">Contact</Link><span>© {new Date().getFullYear()} Chima</span></p>
      </footer>
    </body></html>);
}
