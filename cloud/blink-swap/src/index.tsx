import React from 'react';
import { defineEpisode, Timeline, LookDef, HudChip } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19 } from './shots';

// The power's look: on every رَمشة the picture warms a touch and a SWAP chip blinks; the cyan rings and the
// one-frame double images are drawn inside the shots themselves.
const swapLook: LookDef = {
  grade: (lv) => `saturate(${1 + 0.05 * lv}) hue-rotate(${-10 * lv}deg) brightness(${1 + 0.04 * lv})`,
  Overlay: ({ f }) => <HudChip f={f} label="SWAP" icon="dot" />,
};

export const blinkSwap = defineEpisode('BlinkSwap', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19 },
  looks: { swap: swapLook },
});
