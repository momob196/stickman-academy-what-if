import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hero, basePose, Pose, LOOKS, CastName, KitDefs, SetDefs, Study, Academy, ACADEMY, ACADEMY_NEW, Robo, ZedHolo, Drone, FONT } from './engine';

// The cast sheet: every costume on the one rig, over a soft set so contrast is judged in place, plus a row of acting
// poses. Render it after adding or changing a look:
//   npx remotion still src/index.ts Cast out/cast.png         (StickMan Academy)
//   npx remotion still src/index.ts CastPip out/cast-pip.png  (the original Pip cast)

const Label: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill="#F6EFE3" letterSpacing={2}>
    {text}
  </text>
);
const P = (o: Partial<Pose>): Pose => ({ ...basePose, ...o });
const NAMES: Record<CastName, string> = {
  pip: 'PIP A', pipHood: 'PIP B (HERO)', pipInk: 'PIP C', mo: 'MO, FRIEND', sis: 'SISTER', mom: 'MUM', suit: 'THE SUIT',
  stickman: 'StickMan', shadow: 'Shadow', lina: 'Lina', zed: 'Dr. Zed', promax: 'ProMax', timo: 'Timo', zen: 'Master Zen',
  glitch: 'Glitch', echo: 'Echo', titan: 'Titan-0', chronos: 'Chronos',
};

/** A name chip like the poster's: the English name over the Arabic, on the character's own colour. */
const Chip: React.FC<{ x: number; y: number; en: string; ar: string; color: string }> = ({ x, y, en, ar, color }) => (
  <g>
    <rect x={x - 92} y={y - 34} width={184} height={74} rx={12} fill={color} stroke="#0A0A10" strokeWidth={3} />
    <text x={x} y={y - 2} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={26} fill="#FFFFFF">{en}</text>
    <text x={x} y={y + 30} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={22} fill="#FFFFFF" direction="rtl">{ar}</text>
  </g>
);
const AR: Record<string, [string, string]> = {
  shadow: ['الظل', '#5A2E9A'],
  lina: ['لينا', '#E0558F'],
  zed: ['الدكتور زيد', '#2E64B8'],
  stickman: ['ستيكي مان', '#D8262E'],
  promax: ['بروماكس', '#D99A1E'],
  timo: ['تيمو', '#2F9A3A'],
  zen: ['المعلم زن', '#8A6A3A'],
  robo: ['روبو', '#1E9AC8'],
  glitch: ['غليتش', '#1E8A4A'],
  echo: ['إيكو', '#1AA8C8'],
  titan: ['تايتن زيرو', '#5A626E'],
  chronos: ['كرونوس', '#A8622E'],
};
const FACES: Partial<Record<CastName, Partial<Pose>>> = {
  shadow: { expr: 'smug', armL: { a: 30, b: 80 }, armR: { a: 30, b: 80 } },
  lina: { expr: 'neutral', armL: { a: 30, b: 70 }, armR: { a: 30, b: 70 } },
  zed: { expr: 'neutral', armR: { a: 40, b: 90 }, look: 0.4 },
  stickman: { expr: 'smug', armR: { a: 40, b: 120 }, headTilt: -4 },
  promax: { expr: 'cool', armL: { a: 30, b: 80 }, armR: { a: 30, b: 80 } },
  timo: { expr: 'happy', armR: { a: 60, b: 100 }, headTilt: 6 },
  zen: { expr: 'happy', armR: { a: 22, b: 30 } },
  glitch: { expr: 'shock', armL: { a: 50, b: 60 }, armR: { a: 20, b: -30 }, headTilt: 10 },
  echo: { expr: 'happy', armL: { a: 120, b: 30 }, armR: { a: 70, b: 60 }, sway: 10 },
  titan: { expr: 'tired', armR: { a: 40, b: 100 }, armL: { a: 14, b: -8 } },
  chronos: { expr: 'smug', armL: { a: 30, b: 70 }, sway: 12, look: -0.3 },
};

export const CastSheet: React.FC = () => {
  const row1 = 330;
  const row2 = 800;
  return <Sheet row1={row1} row2={row2} />;
};

