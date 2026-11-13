'use client';
import dynamic from 'next/dynamic';

// The player only exists in the browser (it needs the media element and the window), so it loads there, while this
// placeholder keeps its space so the page does not jump.
const XenonPlayer = dynamic(() => import('./XenonPlayer'), {
  ssr: false,
  loading: () => (
    <div className="cinema-hold" role="status">
      Loading the player…
    </div>
  ),
});

export default function CinemaShowcase() {
  return (
    <div className="cinema-player">
      <XenonPlayer />
    </div>
  );
}
