import './globals.css';
import Link from 'next/link';
import Backdrop from '@/components/Backdrop';
import ThemeToggle from '@/components/ThemeToggle';
import Nav from '@/components/Nav';
import BackToTop from '@/components/BackToTop';
import Motion from '@/components/Motion';
import { getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Chima — Digital Artist', template: '%s — Chima' },
  description: 'Chima is a digital artist and illustrator. Art first, with development and Web3 work on the side.',
  openGraph: { title: 'Chima — Digital Artist', description: 'Digital artist, illustrator, creative.', type: 'website' },
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23090a0a'/><path d='M16 4l2 10 10 2-10 2-2 10-2-10-10-2 10-2z' fill='%23a3c19a'/></svg>" },
};
const nav = [['/', 'Art'], ['/development', 'Development'], ['/about', 'About'], ['/contact', 'Contact']];
const X = 'https://x.com/therichworth';
export default async function Root({ children }) {
  const s = await getSettings();
  return (<html lang="en" suppressHydrationWarning><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@1,400;1,500&display=swap" />
    <script dangerouslySetInnerHTML={{ __html: "try{var d=document.documentElement;d.dataset.theme=localStorage.getItem('theme')||'dark';d.classList.add('js');var r=matchMedia('(prefers-reduced-motion: reduce)').matches;d.style.setProperty('--hd',(sessionStorage.getItem('intro')||r)?'0s':'3.1s')}catch(e){}" }} />
  </head><body><Backdrop /><Motion />
    <header className="top" id="top"><Link href="/" className="mark">chima</Link><Nav items={nav} />
      <div className="act"><ThemeToggle /><a className="cta" href={X} target="_blank" rel="noopener noreferrer">Get in touch</a></div></header>
    <main>{children}</main>
    <footer className="foot">
      <div className="cta-block" data-reveal>
        <div className="cta-left"><span className="badge">Contact</span>
          <div className="seal-w" aria-hidden="true">
            <svg className="seal" viewBox="0 0 120 120"><defs><path id="sealpath" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
              <text fontSize="11" fill="currentColor"><textPath href="#sealpath" textLength="283" lengthAdjust="spacing">art • illustration • stories • colour • </textPath></text></svg>
            <i>c</i></div></div>
        <div className="cta-right"><p className="cta-lead">Let's start</p>
          <h2>Work <em>together</em></h2>
          <p className="cta-p">{s.contact_text}</p>
          <a className="cta-link" href={X} target="_blank" rel="noopener noreferrer">Get in touch <span className="circ">→</span></a></div>
      </div>
      <div className="fcards">
        <div className="glass fl"><b className="flogo">chima</b><p>{s.tagline}</p>
          <div className="fpills">{nav.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</div>
          <span className="wm" aria-hidden="true">c</span><small>© 2026 Chima. All rights reserved.</small></div>
        <div className="glass fr"><h4>Find me elsewhere</h4>
          <a className="soc" href={X} target="_blank" rel="noopener noreferrer" aria-label="Chima on X"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8-9.2L1.3 2h7l4.8 6.3L18.9 2zm-1.2 18h1.8L6.6 3.9H4.7L17.7 20z" /></svg></a>
          <p className="meta">Discord: {s.discord}</p><BackToTop /></div>
      </div>
    </footer></body></html>);
}
