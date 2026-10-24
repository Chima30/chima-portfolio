import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing';
const f = (u, o = {}) => {
  const h = new Headers(o.headers);
  if (h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
  return fetch(u, { ...o, headers: h, cache: 'no-store' });
};
export const supabase = createClient(url, key, { global: { fetch: f } });
export const imgUrl = (p) => (p ? `${url}/storage/v1/object/public/art/${p}` : '');
export const CATS = [['featured','Featured Art'],['personal','Personal Artwork'],['client','Client and Community Work'],['nft','NFTs']];
export async function published(table) {
  const { data } = await supabase.from(table).select('*').eq('published', true).order('position');
  return data || [];
}
export const FIELDS = [
  ['role','Line under the name','Digital Artist · Illustrator · Creative'],
  ['intro','Homepage introduction',"I make art because I love what it can make people feel. Sometimes it's a colour, a character, or a small detail that stays with you long after you've seen it. I'm drawn to work that carries a feeling, tells a story, or makes someone stop and look twice."],
  ['about1','About, first paragraph',"I'm Chima, a digital artist with an interest in illustration, visual storytelling, and creative work across Web3. Most of my ideas start with something I want to express. The fun part is finding the right way to bring it to life."],
  ['about2','About, second paragraph','Beyond art, I also explore development and enjoy building things of my own.'],
  ['statement','Big quote on About','Some things are easier to feel than to explain.'],
  ['contact_text','Contact text','Have an idea, need artwork for a project, or want to create something together? Reach out.'],
  ['tagline','Footer line','Digital artist. Always making something.'],
  ['discord','Discord name','therichworth'],
  ['email','Contact email (optional)',''],
];
export async function getSettings() {
  const { data } = await supabase.from('settings').select('*');
  const s = Object.fromEntries(FIELDS.map(([k,,d]) => [k, d]));
  (data || []).forEach((r) => { if (r.value) s[r.key] = r.value; });
  return s;
}
