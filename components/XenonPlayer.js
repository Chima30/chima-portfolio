'use client';
// The real XENON skin (built from github.com/Chima30/Xenon into vendor/xenon by scripts/sync-xenon.mjs) on the
// official Video.js v10 player. VideoPlayer and MuxVideo come from Video.js itself; CinemaSkin is XENON.
import { useMemo, useState } from 'react';
import { useMedia } from '@videojs/react';
import { VideoPlayer, usePlayer } from '@videojs/react/video';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { CinemaSkin } from '@/vendor/xenon/xenon-skin.js';
import '@/vendor/xenon/xenon-skin.css';

// Sintel (Blender Foundation, 2010, CC BY 3.0), streamed from Mux. A Mux playback ID is public by design.
const SINTEL = 'i00qrt8lv2AP6foBoELFfX9yZwqxoezjmWNhJM00kJS5o';

// The portfolio's own colours, so the player belongs to the page: charcoal surfaces, sage accent, warm white text.
const PORTFOLIO = { accent: '#a3c19a', base: '#101312', ink: '#ededeb', glow: '#a3c19a', secondary: '#8d918c' };

// Real stills from the same stream, for the timeline preview, the Scenes wheel and the Time Lens.
const still = (seconds, width) => `https://image.mux.com/${SINTEL}/thumbnail.webp?time=${Math.max(0, Math.round(seconds))}&width=${Math.min(640, Math.round(width))}`;

// Ten equal sections, the same way the XENON demo divides a film that has no authored chapters.
function sectionsOf(duration) {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const step = duration / 10;
  return Array.from({ length: 10 }, (_, i) => ({
    start: Math.floor(i * step),
    end: i === 9 ? duration : Math.floor((i + 1) * step),
    title: `Section ${i + 1}`,
    authored: false,
  }));
}

// Lives inside VideoPlayer so it can read the player's state and seek.
function Cinema() {
  const store = usePlayer();
  const media = useMedia();
  const duration = usePlayer((s) => s.duration);
  const scenes = useMemo(() => sectionsOf(duration), [duration]);
  // The Time Tether: a jump remembers where you were, so one press brings you back.
  const [anchor, setAnchor] = useState(null);

  const jumpTo = (time) => {
    const from = media?.currentTime ?? 0;
    setAnchor((a) => a ?? { time: from });
    void store.seek(time);
  };
  const returnToAnchor = () => {
    if (!anchor) return;
    void store.seek(anchor.time);
    setAnchor(null);
  };

  return (
    <CinemaSkin
      title="Sintel"
      subtitle="Blender Foundation · 2010"
      palette={PORTFOLIO}
      thumbnailAt={still}
      scenes={scenes}
      onJump={jumpTo}
      returnAnchor={anchor ? { time: anchor.time, onReturn: returnToAnchor } : null}
      markers={anchor ? [{ time: anchor.time, kind: 'anchor', label: 'Where you were' }] : []}
    >
      <MuxVideo source={{ playbackId: SINTEL }} playsInline preload="metadata" crossOrigin="anonymous" poster={still(222, 1280)} />
    </CinemaSkin>
  );
}

export default function XenonPlayer() {
  return (
    <VideoPlayer>
      <Cinema />
    </VideoPlayer>
  );
}
