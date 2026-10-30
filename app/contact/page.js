import { getSettings } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact' };
export default async function Contact() {
  const s = await getSettings();
  const mail = s.email || process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (<section className="page"><h1>Let's work together</h1>
    <p className="lead">{s.contact_text}</p>
    <dl className="reach"><div><dt>X</dt><dd><a href="https://x.com/therichworth" target="_blank" rel="noopener noreferrer">x.com/therichworth</a></dd></div>
      <div><dt>Discord</dt><dd>{s.discord}</dd></div>
      {mail && <div><dt>Email</dt><dd><a href={`mailto:${mail}`}>{mail}</a></dd></div>}</dl></section>);
}
