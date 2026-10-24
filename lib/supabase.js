import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
export const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing');
export const imgUrl = (p) => (p ? `${url}/storage/v1/object/public/art/${p}` : '');
export const CATS = [['featured','Featured Art'],['personal','Personal Artwork'],['client','Client and Community Work'],['nft','NFTs']];
export async function published(table) {
  const { data } = await supabase.from(table).select('*').eq('published', true).order('position');
  return data || [];
}
