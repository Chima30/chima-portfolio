export default function Headline({ text }) {
  let i = 0;
  const words = (t) => t.trim().split(/\s+/).flatMap((w) => { const n = i++; return [<span key={'w' + n} className="w" style={{ '--i': n }}>{w}</span>, ' ']; });
  const parts = String(text).split(/(\*[^*]+\*)/).filter(Boolean);
  return <>{parts.map((p, k) => p.startsWith('*') ? <em key={k}>{words(p.slice(1, -1))}</em> : <span key={k}>{words(p)}</span>)}</>;
}
