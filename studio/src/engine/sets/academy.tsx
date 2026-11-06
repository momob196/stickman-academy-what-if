import React from 'react';
import { rnd } from '../anim';

// StickMan Academy by day: a bright sky with drifting clouds, the academy behind (a gated hall, a central tower
// with a glowing emblem, conical side towers, red banners) softened by haze, trees either side, floating holo
// panels and pixels, and a rocky ledge in front where the cast stands. Feet go at ACADEMY_FLOOR. Light the
// characters with rimId="rimSun". `holo` (0..1) fades the tech in, `dusk` (0..1) warms the day toward evening.

export const ACADEMY_FLOOR = 868;

const Cloud: React.FC<{ x: number; y: number; s: number; o?: number }> = ({ x, y, s, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <ellipse cx={0} cy={30} rx={150} ry={34} fill="#DCEEFF" />
    {[
      [-90, 10, 52],
      [-30, -16, 70],
      [46, -6, 60],
      [110, 16, 44],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#FFFFFF" />
    ))}
    <ellipse cx={0} cy={40} rx={140} ry={18} fill="#C6DDF5" />
  </g>
);

/** A floating holo panel: a cyan screen with a grid and a few lines of "code", pixels breaking off one edge. */
const HoloPanel: React.FC<{ x: number; y: number; w: number; h: number; t: number; seed: number; tilt: number; o: number }> = ({ x, y, w, h, t, seed, tilt, o }) => (
  <g transform={`translate(${x} ${y + Math.sin(t / 20 + seed) * 8}) rotate(${tilt})`} opacity={o}>
    <rect x={-w / 2 - 14} y={-h / 2 - 14} width={w + 28} height={h + 28} rx={14} fill="#3FD4FF" opacity={0.18} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="#7FE6FF" fillOpacity={0.35} stroke="#3FC8F0" strokeWidth={4} />
    {Array.from({ length: 5 }).map((_, i) => (
      <rect key={i} x={-w / 2 + 16} y={-h / 2 + 16 + i * ((h - 30) / 5)} width={(w - 32) * (0.4 + rnd(seed, i) * 0.6)} height={6} rx={3} fill="#1E7FB0" opacity={0.8} />
    ))}
    {Array.from({ length: 9 }).map((_, i) => {
      const k = (t / 40 + rnd(seed + 2, i)) % 1;
      return <rect key={`p${i}`} x={w / 2 + 10 + k * 120 + rnd(seed + 3, i) * 30} y={-h / 2 + rnd(seed + 4, i) * h} width={10 + rnd(seed + 5, i) * 10} height={10 + rnd(seed + 5, i) * 10} fill={i % 3 ? '#3FC8F0' : '#2A68D8'} opacity={0.9 * (1 - k)} />;
    })}
  </g>
);

/** A conical tower: a stone shaft with arched windows and a slate cone roof, a red banner hanging below the roof. */
const Tower: React.FC<{ x: number; w: number; top: number; base: number; roof: number; t: number }> = ({ x, w, top, base, roof, t }) => (
  <g>
    <rect x={x - w / 2} y={top} width={w} height={base - top} fill="#9AACC4" />
    <rect x={x + w * 0.18} y={top} width={w * 0.32} height={base - top} fill="#7E92AE" opacity={0.6} />
    <path d={`M ${x - w / 2 - 18} ${top + 4} L ${x} ${top - roof} L ${x + w / 2 + 18} ${top + 4} Z`} fill="#4F6E9E" />
    <path d={`M ${x} ${top - roof} L ${x + w / 2 + 18} ${top + 4} L ${x + 8} ${top + 4} Z`} fill="#3E5A86" />
    {[0, 1, 2].map((r) => (
      <path key={r} d={`M ${x - 14} ${top + 70 + r * 120} L ${x - 14} ${top + 40 + r * 120} Q ${x} ${top + 22 + r * 120} ${x + 14} ${top + 40 + r * 120} L ${x + 14} ${top + 70 + r * 120} Z`} fill="#3A4E6E" />
    ))}
    <path d={`M ${x - 22} ${top + 14} L ${x + 22} ${top + 14} L ${x + 22 + Math.sin(t / 16) * 3} ${top + 130} L ${x} ${top + 112} L ${x - 22 + Math.sin(t / 16) * 3} ${top + 130} Z`} fill="#D8343A" />
  </g>
);

