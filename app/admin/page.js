'use client';
import { useEffect, useState } from 'react';
import SiteText from '@/components/SiteText';
import { supabase, imgUrl, CATS } from '@/lib/supabase';
import { isRawTitle } from '@/lib/art';
const OK = ['image/jpeg', 'image/png', 'image/webp'];
export default function Admin() {
  const [session, setSession] = useState(null), [ready, setReady] = useState(false);
  const [items, setItems] = useState([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState('');
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const load = async () => {
    const { data, error } = await supabase.from('artworks').select('*').order('position');
    error ? setMsg(error.message) : setItems(data);
  };
  useEffect(() => { if (session) load(); }, [session]);
  const save = async (id, patch) => {
    const { data, error } = await supabase.from('artworks').update(patch).eq('id', id).select();
    if (error || !data?.length) setMsg(error?.message || 'Not saved: this account is not authorized.');
    else setMsg('Saved.');
    load();
  };
  const login = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const { error } = await supabase.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
    setMsg(error ? error.message : '');
  };
  const upload = async (files) => {
    let pos = items.reduce((m, i) => Math.max(m, i.position), 0), n = 0;
    for (const file of files) {
      setBusy(`Uploading ${++n} of ${files.length}: ${file.name}`);
      if (!OK.includes(file.type)) { setMsg(`${file.name}: use JPG, PNG or WebP.`); continue; }
      if (file.size > 15e6) { setMsg(`${file.name}: file is over 15 MB.`); continue; }
      const path = `${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`;
      const up = await supabase.storage.from('art').upload(path, file, { contentType: file.type });
      if (up.error) { setMsg(`${file.name}: ${up.error.message}`); continue; }
      const ins = await supabase.from('artworks').insert({ image_path: path, title: '', position: ++pos });
      if (ins.error) { await supabase.storage.from('art').remove([path]); setMsg(`${file.name}: ${ins.error.message}`); }
    }
    setBusy(''); load();
  };
  const replace = async (a, file) => {
    if (!file || !OK.includes(file.type)) return setMsg('Use a JPG, PNG or WebP image.');
    const path = `${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`;
    const up = await supabase.storage.from('art').upload(path, file, { contentType: file.type });
    if (up.error) return setMsg(up.error.message);
    await save(a.id, { image_path: path });
    await supabase.storage.from('art').remove([a.image_path]);
  };
  const setHero = async (a) => { await supabase.from('artworks').update({ hero: false }).eq('hero', true); save(a.id, { hero: true }); };
  const move = async (i, d) => {
    const a = items[i], b = items[i + d]; if (!b) return;
    await Promise.all([supabase.from('artworks').update({ position: b.position }).eq('id', a.id), supabase.from('artworks').update({ position: a.position }).eq('id', b.id)]);
    load();
  };
  const del = async (a) => {
    if (!confirm(`Delete "${a.title || 'this artwork'}" and its image? This cannot be undone.`)) return;
    const { error } = await supabase.from('artworks').delete().eq('id', a.id);
    if (error) return setMsg(error.message);
    await supabase.storage.from('art').remove([a.image_path]); load();
  };
  if (!ready) return <p className="page">Loading…</p>;
  if (!session) return (<form className="page login" onSubmit={login}><h1>Admin</h1>
    <label>Email<input name="email" type="email" required autoComplete="username" /></label>
    <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
    <button className="btn">Log in</button><p role="alert">{msg}</p></form>);
  const pub = items.filter((i) => i.published).length;
  return (<section className="page admin"><h1>Admin</h1>
    <p>{items.length} artworks · {pub} published · {items.length - pub} drafts <button onClick={() => supabase.auth.signOut()}>Log out</button></p>
    <SiteText />
    <label className="drop">Upload images (JPG, PNG, WebP)
      <input type="file" multiple accept={OK.join(',')} onChange={(e) => { upload([...e.target.files]); e.target.value = ''; }} /></label>
    {busy && <p>{busy}</p>}<p role="status">{msg}</p>
    {items.map((a, i) => (<div className="row" key={a.id}>
      <img src={imgUrl(a.image_path)} alt="" />
      <div>
        <input defaultValue={a.title} placeholder="Title" onBlur={(e) => e.target.value !== a.title && save(a.id, { title: e.target.value })} />
        <textarea defaultValue={a.description} placeholder="Description" onBlur={(e) => e.target.value !== a.description && save(a.id, { description: e.target.value })} />
        <input defaultValue={a.year || ''} placeholder="Year" size="5" onBlur={(e) => save(a.id, { year: parseInt(e.target.value) || null })} />
        <input defaultValue={a.medium || ''} placeholder="Medium (for example digital painting)" onBlur={(e) => e.target.value !== (a.medium || '') && save(a.id, { medium: e.target.value || null })} />
        <input defaultValue={a.project || ''} placeholder="Project or client" onBlur={(e) => save(a.id, { project: e.target.value || null })} />
        <input defaultValue={a.link || ''} placeholder="Link (optional)" onBlur={(e) => save(a.id, { link: e.target.value || null })} />
        <p>{CATS.map(([k, l]) => <label key={k}><input type="checkbox" checked={!!a.categories?.includes(k)}
          onChange={(e) => save(a.id, { categories: e.target.checked ? [...(a.categories || []), k] : a.categories.filter((c) => c !== k) })} /> {l}</label>)}</p>
        <p><label><input type="checkbox" checked={a.featured} onChange={(e) => save(a.id, { featured: e.target.checked })} /> Featured</label>
          <button onClick={() => setHero(a)} disabled={a.hero}>{a.hero ? 'Homepage hero' : 'Make hero'}</button>
          <button onClick={() => save(a.id, { published: !a.published })}>{a.published ? 'Unpublish' : 'Publish'}</button>
          <button onClick={() => move(i, -1)} aria-label="Move up">Up</button><button onClick={() => move(i, 1)} aria-label="Move down">Down</button>
          <label className="rep">Replace image<input type="file" accept={OK.join(',')} onChange={(e) => replace(a, e.target.files[0])} /></label>
          <button className="danger" onClick={() => del(a)}>Delete</button></p>
        <p className="meta">{a.published ? 'Published' : 'Draft, not public'}{isRawTitle(a.title) ? ' · Needs a title. The public site shows no caption until you add one.' : ''}</p>
      </div></div>))}
  </section>);
}
