'use client';
// The real XENON skin (built from github.com/Chima30/Xenon into vendor/xenon by scripts/sync-xenon.mjs) on the
// official Video.js v10 player. VideoPlayer and MuxVideo come from Video.js itself; CinemaSkin is XENON.
import { VideoPlayer } from '@videojs/react/video';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { CinemaSkin } from '@/vendor/xenon/xenon-skin.js';
import '@/vendor/xenon/xenon-skin.css';

// Sintel (Blender Foundation, 2010, CC BY 3.0), streamed from Mux. A Mux playback ID is public by design.
const SINTEL = 'i00qrt8lv2AP6foBoELFfX9yZwqxoezjmWNhJM00kJS5o';

// The portfolio's own colours, so the player belongs to the page: charcoal surfaces, sage accent, warm white text.
const PORTFOLIO = { accent: '#a3c19a', base: '#101312', ink: '#ededeb', glow: '#a3c19a', secondary: '#8d918c' };

// Real stills from the same stream, for the timeline preview and the Time Lens.
const still = (seconds, width) => `https://image.mux.com/${SINTEL}/thumbnail.webp?time=${Math.max(0, Math.round(seconds))}&width=${Math.min(640, Math.round(width))}`;

export default function XenonPlayer() {
  return (
    <VideoPlayer>
      <CinemaSkin title="Sintel" subtitle="Blender Foundation · 2010" palette={PORTFOLIO} thumbnailAt={still}>
        <MuxVideo source={{ playbackId: SINTEL }} playsInline preload="metadata" crossOrigin="anonymous" poster={still(222, 1280)} />
      </CinemaSkin>
    </VideoPlayer>
  );
}
