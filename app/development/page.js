import { published, imgUrl } from '@/lib/supabase';
import CinemaShowcase from '@/components/CinemaShowcase';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Development' };
export default async function Dev() {
  const projects = await published('projects');
  const L = ([u, t]) => u && <a key={t} href={u} target="_blank" rel="noopener noreferrer">{t}</a>;
  return (<section className="page"><h1>Development</h1>
    <p className="lead">Alongside the art, I build things of my own, including Web3 projects. This is where that work lives.</p>
    <div className="cinema" id="cinema" role="region" aria-labelledby="cinema-h">
      <p className="meta">Video player skin · Video.js v10</p>
      <h2 id="cinema-h">Cinema, powered by <em>XENON</em></h2>
      <p className="cinema-p">I built XENON because I wanted video players to do more than play and pause. It lets you explore scenes, find your way back and save the moments you want to revisit. This is the player itself, running here on my portfolio.</p>
      <CinemaShowcase />
      <p className="meta cinema-credit"><i>Sintel</i> (2010) by the Blender Foundation, <a href="https://durian.blender.org/" target="_blank" rel="noopener noreferrer">durian.blender.org</a>, licensed <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>. Streamed from Mux.</p>
      <p className="links"><a href="https://xenon-ruddy.vercel.app/" target="_blank" rel="noopener noreferrer">Full XENON demo</a><a href="https://github.com/Chima30/Xenon" target="_blank" rel="noopener noreferrer">Source on GitHub</a></p>
    </div>
    {projects.map((p) => (<article className="proj" key={p.id}>
      {p.cover_path && <img src={imgUrl(p.cover_path)} alt={p.name} loading="lazy" />}
      <div><h3>{p.name}</h3>{p.status && <p className="meta">{p.status}</p>}
        <p>{p.description}</p>
        {p.problem && <p><b>Problem.</b> {p.problem}</p>}{p.solution && <p><b>Solution.</b> {p.solution}</p>}
        {p.tech?.length > 0 && <p className="meta">{p.tech.join(', ')}</p>}
        <p className="links">{[[p.github_url,'GitHub'],[p.demo_url,'Live demo'],[p.docs_url,'Docs']].map(L)}</p></div>
    </article>))}</section>);
}