/** StickMan's acting poses over the Academy. */
export const CastPoses: React.FC = () => {
  const row2 = 560;
  const poses: { name: string; p: Partial<Pose> }[] = [
    { name: 'thinking', p: { armR: { a: 120, b: 110 }, armL: { a: -10, b: -70 }, headTilt: 8, expr: 'worried', yaw: 0.2 } },
    { name: 'shrug', p: { armL: { a: 40, b: 80 }, armR: { a: 40, b: 80 }, headTilt: -10, expr: 'oops' } },
    { name: 'point', p: { armR: { a: 95, b: -5 }, armL: { a: 10, b: -8 }, look: 1, yaw: 0.35, expr: 'smug', handR: 'point', sway: 14 } },
    { name: 'cheer', p: { armL: { a: 135, b: 20 }, armR: { a: 135, b: 20 }, expr: 'happy', squash: -0.05 } },
    { name: 'shock', p: { armL: { a: 60, b: 40 }, armR: { a: 60, b: 40 }, expr: 'shock', yaw: -0.3, look: -0.6, sway: -14 } },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: '#9CD4FA' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <KitDefs />
        <SetDefs />
        <g filter="url(#blur6)">
          <Academy t={0} id="poses" />
        </g>
        {poses.map((q, i) => (
          <g key={q.name}>
            <Hero look={LOOKS.stickman} pose={P({ x: 220 + i * 370, y: row2, scale: 0.9, ...q.p })} shadow={0.6} rimId="rimSun" />
            <rect x={220 + i * 370 - 80} y={row2 + 170} width={160} height={40} rx={10} fill="#0A0A10" opacity={0.65} />
            <Label x={220 + i * 370} y={row2 + 198} text={q.name.toUpperCase()} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

const Sheet: React.FC<{ row1: number; row2: number }> = ({ row1, row2 }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#9CD4FA' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <KitDefs />
        <SetDefs />
        <g filter="url(#blur6)">
          <Academy t={0} id="cast" />
        </g>
        <rect width={1920} height={1080} fill="#0B1530" opacity={0.12} />
        {ACADEMY.map((c, i) => {
          const x = 140 + i * 234;
          return (
            <g key={c}>
              <Hero look={LOOKS[c]} pose={P({ x, y: row1, scale: 0.74, yaw: i % 2 ? -0.25 : 0.25, look: i % 2 ? -0.4 : 0.4, ...FACES[c] })} shadow={0.6} rimId="rimSun" />
              <Chip x={x} y={row1 + 175} en={NAMES[c]} ar={AR[c][0]} color={AR[c][1]} />
            </g>
          );
        })}
        <Robo x={140 + 7 * 234} y={row1 + 113} scale={0.62} wave={1} rimId="rimSun" />
        <Chip x={140 + 7 * 234} y={row1 + 175} en="Robo" ar={AR.robo[0]} color={AR.robo[1]} />
        <ZedHolo x={140 + 2 * 234 + 30} y={96} t={20} s={0.5} />
        <Drone x={140 + 4 * 234 + 92} y={150} t={20} s={0.62} />
        {ACADEMY_NEW.map((c, i) => {
          const x = 330 + i * 420;
          const sc = c === 'titan' ? 0.84 : 0.74;
          return (
            <g key={c}>
              <Hero look={LOOKS[c]} pose={P({ x, y: row2 - (sc - 0.74) * 150, scale: sc, yaw: i % 2 ? -0.25 : 0.25, look: i % 2 ? -0.4 : 0.4, ...FACES[c] })} shadow={0.6} rimId="rimSun" />
              <Chip x={x} y={row2 + 165} en={NAMES[c]} ar={AR[c][0]} color={AR[c][1]} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** The original Pip cast, over the study. */
export const CastSheetPip: React.FC = () => {
  const cast: CastName[] = ['pip', 'pipHood', 'pipInk', 'mo', 'sis', 'mom', 'suit'];
  const row1 = 430;
  return (
    <AbsoluteFill style={{ backgroundColor: '#14101C' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <KitDefs />
        <SetDefs />
        <g filter="url(#blur10)">
          <Study t={0} id="cast" />
        </g>
        <rect width={1920} height={1080} fill="#0B0816" opacity={0.35} />
        {cast.map((c, i) => {
          const x = 150 + i * 270;
          const small = c === 'sis' ? 0.68 : 0.82;
          return (
            <g key={c}>
              <Hero look={LOOKS[c]} pose={P({ x, y: row1 + (0.82 - small) * 340, scale: small, yaw: i % 2 ? -0.35 : 0.35, look: i % 2 ? -0.5 : 0.5, expr: 'happy' })} shadow={0.6} />
              <Label x={x} y={row1 + 170} text={NAMES[c]} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** The Academy set on its own, sharp, with the cast standing on the ledge: the scene check. */
export const AcademyScene: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#9CD4FA' }}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <KitDefs />
      <SetDefs />
      <Academy t={40} id="scene" />
      {ACADEMY.map((c, i) => {
        const x = 200 + i * 225;
        return <Hero key={c} look={LOOKS[c]} pose={P({ x, y: 868 - 150 * 0.9 - 10, scale: 0.9, yaw: (i - 3) * -0.1, ...FACES[c] })} shadow={0.8} rimId="rimSun" />;
      })}
      <Robo x={1780} y={868} scale={0.7} wave={1} t={40} rimId="rimSun" />
    </svg>
  </AbsoluteFill>
);
