import { getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact' };
export default async function Contact() {
  const s = await getSettings();
  const mail = s.email || process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (<section className="page"><h1>Let's Work Together</h1>
    <p className="lead">{s.contact_text}</p>
    <ul className="works"><li><b>X / Twitter</b><a href="https://x.com/therichworth" target="_blank" rel="noopener noreferrer">x.com/therichworth</a></li>
      <li><b>Discord</b><span>{s.discord}</span></li>
      {mail && <li><b>Email</b><a href={`mailto:${mail}`}>{mail}</a></li>}</ul></section>);
}
