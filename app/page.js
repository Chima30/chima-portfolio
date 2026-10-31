import Link from 'next/link';
import Work from '@/components/Work';
import Intro from '@/components/Intro';
import { published, imgUrl, getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const s = await getSettings();
  const all = (await published('artworks')).map((a) => ({ ...a, title: /^\d+$/.test(a.title || '') ? '' : a.title, src: imgUrl(a.image_path) }));
  const hero = all.find((a) => a.hero) || all.find((a) => a.featured) || all[0];
  return (<>
    <Intro />
    <section className="bento">
      <div className="card intro-card">
        <p className="role">{s.role}</p>
        <h1>CHIMA</h1>
        <p className="intro">{s.intro}</p>
        <p><a className="btn" href="#work">Explore the artwork</a> <Link className="sec" href="/development">Development work</Link></p>
      </div>
      <div className="card art-card">
        {hero ? <img src={hero.src} alt={hero.title || 'Featured artwork'} /> : <p className="empty">Choose a hero piece in /admin</p>}
        {hero?.title && <span className="cap">{hero.title}</span>}
      </div>
    </section>
    <section id="work"><h2>The work</h2><Work items={all} /></section>
  </>);
}
