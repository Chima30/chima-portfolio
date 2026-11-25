import Link from 'next/link';
import BackToTop from './BackToTop';
import { SHIPPED } from './Shipped';

const ext = { target: '_blank', rel: 'noopener noreferrer' };
const Out = ({ href, children }) => <a href={href} {...ext}>{children} <span className="fb-arr" aria-hidden="true">↗</span></a>;

// The closing block of every page: the name and a line on the left, a boxed grid of links, and CHIMA set across the
// full width underneath. The wordmark is an SVG so it always spans the box exactly, at any screen width.
export default function Footer({ s, nav, x }) {
  return (
    <div className="fbox">
      <div className="fb-brand">
        <Link href="/" className="fb-logo" aria-label="Chima, home">
          <span className="fb-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4l2 10 10 2-10 2-2 10-2-10-10-2 10-2z" fill="currentColor" /></svg></span>
          CHIMA
        </Link>
        <p className="fb-line">{s.tagline}</p>
        <small className="fb-copy">© 2026 Chima. Art first, code alongside.</small>
      </div>

      <nav className="fb-cols" aria-label="Footer">
        <div className="fb-col">
          <h4>Explore</h4>
          {nav.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
        </div>
        <div className="fb-col">
          <h4>Shipped</h4>
          {SHIPPED.map((p) => <Out key={p.key} href={p.href || p.live}>{p.name.charAt(0) + p.name.slice(1).toLowerCase()}</Out>)}
          <Link href="/development#cinema">XENON player</Link>
        </div>
        <div className="fb-col">
          <h4>Elsewhere</h4>
          <Out href={x}>X</Out>
          <Out href="https://github.com/Chima30">GitHub</Out>
          <span className="fb-txt">Discord: {s.discord}</span>
          <BackToTop />
        </div>
      </nav>

      <div className="fb-word" aria-hidden="true">
        <svg viewBox="0 43 682 151"><text x="0" y="190" textLength="682" lengthAdjust="spacing">CHIMA</text></svg>
      </div>
    </div>
  );
}
