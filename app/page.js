import Link from 'next/link';
import Gallery from '@/components/Gallery';
import { published, imgUrl, getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
const WORKS = [['Drosera — Art & Design','Artwork created around the Drosera ecosystem.'],
  ['BCM_DAO — Locked In Poster','Poster artwork for Locked In on the Avalanche ecosystem.'],
  ['Drosera — Community Art','Additional artwork created around the Drosera community.']];
export default async function Home() {
  const s = await getSettings();
  const all = (await published('artworks')).map((a) => ({ ...a, src: imgUrl(a.image_path) }));
  const has = (c) => all.filter((a) => a.categories?.includes(c));
  const hero = all.find((a) => a.hero) || all.find((a) => a.featured) || all[0];
  const featured = all.filter((a) => a.featured);
  const client = has('client');
  return (<>
    <section className="hero">
      {hero ? <img className="heroimg" src={hero.src} alt={hero.title || 'Featured artwork'} /> : <div className="heroimg ph">Hero artwork: choose one in /admin</div>}
      <div className="herotext">
        <h1>CHIMA</h1>
        <p className="role">{s.role}</p>
        <p className="intro">{s.intro}</p>
        <p><a className="btn" href="#work">Explore the artwork</a> <Link className="sec" href="/development">Development work</Link></p>
      </div>
    </section>
    <section id="work"><h2>Selected artwork</h2><Gallery items={all.filter((a) => !a.categories?.includes('nft'))} /></section>
    {featured.length > 0 && <section><h2>Featured work</h2><Gallery items={featured} /></section>}
    <section><h2>Personal artwork</h2><Gallery items={has('personal')} /></section>
        {client.length > 0 && <section><h2>Project and community work</h2><Gallery items={client} /></section>}>
  </>);
}
