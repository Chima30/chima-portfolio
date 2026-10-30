import { published, imgUrl } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Development' };
export default async function Dev() {
  const projects = await published('projects');
  const L = ([u, t]) => u && <a key={t} href={u} target="_blank" rel="noopener noreferrer">{t}</a>;
  return (<section className="page"><h1>Development</h1>
    <p className="lead">Alongside the art, I build things of my own, including Web3 projects. This is where that work lives.</p>
    {!projects.length && <p className="empty">No projects published yet.</p>}
    {projects.map((p) => (<article className="proj" key={p.id}>
      {p.cover_path && <img src={imgUrl(p.cover_path)} alt={p.name} loading="lazy" />}
      <div><h3>{p.name}</h3>{p.status && <p className="meta">{p.status}</p>}
        <p>{p.description}</p>
        {p.problem && <p><b>Problem.</b> {p.problem}</p>}{p.solution && <p><b>Solution.</b> {p.solution}</p>}
        {p.tech?.length > 0 && <p className="meta">{p.tech.join(', ')}</p>}
        <p className="links">{[[p.github_url,'GitHub'],[p.demo_url,'Live demo'],[p.docs_url,'Docs']].map(L)}</p></div>
    </article>))}</section>);
}
