'use client';
export default function BackToTop() {
  return <button className="btt" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button>;
}
