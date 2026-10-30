import { published, imgUrl } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Development' };
export default async function Dev() {
  const projects = await published('projects');
  const links = (p) => [[p.github_url, 'GitHub'], [p.demo_url, 'Live demo'], [p.docs_url, 'Docs']].filter(([u]) => u);
  return (<section className="page dev"><h1>Development</h1>
    <p className="lead">Alongside the art, I build things of my own, including Web3 projects. This is where that work lives.</p>
    {!projects.length && <p className="empty">No projects published yet.</p>}
    {projects.map((p) => (<article className="proj" key={p.id}>
      <header><h2>{p.name}</h2>{p.status && <p className="status">{p.status}</p>}
        {p.tech?.length > 0 && <p className="tech">{p.tech.join(', ')}</p>}
        {links(p).length > 0 && <p className="links">{links(p).map(([u, t]) => <a key={t} href={u} target="_blank" rel="noopener noreferrer">{t}</a>)}</p>}</header>
      <div className="pbody">
        {p.cover_path && <img src={imgUrl(p.cover_path)} alt={`${p.name} screenshot`} loading="lazy" />}
        {p.description && <p>{p.description}</p>}
        {(p.problem || p.solution) && <dl>{p.problem && <><dt>Problem</dt><dd>{p.problem}</dd></>}{p.solution && <><dt>Solution</dt><dd>{p.solution}</dd></>}</dl>}
      </div>
    </article>))}</section>);
}
