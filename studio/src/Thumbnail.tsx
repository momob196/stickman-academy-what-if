import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hero, basePose, Pose, Expr, LOOKS, CastName, HEAD, Robo, KitDefs, SetDefs, Academy, Classroom, Rooftop, Study, FONT } from './engine';

// The episode's YouTube thumbnail, drawn by the same code as the episode: the real cast on the real set, the Arabic
// title in Cairo (set right, never garbled), at 1280 x 720. Free: no image model. Its props come from
// out/<slug>/publish.json ("thumbnail.render"), rendered by scripts/thumb.mjs:
//   { "set": "academy", "cast": [{ "look": "stickman", "expr": "shock", "pose": "shock" }], "text": "ماذا لو ضغطت؟", "accent": "#FFE27A" }
// Two characters at most, like every frame of the channel.

export type ThumbCast = { look: CastName | 'robo'; expr?: Expr; pose?: keyof typeof POSES };
export type ThumbProps = { set?: 'academy' | 'classroom' | 'rooftop' | 'study'; cast?: ThumbCast[]; text?: string; accent?: string };

const POSES: Record<string, Partial<Pose>> = {
  shock: { armL: { a: 60, b: 40 }, armR: { a: 60, b: 40 }, expr: 'shock' },
  cheer: { armL: { a: 135, b: 20 }, armR: { a: 135, b: 20 }, expr: 'happy' },
  point: { armR: { a: 95, b: -5 }, handR: 'point', expr: 'smug' },
  thinking: { armR: { a: 120, b: 110 }, armL: { a: -10, b: -70 }, headTilt: 8, expr: 'worried' },
  smug: { armL: { a: 22, b: -108 }, armR: { a: 30, b: -112 }, expr: 'smug' },
};

const Scene: React.FC<{ set: NonNullable<ThumbProps['set']> }> = ({ set }) =>
  set === 'classroom' ? <Classroom t={40} id="th" kids={false} /> : set === 'rooftop' ? <Rooftop t={40} /> : set === 'study' ? <Study t={40} id="th" /> : <Academy t={40} id="th" />;

export const Thumbnail: React.FC<ThumbProps> = ({ set = 'academy', cast = [{ look: 'stickman', expr: 'shock', pose: 'shock' }], text = 'ماذا لو؟', accent = '#FFE27A' }) => {
  const two = cast.slice(0, 2);
  const words = text.trim().split(/\s+/);
  // two lines when the title is long: the first word or two, then the rest
  const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [words.join(' ')];
  const size = lines.length > 1 ? 150 : 190;
  const rim = set === 'academy' ? 'rimSun' : 'rimR';
  return (
    <AbsoluteFill style={{ backgroundColor: '#14101C' }}>
      <svg width={1280} height={720} viewBox="0 0 1920 1080">
        <KitDefs />
        <SetDefs />
        <g filter="url(#blur6)">
          <Scene set={set} />
        </g>
        <rect width={1920} height={1080} fill="#0B0816" opacity={0.28} />
        {/* the characters, big and chest-up on the right: the face is what sells the click */}
        <g>
          {two.map((c, i) => {
            const s = two.length > 1 ? 1.55 : 1.85;
            const x = two.length > 1 ? 1180 + i * 470 : 1400;
            const headY = 430;
            const p: Pose = { ...basePose, x, y: headY - HEAD.y * s, scale: s, yaw: two.length > 1 ? (i ? -0.3 : 0.3) : -0.2, look: two.length > 1 ? (i ? -0.6 : 0.6) : -0.5, ...POSES[c.pose ?? 'shock'] };
            if (c.expr) p.expr = c.expr;
            return c.look === 'robo' ? (
              <Robo key={i} x={x} y={headY + 380} scale={2.2} wave={1} happy={c.expr !== 'shock'} rimId={rim} />
            ) : (
              <Hero key={i} look={LOOKS[c.look as CastName]} pose={p} shadow={0} rimId={rim} />
            );
          })}
        </g>
        {/* the title: Cairo, right to left, a dark stroke and a glow so it reads at phone size */}
        {lines.map((l, i) => (
          <text key={i} x={560} y={(lines.length > 1 ? 380 : 520) + i * (size + 20)} textAnchor="middle" direction="rtl" fontFamily={FONT.title} fontWeight={900}
            fontSize={size} fill={i === lines.length - 1 ? accent : '#FFFFFF'} stroke="#0A0812" strokeWidth={22} paintOrder="stroke" strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 24px ${accent}88)` }}>
            {l}
          </text>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
