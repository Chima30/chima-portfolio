// Helpers for how artwork metadata is shown. Nothing here writes to the database.
// Titles that are just camera or phone filenames (for example 1000196593) are treated as "no title yet".
const RAW = /^(?:\d{6,}|(?:img|dsc|dscn|image|photo|pxl|screenshot)[-_ ]?\d[\w -]*)$/i;
export const isRawTitle = (t) => !t || !t.trim() || RAW.test(t.trim());
export const titleOf = (a) => (isRawTitle(a?.title) ? '' : a.title.trim());
export const altOf = (a) => titleOf(a) || 'Untitled artwork by Chima';
export const detailsOf = (a) => [a?.year, a?.medium, a?.project].filter(Boolean).join(', ');
