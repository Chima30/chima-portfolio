// Artwork is stored at full resolution (some pieces are 4608 x 6144). Each place on the site gets a copy sized for
// how large it is shown, through Next.js image optimisation (resized and cached by Vercel, served as WebP), instead
// of every thumbnail decoding the original. Widths must be ones Next.js allows: 64-384 and 640-3840.
export function art(src, width, quality = 75) {
  if (!src || !/^https?:\/\//.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
/** A srcset of several widths, so the browser picks the one that suits the screen. */
export const artSet = (src, widths, quality) => (src && /^https?:\/\//.test(src) ? widths.map((w) => `${art(src, w, quality)} ${w}w`).join(', ') : undefined);
