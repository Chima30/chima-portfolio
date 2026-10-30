import { getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'About' };
export default async function About() {
  const s = await getSettings();
  return (<section className="page"><h1>A little about me</h1>
    <p className="lead">{s.about1}</p><p className="lead">{s.about2}</p>
    <p className="break">{s.statement}</p>
    <div className="bg"><div><h2>Education</h2><p>B.Ed. Social Studies, Ahmadu Bello University.<br />Background in Creative and Cultural Arts.</p></div>
      <div><h2>Creative experience</h2><p>Art Illustrator, BCM_DAO.<br />Visionary Artist, Drosera.<br />Junior Creative, Fine Arts Department, 2023.</p></div></div>
  </section>);
}
