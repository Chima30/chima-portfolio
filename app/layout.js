import './globals.css';
import Link from 'next/link';
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Chima — Digital Artist', template: '%s — Chima' },
  description: 'Digital artist and illustrator. Art first, with development and Web3 work on the side.',
  openGraph: { title: 'Chima — Digital Artist', description: 'Digital artist, illustrator, creative.', type: 'website' },
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23151413'/><circle cx='16' cy='16' r='7' fill='%23ee6a2c'/></svg>" },
};
const nav = [['/', 'Art'], ['/development', 'Development'], ['/about', 'About'], ['/contact', 'Contact']];
export default function Root({ children }) {
  return (<html lang="en"><body>
    <header className="top"><Link href="/" className="mark">Chima</Link>
      <nav aria-label="Main">{nav.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</nav></header>
    <main>{children}</main>
    <footer><div><b>CHIMA</b><p>Digital artist. Always making something.</p></div>
      <div className="flinks">{nav.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
        <a href="https://x.com/therichworth" target="_blank" rel="noopener noreferrer">X</a></div></footer>
  </body></html>);
}
