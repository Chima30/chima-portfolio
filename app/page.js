import Link from 'next/link';
import Work from '@/components/Work';
import Intro from '@/components/Intro';
import { published, imgUrl, getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const s = await getSettings();
  const all = (await published('artworks')).map((a) => ({ ...a, src: imgUrl(a.image_path) }));
  const has = (c) => all.filter((a) => a.categories?.includes(c));
  const hero = all.find((a) => a.hero) || all.find((a) => a.featured) || all[0];
  const featured = all.filter((a) => a.featured);
  const client = has('client');
  return (<>
    <Intro />
    <section className="hero">
      {hero ? <img className="heroimg" src={hero.src} alt={hero.title || 'Featured artwork'} /> : <div className="heroimg ph">Hero artwork: choose one in /admin</div>}
      <div className="herotext">
        <h1>CHIMA</h1>
        <p className="role">{s.role}</p>
        <p className="intro">{s.intro}</p>
        <p><a className="btn" href="#work">Explore the artwork</a> <Link className="sec" href="/development">Development work</Link></p>
      </div>
    </section>
    <section id="work"><h2>Work</h2><Work items={all} /></section>
  </>);
}