export const Academy: React.FC<{ t: number; id?: string; holo?: number; dusk?: number }> = ({ t, id = 'ac', holo = 1, dusk = 0 }) => (
  <g>
    <defs>
      <linearGradient id={`${id}Sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4AA6EC" />
        <stop offset="60%" stopColor="#9CD4FA" />
        <stop offset="100%" stopColor="#DFF2FF" />
      </linearGradient>
      <radialGradient id={`${id}Sun`}>
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
        <stop offset="25%" stopColor="#FFF6D8" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#FFF6D8" stopOpacity={0} />
      </radialGradient>
      <linearGradient id={`${id}Rock`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7A7570" />
        <stop offset="100%" stopColor="#45413E" />
      </linearGradient>
      <linearGradient id={`${id}Haze`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#EAF6FF" stopOpacity={0} />
        <stop offset="100%" stopColor="#EAF6FF" stopOpacity={0.7} />
      </linearGradient>
    </defs>
    <rect x={-400} y={-400} width={2720} height={1300} fill={`url(#${id}Sky)`} />
    <circle cx={260} cy={110} r={420} fill={`url(#${id}Sun)`} />
    {/* clouds in two depths, drifting */}
    {[
      [140, 230, 1.1, 0.12],
      [700, 120, 0.8, 0.08],
      [1250, 210, 0.9, 0.1],
      [1780, 110, 1.2, 0.14],
      [-60, 470, 1.3, 0.05],
      [1960, 420, 1.1, 0.06],
    ].map(([x, y, s, v], i) => (
      <Cloud key={i} x={((x + t * v + 400) % 2700) - 400} y={y} s={s} o={0.95} />
    ))}
    {/* the academy: far wings, the hall with its gate, the central tower and emblem, two conical towers */}
    <g>
      <rect x={60} y={420} width={360} height={360} fill="#A8B9CE" />
      <rect x={1500} y={420} width={360} height={360} fill="#A8B9CE" />
      <path d="M 40 424 L 240 340 L 440 424 Z M 1480 424 L 1680 340 L 1880 424 Z" fill="#5E7CA8" />
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={`fw${i}`}>
          <rect x={100 + (i % 3) * 110} y={470 + Math.floor(i / 3) * 120} width={40} height={64} rx={20} fill="#4A5E7E" />
          <rect x={1540 + (i % 3) * 110} y={470 + Math.floor(i / 3) * 120} width={40} height={64} rx={20} fill="#4A5E7E" />
        </g>
      ))}
      <rect x={540} y={300} width={840} height={480} fill="#B4C3D6" />
      <rect x={960} y={300} width={420} height={480} fill="#9EAFC6" opacity={0.6} />
      <path d="M 510 306 L 960 200 L 1410 306 Z" fill="#5A78A6" />
      {Array.from({ length: 8 }).map((_, i) => {
        const wx = 590 + i * 100 + (i >= 4 ? 140 : 0) - (i >= 4 ? 100 : 0);
        return i === 3 || i === 4 ? null : (
          <g key={`hw${i}`}>
            {[0, 1].map((r) => (
              <g key={r}>
                <path d={`M ${wx} ${440 + r * 150} L ${wx} ${390 + r * 150} Q ${wx + 24} ${362 + r * 150} ${wx + 48} ${390 + r * 150} L ${wx + 48} ${440 + r * 150} Z`} fill="#3F5476" />
                <path d={`M ${wx + 6} ${436 + r * 150} L ${wx + 6} ${394 + r * 150} Q ${wx + 24} ${372 + r * 150} ${wx + 42} ${394 + r * 150} L ${wx + 42} ${436 + r * 150} Z`} fill={(i + r) % 3 ? '#6FC8F0' : '#FFE2A0'} opacity={0.45} />
              </g>
            ))}
          </g>
        );
      })}
      {/* the gate: a tall arch with a glowing threshold */}
      <path d="M 850 780 L 850 500 Q 960 390 1070 500 L 1070 780 Z" fill="#8496B0" />
      <path d="M 874 780 L 874 510 Q 960 422 1046 510 L 1046 780 Z" fill="#2E3E5E" />
      <path d="M 874 780 L 874 640 Q 960 600 1046 640 L 1046 780 Z" fill="#3FD4FF" opacity={0.25 * holo} />
      {/* central tower and emblem */}
      <rect x={880} y={110} width={160} height={200} fill="#A6B6CC" />
      <path d="M 862 114 L 960 10 L 1058 114 Z" fill="#4F6E9E" />
      <circle cx={960} cy={200} r={48} fill="#2A3C60" stroke="#E8B230" strokeWidth={6} />
      <circle cx={960} cy={200} r={34} fill="#3FD4FF" opacity={0.35 + 0.25 * holo + 0.08 * Math.sin(t / 10)} />
      {/* the emblem: a stick figure, arms up */}
      <g stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" fill="none">
        <circle cx={960} cy={182} r={8} fill="#FFFFFF" />
        <path d="M 960 192 L 960 214 M 960 214 L 950 230 M 960 214 L 970 230 M 960 198 L 944 186 M 960 198 L 976 186" />
      </g>
      <Tower x={460} w={150} top={250} base={780} roof={150} t={t} />
      <Tower x={1460} w={150} top={250} base={780} roof={150} t={t + 20} />
      {/* haze pushes the building back */}
      <rect x={-400} y={100} width={2720} height={700} fill={`url(#${id}Haze)`} />
      <rect x={-400} y={-400} width={2720} height={1200} fill="#DFF0FF" opacity={0.18} />
    </g>
    {/* trees either side and a hedge along the courtyard */}
    {[
      [-60, 640, 190],
      [160, 700, 140],
      [1780, 650, 180],
      [1980, 600, 210],
    ].map(([x, y, r], i) => (
      <g key={`tr${i}`}>
        <rect x={x - 14} y={y} width={28} height={220} fill="#5A4030" />
        <circle cx={x} cy={y - r * 0.2} r={r} fill="#3E8A46" />
        <circle cx={x - r * 0.4} cy={y - r * 0.5} r={r * 0.6} fill="#5AAE52" />
        <circle cx={x + r * 0.35} cy={y - r * 0.1} r={r * 0.55} fill="#2F7038" />
      </g>
    ))}
    <rect x={-400} y={770} width={2720} height={60} fill="#C9D3DC" />
    {Array.from({ length: 22 }).map((_, i) => (
      <ellipse key={`hg${i}`} cx={-300 + i * 120} cy={772} rx={70} ry={32} fill={i % 2 ? '#4E9A4C' : '#3E8642'} />
    ))}
    {/* holo panels and pixels in the air */}
    {holo > 0 ? (
      <g>
        <HoloPanel x={360} y={170} w={180} h={110} t={t} seed={3} tilt={-12} o={holo} />
        <HoloPanel x={1530} y={190} w={150} h={90} t={t} seed={7} tilt={10} o={holo * 0.9} />
      </g>
    ) : null}
    {/* the rocky ledge where the cast stands */}
    <path d={`M -400 ${ACADEMY_FLOOR - 14} L 120 ${ACADEMY_FLOOR - 26} L 520 ${ACADEMY_FLOOR - 12} L 900 ${ACADEMY_FLOOR - 22} L 1320 ${ACADEMY_FLOOR - 10} L 1720 ${ACADEMY_FLOOR - 24} L 2320 ${ACADEMY_FLOOR - 12} L 2320 1500 L -400 1500 Z`} fill={`url(#${id}Rock)`} />
    <path d={`M -400 ${ACADEMY_FLOOR - 14} L 120 ${ACADEMY_FLOOR - 26} L 520 ${ACADEMY_FLOOR - 12} L 900 ${ACADEMY_FLOOR - 22} L 1320 ${ACADEMY_FLOOR - 10} L 1720 ${ACADEMY_FLOOR - 24} L 2320 ${ACADEMY_FLOOR - 12}`} stroke="#A8A29A" strokeWidth={8} fill="none" />
    <path d="M 300 880 L 340 940 L 320 1000 M 780 890 L 760 960 L 800 1040 M 1240 880 L 1280 950 M 1600 884 L 1570 960 L 1610 1010" stroke="#2E2B28" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
    {[
      [-40, 900],
      [110, 1040],
      [1820, 920],
      [1960, 1040],
    ].map(([x, y], i) => (
      <path key={`gt${i}`} d={`M ${x} ${y} q 10 -60 26 -80 q -4 50 6 80 q 14 -50 40 -64 q -16 40 -10 64 Z`} fill={i % 2 ? '#3E8642' : '#5AAE52'} />
    ))}
    {dusk > 0 ? <rect x={-400} y={-400} width={2720} height={1900} fill="#FF8A3D" opacity={0.22 * dusk} style={{ mixBlendMode: 'multiply' }} /> : null}
  </g>
);
