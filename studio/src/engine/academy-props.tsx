import React from 'react';
import { rnd } from './anim';

// The StickMan Academy companions: each character's one fixed prop, so a viewer knows them in a split second.
// They float on their own clock `t`; place them by the character's head (Dr. Zed) or shoulder (ProMax).

/** Dr. Zed's holo screen of equations, hovering over his head. `glitch` (0..1) breaks it up, for when it all goes wrong. */
export const ZedHolo: React.FC<{ x: number; y: number; t: number; s?: number; glitch?: number }> = ({ x, y, t, s = 1, glitch = 0 }) => {
  const lines = ['E = mc²', 'F = m·a', '∫ v dt', 'Δx / Δt'];
  const jit = glitch > 0 ? (rnd(9, Math.floor(t / 2)) - 0.5) * 24 * glitch : 0;
  return (
    <g transform={`translate(${x + jit} ${y + Math.sin(t / 14) * 6}) scale(${s}) rotate(-6)`}>
      <rect x={-118} y={-74} width={236} height={148} rx={16} fill="#3FD4FF" opacity={0.16} />
      <rect x={-104} y={-60} width={208} height={120} rx={10} fill="#8FE8FF" fillOpacity={0.28} stroke="#3FC8F0" strokeWidth={4} />
      {lines.map((l, i) => (
        <text key={l} x={-88} y={-30 + i * 27} fontFamily="Fragment Mono" fontSize={21} fill="#0E5A86" opacity={((t / 6 + i) % 8) < 7 ? 0.95 : 0.4}>
          {l}
        </text>
      ))}
      <path d={`M 40 -10 Q 60 ${-40 + Math.sin(t / 8) * 10} 90 -20`} stroke="#E0558F" strokeWidth={3} fill="none" />
      <path d="M -6 60 L 0 84 L 6 60" fill="#3FC8F0" opacity={0.6} />
    </g>
  );
};

/** ProMax's drone: a gold-trimmed quad with spinning rotors and a scanning eye. `fail` (0..1) sputters and drops it. */
export const Drone: React.FC<{ x: number; y: number; t: number; s?: number; fail?: number }> = ({ x, y, t, s = 1, fail = 0 }) => {
  const bob = Math.sin(t / 7) * 6 * (1 - fail);
  const drop = fail * fail * 260;
  const on = fail < 0.5 || Math.floor(t / 2) % 3 !== 0;
  return (
    <g transform={`translate(${x} ${y + bob + drop}) scale(${s}) rotate(${fail * 40 + Math.sin(t / 11) * 4})`}>
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <path d={`M ${sd * 20} -4 L ${sd * 62} -18`} stroke="#1A1B21" strokeWidth={8} strokeLinecap="round" />
          <ellipse cx={sd * 62} cy={-24} rx={34} ry={6} fill="#C8CCD8" opacity={on ? 0.5 : 0.15} />
          <path d={`M ${sd * 62 - 30 * Math.cos(t * 1.7)} -24 L ${sd * 62 + 30 * Math.cos(t * 1.7)} -24`} stroke="#1A1B21" strokeWidth={4} strokeLinecap="round" opacity={on ? 0.8 : 0.3} />
        </g>
      ))}
      <rect x={-34} y={-18} width={68} height={34} rx={14} fill="#1A1B21" stroke="#E8B230" strokeWidth={4} />
      <circle cx={0} cy={0} r={9} fill={fail > 0.3 ? '#FF4A3A' : '#3FD4FF'} />
      <circle cx={0} cy={0} r={18} fill={fail > 0.3 ? '#FF4A3A' : '#3FD4FF'} opacity={0.3} />
      {fail > 0.2 ? <path d="M 20 -18 q 6 -16 0 -30 q 14 10 6 30" fill="#8A8F9A" opacity={0.6} /> : null}
    </g>
  );
};

/** The exam's big red button on a stone pedestal, seen from the side; its feet sit at (x, y). `press` (0..1) pushes
 * the dome down, `glow` (0..1) brightens it as someone gets close, `pixels` (0..1) sparks Glitch's green on its rim. */
