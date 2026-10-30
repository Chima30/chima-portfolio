import Work from '@/components/Work';
import { published, imgUrl, getSettings } from '@/lib/supabase';
import { titleOf, altOf, detailsOf } from '@/lib/art';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const s = await getSettings();
  const all = (await published('artworks')).map((a) => ({ ...a, src: imgUrl(a.image_path) }));
  const hero = all.find((a) => a.hero) || all.find((a) => a.featured) || all[0];
  return (<>
    <section className="hero">
      <div className="hero-text">
        <p className="role">{s.role}</p>
        <h1>I tell stories in colour.</h1>
        <p className="intro">{s.intro}</p>
        <p><a className="plain" href="#work">See the work</a></p>
      </div>
      <figure className="hero-art">
        {hero ? <img src={hero.src} alt={altOf(hero)} fetchPriority="high" /> : <p className="empty">Choose a hero piece in /admin</p>}
        {hero && (titleOf(hero) || detailsOf(hero)) && <figcaption>{[titleOf(hero), detailsOf(hero)].filter(Boolean).join(', ')}</figcaption>}
      </figure>
    </section>
    <section id="work" className="work" aria-label="Artwork">
      {all.length ? <Work items={all} /> : <p className="empty">No artwork published yet.</p>}
    </section>
  </>);
}
