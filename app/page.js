import Link from 'next/link';
import Headline from '@/components/Headline';
import Featured from '@/components/Featured';
import Marquee from '@/components/Marquee';
import Folders from '@/components/Folders';
import Intro from '@/components/Intro';
import { published, imgUrl, getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const s = await getSettings();
  const all = (await published('artworks')).map((a) => ({ ...a, title: /^\d+$/.test(a.title || '') ? '' : a.title, src: imgUrl(a.image_path) }));
  const feat = all.filter((a) => a.featured);
  let spot = feat.length >= 3 ? feat : all.slice(0, 8);
  const hero = all.find((a) => a.hero);
  if (hero) spot = [hero, ...spot.filter((a) => a.id !== hero.id)];
  return (<>
    <Intro />
    <section className="hero">
      <span className="badge" style={{ '--d': '0s' }}>{s.role}</span>
      <h1><Headline text={s.headline} /></h1>
      <p className="sub" style={{ '--d': '.75s' }}>{s.intro}</p>
      <p className="heroact" style={{ '--d': '.95s' }}><a className="btn" href="#work">Explore the artwork</a><Link className="sec" href="/development">Development work</Link></p>
    </section>
    {all.length === 0 && <p className="empty" style={{ textAlign: 'center' }}>No artwork published yet. Add some in /admin.</p>}
    {spot.length > 0 && <Featured items={spot} />}
    <div className="mqwrap"><Marquee items={all} /></div>
    <section id="work"><h2 className="h2" data-reveal>Browse <em>folders</em></h2><Folders items={all} /></section>
  </>);
}