export const RedButton: React.FC<{ x: number; y: number; t: number; s?: number; press?: number; glow?: number; pixels?: number }> = ({ x, y, t, s = 1, press = 0, glow = 0.4, pixels = 0 }) => {
  const pulse = 0.5 + 0.5 * Math.sin(t / 5);
  const dy = press * 18;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={96} ry={14} fill="#000" opacity={0.25} />
      {/* the pedestal: a chunky stone block with a bevel and a gold band */}
      <path d="M -70 0 L -58 -96 L 58 -96 L 70 0 Z" fill="#8A847C" stroke="#2A2622" strokeWidth={5} strokeLinejoin="round" />
      <path d="M 10 -96 L 58 -96 L 70 0 L 24 0 Z" fill="#6E6862" />
      <rect x={-64} y={-62} width={128} height={12} fill="#E8B230" stroke="#2A2622" strokeWidth={3} />
      <rect x={-74} y={-110} width={148} height={20} rx={6} fill="#A39C92" stroke="#2A2622" strokeWidth={5} />
      {/* the glow, the housing ring, the dome */}
      <ellipse cx={0} cy={-124} rx={110 + 20 * glow} ry={56 + 10 * glow} fill="#FF3A3A" opacity={(0.12 + 0.25 * glow) * (0.7 + 0.3 * pulse)} filter="url(#blur10)" />
      <ellipse cx={0} cy={-112} rx={66} ry={16} fill="#2A2A30" stroke="#121216" strokeWidth={4} />
      <path d={`M -54 ${-114} Q -56 ${-168 + dy} 0 ${-172 + dy} Q 56 ${-168 + dy} 54 ${-114} Z`} fill="#E8262E" stroke="#5A0A10" strokeWidth={5} strokeLinejoin="round" />
      <path d={`M 6 ${-170 + dy} Q 50 ${-164 + dy} 52 ${-116} L 30 -116 Q 32 ${-150 + dy} 6 ${-170 + dy} Z`} fill="#B01820" opacity={0.7} />
      <path d={`M -36 ${-136 + dy * 0.6} Q -30 ${-158 + dy} -8 ${-162 + dy}`} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.75} />
      {pixels > 0
        ? Array.from({ length: 10 }).map((_, i) => {
            const a = rnd(31, i) * Math.PI * 2;
            const r = 60 + rnd(32, i) * 40 + ((t + i * 3) % 12) * 2;
            return <rect key={i} x={Math.cos(a) * r - 5} y={-130 + Math.sin(a) * r * 0.4 - 5} width={10} height={10} fill="#39FF7A" opacity={pixels * (0.4 + 0.6 * rnd(33, i + Math.floor(t / 3)))} />;
          })
        : null}
    </g>
  );
};

/** The same button from straight above, for the macro inserts: centre (x, y), dome radius r. */
export const RedButtonTop: React.FC<{ x: number; y: number; r: number; t: number; press?: number; glow?: number; pixels?: number }> = ({ x, y, r, t, press = 0, glow = 0.5, pixels = 0 }) => {
  const pulse = 0.5 + 0.5 * Math.sin(t / 5);
  const k = 1 - press * 0.12;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-r * 1.7} y={-r * 1.7} width={r * 3.4} height={r * 3.4} rx={r * 0.25} fill="#A39C92" stroke="#2A2622" strokeWidth={8} />
      <rect x={-r * 1.7} y={-r * 1.7} width={r * 3.4} height={r * 3.4} rx={r * 0.25} fill="none" stroke="#E8B230" strokeWidth={10} transform="scale(0.88)" />
      <circle r={r * 1.55} fill="#FF3A3A" opacity={(0.15 + 0.3 * glow) * (0.7 + 0.3 * pulse)} filter="url(#blur16)" />
      <circle r={r * 1.22} fill="#2A2A30" stroke="#121216" strokeWidth={8} />
      <g transform={`scale(${k})`}>
        <circle r={r} fill="#E8262E" stroke="#5A0A10" strokeWidth={9} />
        <circle cx={r * 0.18} cy={r * 0.18} r={r * 0.78} fill="#C41C24" />
        <ellipse cx={-r * 0.32} cy={-r * 0.36} rx={r * 0.34} ry={r * 0.2} fill="#FFFFFF" opacity={0.7} transform={`rotate(-35 ${-r * 0.32} ${-r * 0.36})`} />
      </g>
      {press > 0 ? <circle r={r * 1.22 + press * 40} fill="none" stroke="#FF6A5A" strokeWidth={6} opacity={press * 0.8} /> : null}
      {pixels > 0
        ? Array.from({ length: 16 }).map((_, i) => {
            const a = rnd(41, i) * Math.PI * 2;
            const rr = r * (1.25 + rnd(42, i) * 0.5);
            const w = 14 + rnd(43, i) * 16;
            return <rect key={i} x={Math.cos(a) * rr - w / 2} y={Math.sin(a) * rr - w / 2} width={w} height={w} fill="#39FF7A" opacity={pixels * (0.5 + 0.5 * rnd(44, i + Math.floor(t / 2)))} />;
          })
        : null}
    </g>
  );
};

/** The exam's floating countdown: a dark panel with red digits. `value` is what it shows (a number or "?"),
 * `glitch` (0..1) shakes it, splits the colour and turns it green. */
export const ExamCounter: React.FC<{ x: number; y: number; t: number; value: string; s?: number; glitch?: number }> = ({ x, y, t, value, s = 1, glitch = 0 }) => {
  const jx = glitch > 0 ? (rnd(51, Math.floor(t)) - 0.5) * 30 * glitch : 0;
  const red = glitch > 0.5 && Math.floor(t / 2) % 2 ? '#39FF7A' : '#FF3A3A';
  return (
    <g transform={`translate(${x + jx} ${y + Math.sin(t / 12) * 5}) scale(${s})`}>
      <rect x={-150} y={-78} width={300} height={156} rx={22} fill="#FF3A3A" opacity={0.18} filter="url(#blur10)" />
      <rect x={-130} y={-64} width={260} height={128} rx={18} fill="#14121A" stroke="#3A3440" strokeWidth={6} />
      {glitch > 0 ? (
        <text x={-6} y={40} textAnchor="middle" fontFamily="Fragment Mono" fontSize={110} fill="#2FE0FF" opacity={0.6 * glitch}>
          {value}
        </text>
      ) : null}
      <text x={0} y={40} textAnchor="middle" fontFamily="Fragment Mono" fontSize={110} fill={red} style={{ filter: `drop-shadow(0 0 10px ${red})` }}>
        {value}
      </text>
    </g>
  );
};
