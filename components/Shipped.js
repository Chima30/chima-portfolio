import Image from 'next/image';

// Live projects shown as small websites in a grid (an entry with wide: true spans the full row): a browser window with the real homepage (captured from the live site,
// files in public/shipped) and a receipt underneath. To refresh a screenshot, capture the page at 1440x900, 2x.
const SHIPPED = [
  {
    key: 'verac',
    wide: true,
    name: 'VERAC',
    when: 'Nov 2026',
    chain: 'QoreChain',
    host: 'verac-web.vercel.app',
    live: 'https://verac-web.vercel.app/start',
    code: 'https://github.com/Chima30/Verac',
    tagline: 'AI does the treasury work. It never holds the keys.',
    asks: 'Can AI agents run a DAO’s payments and grants without being able to move its money?',
    receipt: 'Six agents check invoices and grant applications. People approve with post-quantum keys the server never sees, and the chain enforces the limits.',
    stat: ['13/13', 'attacks on the treasury vault refused, each refusal a transaction you can open'],
    tech: ['Next.js', 'Solidity · Foundry', 'Supabase', 'Gemini', 'Post-quantum keys'],
  },
  {
    key: 'aven',
    name: 'AVEN',
    when: 'Nov 2026',
    chain: 'Walrus · Sui',
    host: 'aven-ashy.vercel.app',
    live: 'https://aven-ashy.vercel.app/',
    code: 'https://github.com/Chima30/Aven',
    tagline: 'Remembers your decisions, not just your data.',
    asks: 'What did I already decide, and why is this suggestion different from the last one?',
    receipt: 'Each suggestion shows its working. With permission, the choices behind it are kept as encrypted memories on Walrus.',
    stat: ['15', 'memories stored and recalled on Walrus Mainnet from the live app'],
    tech: ['Next.js', 'Supabase', 'Walrus Memory', 'Sui'],
  },
  {
    key: 'buffer',
    name: 'BUFFER',
    when: 'Nov 2026',
    chain: 'NEAR',
    host: 'buffer-zeta.vercel.app',
    live: 'https://buffer-zeta.vercel.app/',
    code: 'https://github.com/Chima30/buffer',
    tagline: 'Humans set the rules. Agents run the business.',
    asks: 'Can an AI agent run a business without ever holding the money?',
    receipt: 'A NEAR contract holds the funds and enforces the owner’s limits. Every order can be verified on-chain.',
    stat: ['7/7', 'attacks blocked, run live against the testnet business'],
    tech: ['Next.js', 'Rust · NEAR', 'Supabase', 'viem'],
  },
];

const ext = { target: '_blank', rel: 'noopener noreferrer' };

export default function Shipped() {
  const n = String(SHIPPED.length).padStart(2, '0');
  return (
    <section className="shipped" id="shipped" aria-labelledby="shipped-h">
      <p className="meta">Deployed · open them, they are live</p>
      <h2 id="shipped-h">Shipped, <em>live</em> on the web</h2>
      <p className="cinema-p">Products I designed, built and deployed. Each window shows the real homepage; open it to use the site itself.</p>

      <div className="ship-grid">
      {SHIPPED.map((p, i) => (
        <article className={p.wide ? 'ship wide' : 'ship'} key={p.key} data-reveal aria-labelledby={`ship-${p.key}`}>
          <p className="ship-idx">
            <span>Item {String(i + 1).padStart(2, '0')} / {n}</span>
            <span aria-hidden="true">—</span>
            <span>{p.chain}</span>
          </p>

          <a className="ship-win" href={p.live} {...ext} aria-label={`Open ${p.name} live at ${p.host}`}>
            <span className="ship-bar" aria-hidden="true">
              <span className="ship-dots"><i /><i /><i /></span>
              <span className="ship-url"><b className="ship-live" />{p.host}</span>
              <span className="ship-go">↗</span>
            </span>
            <span className="ship-shot">
              <Image
                src={`/shipped/${p.key}.jpg`}
                alt={`The ${p.name} homepage`}
                width={2880}
                height={1800}
                sizes={p.wide ? '(max-width: 960px) 100vw, 900px' : '(max-width: 800px) 100vw, 450px'}
              />
              <span className="ship-visit" aria-hidden="true">Visit {p.host} ↗</span>
            </span>
          </a>

          <div className="ship-card">
            <div className="ship-top"><span>{p.when}</span><span>{p.chain}</span></div>
            <h3 id={`ship-${p.key}`}>{p.name}</h3>
            <p className="ship-tag">{p.tagline}</p>
            <dl className="ship-rows">
              <div><dt>Asks</dt><dd>{p.asks}</dd></div>
              <div><dt>Receipt</dt><dd>{p.receipt}</dd></div>
            </dl>
            <p className="ship-stat"><b>{p.stat[0]}</b><span>{p.stat[1]}</span></p>
            <ul className="ship-tech" aria-label="Built with">{p.tech.map((t) => <li key={t}>{t}</li>)}</ul>
            <p className="ship-btns">
              <a className="ship-b solid" href={p.live} {...ext}>Live <span aria-hidden="true">↗</span></a>
              <a className="ship-b" href={p.code} {...ext}>Code <span aria-hidden="true">↗</span></a>
            </p>
          </div>
        </article>
      ))}
      </div>
    </section>
  );
}
