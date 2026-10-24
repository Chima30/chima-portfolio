'use client';
import { useEffect, useState } from 'react';
import { supabase, FIELDS } from '@/lib/supabase';
export default function SiteText() {
  const [vals, setVals] = useState({}), [msg, setMsg] = useState('');
  useEffect(() => { supabase.from('settings').select('*').then(({ data }) => setVals(Object.fromEntries((data || []).map((r) => [r.key, r.value])))); }, []);
  const save = async (key, value) => {
    const { data, error } = await supabase.from('settings').upsert({ key, value }).select();
    setMsg(error || !data?.length ? (error?.message || 'Not saved: not authorized.') : 'Saved. Refresh the site to see it.');
  };
  return (<details className="drop"><summary>Edit website text</summary>
    <p className="meta">Leave a box empty to use the original wording.</p>
    {FIELDS.map(([k, label, def]) => (<label key={k}>{label}
      <textarea key={k + (vals[k] ?? '')} defaultValue={vals[k] || ''} placeholder={def} onBlur={(e) => e.target.value !== (vals[k] || '') && save(k, e.target.value)} /></label>))}
    <p role="status">{msg}</p></details>);
}
