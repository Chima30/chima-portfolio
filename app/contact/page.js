export const metadata = { title: 'Contact' };
export default function Contact() {
  const mail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (<section className="page"><h1>Let's Work Together</h1>
    <p className="lead">Have an idea, need artwork for a project, or want to create something together? Reach out.</p>
    <ul className="works"><li><b>X / Twitter</b><a href="https://x.com/therichworth" target="_blank" rel="noopener noreferrer">x.com/therichworth</a></li>
      <li><b>Discord</b><span>therichworth</span></li>
      {mail && <li><b>Email</b><a href={`mailto:${mail}`}>{mail}</a></li>}</ul></section>);
}
