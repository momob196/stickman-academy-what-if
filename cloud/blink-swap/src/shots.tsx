import React from 'react';
import {
  Hero, Pose, basePose, poseAt, faceAt, kf, clamp, easeOut, camT,
  LOOKS, LEG_LEN, HEAD, Kitchen, KitchenIsland, KITCHEN, stand, Tabletop, LightVeil, Glow,
  Study, Desk, Rooftop, Schematic, SCH, DrawOn, SchLabel, CountUp, Cat, CookieTop, PlateTop,
  Foreground, Sparkle, PasteIn, Arrow, FONT, ShotProps,
} from '../../engine';

// "ماذا لو كانت كل رَمشة تُبادِل؟" — what if every blink swapped things around you?
// Nineteen shots on kitchen, study (day and night), rooftop (dusk and the red turn) and the schematic.
// The power, at the word "رَمشة": a cyan ring, a one-frame double image, and two places traded.
// Every shot is a pure function of its own clock t.

const PIP = LOOKS.pipHood;
const MO = LOOKS.mo;
const SIS = LOOKS.sis;
const MOM = LOOKS.mom;
const CYAN = '#7FD4FF';

/** A swap in progress: an elliptical cyan ring pulsing round a traded thing. */
const SwapRing: React.FC<{ x: number; y: number; r: number; t: number; period?: number; color?: string }> = ({ x, y, r, t, period = 12, color = CYAN }) => {
  const p = clamp((t % period) / period);
  return <ellipse cx={x} cy={y} rx={r * (0.55 + 0.5 * p)} ry={r * (0.24 + 0.22 * p)} fill="none" stroke={color} strokeWidth={6} opacity={0.7 * (1 - p)} />;
};

/** A soft armchair for the study, in the set's flat style. */
const ComfyChair: React.FC<{ x: number; y: number; s?: number; flip?: boolean }> = ({ x, y, s = 1, flip = false }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <path d="M -78 -180 Q -92 -108 -78 -30 L -56 -30 L -56 6 L 56 6 L 56 -30 L 78 -30 Q 92 -108 78 -180 Q 40 -214 0 -214 Q -40 -214 -78 -180 Z" fill="#B0603C" stroke="#241824" strokeWidth={5} strokeLinejoin="round" />
    <path d="M -66 -186 Q -80 -120 -70 -60 L 70 -60 Q 80 -120 66 -186 Z" fill="#C97446" />
    <rect x={-70} y={-56} width={140} height={34} rx={12} fill="#8A4A32" stroke="#241824" strokeWidth={4} />
    <rect x={-60} y={-22} width={12} height={22} fill="#34252E" />
    <rect x={48} y={-22} width={12} height={22} fill="#34252E" />
    <ellipse cx={0} cy={8} rx={86} ry={10} fill="#000" opacity={0.28} />
    <path d="M 66 -170 Q 78 -120 72 -66" stroke="#FFB46A" strokeWidth={4} opacity={0.4} fill="none" strokeLinecap="round" />
  </g>
);

/** The Arabic title card: same shape as the engine's, but without letter-spacing (Arabic must join) and
 *  with the pulse matched by contains, since diacritics are part of the tokens. */
export const ArTitle: React.FC<{ t: number; lines: [string, string]; accent?: string; accentT?: number; y?: number; size?: number }> = ({ t, lines, accent, accentT = 24, y = 150, size = 104 }) => {
  const pulse = t >= accentT && t < accentT + 14 ? 1 + 0.13 * Math.sin(((t - accentT) / 14) * Math.PI) : 1;
  const op1 = clamp((t - 2) / 6);
  const op2 = clamp((t - 5) / 6);
  const words2 = lines[1].split(' ');
  return (
    <g style={{ direction: 'rtl' }}>
      <text x={960} y={y} textAnchor="middle" fontFamily={FONT.title} fontWeight={700} fontSize={size * 0.42} fill="#F6EFE3" stroke="#1A1230" strokeWidth={6} paintOrder="stroke" opacity={op1} style={{ letterSpacing: 0, direction: 'rtl' }}>
        {lines[0]}
      </text>
      <g opacity={op2} style={{ filter: 'drop-shadow(0 0 22px rgba(255,138,61,0.5))' }}>
        <text x={960} y={y + size * 0.8} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={size} fill="#FF8A3D" stroke="#1A1230" strokeWidth={10} paintOrder="stroke" style={{ letterSpacing: 0, direction: 'rtl' }}>
          {words2.map((w, i) => {
            const hit = accent !== undefined && w.includes(accent);
            return (
              <tspan key={i} fill={hit ? '#FFE27A' : undefined} fontSize={hit ? size * pulse : undefined} opacity={hit ? pulse : undefined}>
                {w + (i < words2.length - 1 ? '\u00A0' : '')}
              </tspan>
            );
          })}
        </text>
      </g>
    </g>
  );
};

// ---------- S1: macro insert, top-down on the counter: the sister's cookie swaps into Pip's mitten ----------
export const S1: React.FC<ShotProps> = ({ t, len }) => {
  const hand = { x: kf(t, [[0, 1330], [6, 1180], [10, 1120], [16, 1140]]), y: kf(t, [[0, 300], [6, 420], [10, 470], [16, 455]]) };
  const plateOp = kf(t, [[0, 1], [4, 0.55], [10, 0.2], [16, 0.1]]);
  return (
    <g transform={camT(960, kf(t, [[0, 520], [len, 540]]), kf(t, [[0, 1.0], [len, 1.05]]))}>
      <Tabletop edge={900} wood="#A89C8A" grain="#968A78" lip="#8E8474" kind="stone" floor="#2C2A30" floorLines="#232127" />
      <LightVeil id="s1veil" lights={[[930, 430, 760]]} o={0.55} />
      <Glow x={930} y={400} r={620} o={0.35} />
      <circle cx={1470} cy={660} r={96} fill="#000" opacity={0.3} />
      <circle cx={1460} cy={650} r={88} fill="#C9D6DE" opacity={0.9} />
      <circle cx={1460} cy={650} r={70} fill="#F6F4EE" />
      <g opacity={plateOp}>
        <PlateTop x={760} y={480} r={200} />
        <CookieTop x={780} y={470} r={92} rot={14} />
      </g>
      <SwapRing x={780} y={470} r={130} t={t + 1} period={9} />
      <Sparkle x={880} y={400} t={t - 2} s={1.2} />
      <PasteIn x={1120} y={470} t={t - 5} color={CYAN} ring={110}>
        <CookieTop x={1120} y={470} r={92} rot={14} />
      </PasteIn>
      {/* Pip's arm comes in from the top right; the mitten holds the traded cookie */}
      <g filter="url(#rimR)">
        <path d={`M ${hand.x + 46} ${hand.y - 50} Q ${hand.x + 170} ${hand.y - 210} ${hand.x + 400} ${hand.y - 570}`} stroke={PIP.line} strokeWidth={122} fill="none" strokeLinecap="round" />
        <path d={`M ${hand.x + 46} ${hand.y - 50} Q ${hand.x + 170} ${hand.y - 210} ${hand.x + 400} ${hand.y - 570}`} stroke={PIP.limb} strokeWidth={104} fill="none" strokeLinecap="round" />
        <g transform={`translate(${hand.x} ${hand.y}) rotate(34) scale(4.8)`}>
          <rect x={-4} y={10} width={8} height={24} rx={4} fill={PIP.hand} stroke={PIP.line} strokeWidth={2.4} />
          <path d="M -12 0 Q -15 16 -6 20 L 8 20 Q 15 16 12 0 Z" fill={PIP.hand} stroke={PIP.line} strokeWidth={2.6} strokeLinejoin="round" />
          <ellipse cx={-11} cy={-4} rx={4.5} ry={7} fill={PIP.hand} stroke={PIP.line} strokeWidth={2.4} />
        </g>
      </g>
    </g>
  );
};

// ---------- S2: medium, the kitchen stills: Pip bites the swapped cookie; the sister rounds on him ----------
const S2_FLOOR = stand(KITCHEN, 0.45, 0.4).y + LEG_LEN;
const P2 = stand(KITCHEN, 0.55, 0.4);
const S3S = { x: stand(KITCHEN, 0.3, 0.4).x, y: S2_FLOOR - LEG_LEN * 0.7 };
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const pip = poseAt(t, [
    { f: 0, p: { x: P2.x + 40, y: P2.y, scale: P2.scale, yaw: -0.45, look: -0.7, armR: { a: 96, b: 84 }, armL: { a: 16, b: -6 } } },
    { f: 12, p: { armR: { a: 116, b: 98 } }, ease: easeOut },
    { f: 15, p: { headTilt: 3 } },
  ]);
  const sisArm = kf(t, [[0, -20], [8, 26], [12, 18]]);
  const sis = poseAt(t, [
    { f: 0, p: { x: S3S.x, y: S3S.y, scale: 0.7, yaw: 0.55, look: 0.8, armR: { a: -20, b: 0 }, armL: { a: 14, b: -6 } } },
    { f: 8, p: { armR: { a: 26, b: 6 }, handR: 'point' }, ease: easeOut },
    { f: 12, p: { headTilt: 4 } },
  ]);
  const cat = KITCHEN.P(0.86, 1, 0.66);
  return (
    <g transform={camT(970, 575, kf(t, [[0, 1.78], [len, 1.86]]))}>
      <Kitchen t={t + 40} id="bs2" />
      <Hero look={SIS} pose={{ ...sis, ...faceAt(t, [[0, 'neutral'], [8, 'shock']]) }} rimId="rimR" shadow={0.4} />
      <Hero look={PIP} pose={{ ...pip, ...faceAt(t, [[0, 'happy'], [15, 'smug']]) }} rimId="rimR" shadow={0.4} />
      <KitchenIsland />
      {(() => { const p = poseAt(t, [{ f: 0, p: { x: P2.x + 40, y: P2.y, scale: P2.scale, yaw: -0.45, armR: { a: 116, b: 98 } } }]); const h = { x: p.x + 40, y: p.y - 150 }; return <CookieTop x={h.x} y={h.y} r={54} rot={10} />; })()}
      <Cat x={cat.x} y={cat.y} mood={t > 4 ? 'alert' : 'sleep'} f={t} />
      <Foreground blur={10}>
        <path d="M -40 1080 Q 120 900 60 780 Q 20 900 90 1080 Z" fill="#0E1610" />
      </Foreground>
    </g>
  );
};

// ---------- S3: close-up: the sister, scandalised ----------
export const S3: React.FC<ShotProps> = ({ t }) => {
  const sc = 3.4 * (1 + 0.03 * clamp(t / 28));
  const pose: Pose = { ...basePose, x: 760, y: 560 - HEAD.y * sc, scale: sc, yaw: 0.25, look: 0.55, armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, headTilt: kf(t, [[0, 0], [10, 7]]), ...faceAt(t, [[0, 'neutral'], [8, 'shock']]) };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(380 -60) scale(1.9)">
          <Kitchen t={t + 90} id="bs3" />
          <KitchenIsland />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.25} />
      <Hero look={SIS} pose={pose} rimId="rimR" shadow={0} />
    </g>
  );
};

// ---------- S4: wide, the study: mid-swap, Pip and Mo trade the standing spot for the comfy chair ----------
const S4_DESK: [number, number, number] = [620, 1120, 700];
const CHAIR = { x: 1330, y: 745 };
const moChairPose: Pose = { ...basePose, x: CHAIR.x - 30, y: CHAIR.y - 96, scale: 0.96, yaw: -0.3, legL: { a: 84, b: -78 }, legR: { a: 92, b: -84 }, armL: { a: 40, b: 40 }, armR: { a: 40, b: 40 } };
const pipPrePose: Pose = { ...basePose, x: 1080, y: 712, scale: 1, yaw: -0.2, armL: { a: 14, b: -6 } };
export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const up = clamp((t - 8) / 5);
  const inPlace = clamp((t - 13) / 4);
  const swapRingX = (CHAIR.x + 1080) / 2, swapRingY = 690;
  const pipPost: Pose = { ...basePose, x: CHAIR.x - 30, y: CHAIR.y - 96, scale: 0.96, yaw: -0.25, legL: { a: 84, b: -78 }, legR: { a: 92, b: -84 }, armL: { a: 30, b: 44 }, armR: { a: 20, b: 10 }, expr: 'happy' };
  const moPost: Pose = { ...basePose, x: 1080, y: 712, scale: 1, yaw: 0.2, armL: { a: 34, b: 46 }, armR: { a: 34, b: 46 }, expr: 'oops' };
  const fly = 170 * Math.sin(Math.PI * clamp(up / (up || 1)));
  return (
    <g transform={camT(1020, kf(t, [[0, 560], [len, 590]]), kf(t, [[0, 0.96], [len, 1.02]]))}>
      <Study t={t + 34} id="bs4" />
      <Desk x0={S4_DESK[0]} x1={S4_DESK[1] + 180} y={S4_DESK[2]} lamp={false} />
      {t < 10 && <Hero look={PIP} pose={{ ...pipPrePose, ...faceAt(t, [[0, 'worried']]) }} rimId="rimR" shadow={0.4} />}
      {t < 10 && <Hero look={MO} pose={{ ...moChairPose, ...faceAt(t, [[0, 'happy']]) }} rimId="rimR" shadow={0.4} />}
      {t >= 13 && <Hero look={PIP} pose={{ ...pipPost }} rimId="rimR" shadow={0.4} />}
      {t >= 13 && <Hero look={MO} pose={{ ...moPost }} rimId="rimR" shadow={0.4} />}
      {t >= 6 && t < 13 && (
        <g opacity={0.55}>
          <g transform={`translate(0 ${-fly * 0.5})`}><Hero look={PIP} pose={{ ...pipPrePose, armL: { a: 60, b: 60 } }} rimId="rimR" shadow={0} /></g>
          <g transform={`translate(0 ${-fly})`}><Hero look={MO} pose={{ ...moPost, armL: { a: 70, b: 70 } }} rimId="rimR" shadow={0} /></g>
        </g>
      )}
      {t >= 6 && t < 14 && <SwapRing x={swapRingX} y={swapRingY} r={150} t={t - 6} period={8} />}
      <ComfyChair x={CHAIR.x} y={CHAIR.y} />
      <Foreground blur={10}>
        <path d="M -30 1080 Q 150 960 40 820 L 20 1080 Z" fill="#101018" />
      </Foreground>
    </g>
  );
};

// ---------- S5: medium: Pip luxuriates in the chair; Mo stands, out-argued ----------
export const S5: React.FC<ShotProps> = ({ t, len }) => {
  const pip = poseAt(t, [
    { f: 0, p: { x: CHAIR.x - 30, y: CHAIR.y - 96, scale: 0.96, yaw: -0.3, legL: { a: 84, b: -78 }, legR: { a: 92, b: -84 }, armL: { a: 24, b: 40 }, armR: { a: 40, b: 30 }, look: -0.3 } },
    { f: 18, p: { headTilt: 2 } },
    { f: 28, p: { armL: { a: 26, b: 30 }, headTilt: -5 }, ease: easeOut },
  ]);
  const mo = poseAt(t, [
    { f: 0, p: { x: 1080, y: 712, scale: 1, yaw: 0.3, armL: { a: 38, b: 48 }, armR: { a: 38, b: 48 }, look: -0.6 } },
    { f: 20, p: { headTilt: -3 } },
    { f: 34, p: { headTilt: 2, armL: { a: 44, b: 54 }, armR: { a: 44, b: 54 } }, ease: easeOut },
  ]);
  return (
    <g transform={camT(kf(t, [[0, 1060], [len, 1080]]), 570, kf(t, [[0, 1.72], [len, 1.84]]))}>
      <Study t={t + 150} id="bs5" />
      <Hero look={MO} pose={{ ...mo, ...faceAt(t, [[0, 'oops'], [34, 'worried']]) }} rimId="rimR" shadow={0.4} />
      <Desk x0={620} x1={1300} y={700} lamp={false} />
      <Hero look={PIP} pose={{ ...pip, ...faceAt(t, [[0, 'happy'], [28, 'smug']]) }} rimId="rimR" shadow={0.4} />
      <ComfyChair x={CHAIR.x} y={CHAIR.y} />
      <Foreground blur={10}>
        <path d="M 1560 1080 Q 1480 900 1560 800 L 1640 1080 Z" fill="#101018" />
      </Foreground>
    </g>
  );
};

// ---------- S6: close-up: Mo, palms up, "seriously?" ----------
export const S6: React.FC<ShotProps> = ({ t }) => {
  const sc = 3.2 * (1 + 0.03 * clamp(t / 18));
  const pose: Pose = { ...basePose, x: 1120, y: 560 - HEAD.y * sc, scale: sc, yaw: -0.35, look: -0.6, headTilt: kf(t, [[0, 0], [9, -8]]), ...faceAt(t, [[0, 'neutral'], [9, 'oops']]) };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-360 -60) scale(1.9)">
          <Study t={t + 210} id="bs6" />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.27} />
      <Hero look={MO} pose={pose} rimId="rimL" shadow={0} />
    </g>
  );
};

// ---------- S7: wide, the kitchen at dusk: Pip and Mom mid-swap, towels, pot steam everywhere ----------
const MOMS = stand(KITCHEN, 0.62, 0.4);
const P7S = stand(KITCHEN, 0.3, 0.4);
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const swapDone = t >= 6;
  const gone = clamp((t - 6) / 16);
  const pip = poseAt(t, [
    { f: 0, p: { x: P7S.x, y: P7S.y, scale: P7S.scale, yaw: 0.55, look: 0.8, armL: { a: 16, b: -6 }, armR: { a: 22, b: 12 }, expr: 'worried' } },
    { f: 6, p: { x: MOMS.x - 24, y: MOMS.y, scale: MOMS.scale, yaw: 0.15, armR: { a: 34, b: -22 }, armL: { a: 58, b: 20 } }, ease: easeOut },
    { f: 15, p: { headTilt: 4 } },
  ]);
  const momFly = poseAt(t, [
    { f: 6, p: { x: MOMS.x - 40, y: MOMS.y - 210, scale: MOMS.scale, yaw: 0.4, armL: { a: 82, b: 70 }, armR: { a: 124, b: 48 }, expr: 'shock' } },
    { f: 22, p: { x: MOMS.x - 660, y: MOMS.y - 280 }, ease: easeOut },
  ]);
  return (
    <g transform={camT(960, kf(t, [[0, 560], [len, 585]]), kf(t, [[0, 0.95], [len, 1.0]]))}>
      <Kitchen t={t + 210} id="bs7" />
      {swapDone && gone < 1 && <g opacity={0.5 * (1 - gone)}><Hero look={MOM} pose={momFly} rimId="rimR" shadow={0} /></g>}
      {!swapDone && <Hero look={MOM} pose={{ ...basePose, x: MOMS.x - 20, y: MOMS.y, scale: MOMS.scale, yaw: 0.4, armR: { a: 40, b: -18 }, armL: { a: 30, b: 22 }, expr: 'neutral' }} rimId="rimR" shadow={0.4} />}
      <Hero look={PIP} pose={{ ...pip, ...faceAt(t, [[0, 'worried'], [8, 'oops']]) }} rimId="rimR" shadow={0.4} />
      <KitchenIsland />
      <SwapRing x={(MOMS.x + P7S.x) / 2} y={MOMS.y - 90} r={170} t={t + 2} period={10} />
      <g transform={`translate(${MOMS.x + 16} ${MOMS.y - 150})`}>{/* the pot on the hob, steaming */}
        <ellipse cx={-126} cy={96} rx={62} ry={38} fill="#5A6472" stroke="#241824" strokeWidth={4} />
        <rect x={-188} y={90} width={124} height={10} rx={5} fill="#4A5462" />
        <path d={`M -116 46 q ${-8 + Math.sin(t / 4) * 5} -22 0 -44 q 12 -20 2 -40`} stroke="#F6EFE3" strokeWidth={6} fill="none" opacity={0.35} strokeLinecap="round" />
      </g>
      <Foreground blur={10}>
        <path d="M 1500 1080 Q 1560 900 1480 760 L 1620 1080 Z" fill="#0E1610" />
      </Foreground>
    </g>
  );
};

// ---------- S8: quick medium: Pip, in Mom's spot, at her stove, her towel on his shoulder ----------
export const S8: React.FC<ShotProps> = ({ t }) => {
  const pose: Pose = { ...basePose, x: MOMS.x - 30, y: MOMS.y, scale: MOMS.scale, yaw: 0.2, look: -0.35, armR: { a: 40, b: -14 }, armL: { a: 60, b: 26 }, expr: 'oops', headTilt: kf(t, [[0, 0], [4, -3]]) };
  return (
    <g transform={camT(MOMS.x, MOMS.y - 220, 1.9)}>
      <Kitchen t={t + 260} id="bs8" />
      <Hero look={PIP} pose={pose} rimId="rimR" shadow={0.4} />
      {/* the towel draped from his shoulder */}
      <g transform={`translate(${pose.x - 44} ${pose.y - 206}) rotate(-24)`}>
        <rect x={-15} y={-28} width={30} height={82} rx={10} fill="#D9525E" stroke="#241824" strokeWidth={4} />
      </g>
      <SwapRing x={pose.x + 120} y={pose.y - 80} r={110} t={t} period={8} />
      <KitchenIsland />
      <Foreground blur={10}>
        <path d="M -40 1080 Q 90 940 20 820 L 10 1080 Z" fill="#0E1610" />
      </Foreground>
    </g>
  );
};

// ---------- S9: close-up: Mom, in Pip's chair, in his place, scandalised ----------
export const S9: React.FC<ShotProps> = ({ t }) => {
  const sc = 3.15 * (1 + 0.03 * clamp(t / 51));
  const pose: Pose = { ...basePose, x: 1180, y: 560 - HEAD.y * sc, scale: sc, yaw: -0.4, look: kf(t, [[0, -0.5], [24, -0.2], [38, -0.6]]), armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, headTilt: kf(t, [[0, 0], [16, 6], [34, -4]]), ...faceAt(t, [[0, 'neutral'], [8, 'shock'], [30, 'worried']]) };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-300 -80) scale(1.9)">
          <Study t={t + 300} id="bs9" night />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.25} />
      <Hero look={MOM} pose={pose} rimId="rimL" shadow={0} />
    </g>
  );
};

// ---------- S10: the title, wide on the rooftop at dusk: Pip on the parapet rubs his eyes ----------
export const S10: React.FC<ShotProps> = ({ t, len }) => {
  const rub = Math.sin(t / 3) * 5;
  const blink = kf(t, [[0, 0.4], [12, 0], [40, 0.15], [48, 1], [52, 0], [60, 0.2]]);
  const pose = poseAt(t, [
    { f: 0, p: { x: 1240, y: 738, scale: 0.72, yaw: -0.25, look: -0.4, legL: { a: 78, b: -70 }, legR: { a: 86, b: -78 }, armL: { a: 150 + rub, b: 105 }, armR: { a: 150 - rub, b: 105 } } },
  ]);
  return (
    <g transform={camT(kf(t, [[0, 960], [len, 940]]), 520, kf(t, [[0, 1.0], [len, 1.07]]))}>
      <Rooftop t={t} sunX={980} sunY={640} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'neutral']]), blink }} rimId="rimR" shadow={0.6} />
      <ArTitle t={t} lines={['ماذا لو كانت', 'كل رَمشة تُبادِل؟']} accent="رَمشة" accentT={26} y={148} size={102} />
    </g>
  );
};

// ---------- S11: medium, low angle on the roof: "easiest power ever", he lounges ----------
export const S11: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 940, y: 830 - LEG_LEN * 1.05, scale: 1.05, yaw: 0.3, look: 0.5, legL: { a: 6, b: -4 }, legR: { a: 14, b: 6 }, armL: { a: 158, b: 116 }, armR: { a: 162, b: 118 } } },
    { f: 20, p: { headTilt: 5 } },
    { f: 34, p: { armL: { a: 152, b: 112 }, headTilt: 2 }, ease: easeOut },
  ]);
  return (
    <g transform={camT(kf(t, [[0, 900], [len, 915]]), kf(t, [[0, 480], [len, 470]]), kf(t, [[0, 1.66], [len, 1.78]]))}>
      <Rooftop t={t + 66} sunX={1060} sunY={470} low={280} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'cool'], [26, 'smug']]) }} rimId="rimR" shadow={0} />
      <Foreground blur={10}>
        <path d="M 120 1080 L 260 880 L 340 1000 L 300 1080 Z" fill="#0E1610" />
      </Foreground>
    </g>
  );
};

// ---------- S12: medium, the study at night: fingers propping the eyelids open ----------
export const S12: React.FC<ShotProps> = ({ t, len }) => {
  const strain = Math.sin(t / 4) * 2;
  const pose = poseAt(t, [
    { f: 0, p: { x: 930, y: 712, scale: 1, yaw: 0.4, look: 0.5, armL: { a: 158 + strain, b: 106 }, armR: { a: 160 + strain, b: 108 } } },
    { f: 16, p: { headTilt: 4 } },
  ]);
  return (
    <g transform={camT(kf(t, [[0, 950], [len, 930]]), 560, kf(t, [[0, 1.78], [len, 1.88]]))}>
      <Study t={t + 420} id="bs12" night />
      <Desk x0={560} x1={1300} y={700} laptop={false} />
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'worried'], [18, 'tired']]) }} rimId="rimR" shadow={0} />
      <Foreground blur={10}>
        <path d="M 1480 1080 Q 1560 880 1500 700 L 1660 1080 Z" fill="#0C0A14" />
      </Foreground>
    </g>
  );
};

// ---------- S13: schematic: the eye draws on; the counter rolls 15 to 20 on every beat ----------
const EYE_D = 'M 560 500 Q 780 330 1000 500 Q 780 670 560 500 Z';
export const S13: React.FC<ShotProps> = ({ t }) => {
  const cyc = t % 9;
  const shut = cyc > 5 && cyc < 7;
  return (
    <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [38, 1.04]])}) translate(-960 -540)`}>
      <Schematic t={t} id="bs13" />
      <DrawOn d={EYE_D} t={t - 2} dur={10} width={6} />
      <circle cx={780} cy={500} r={56} fill="#F6EFE3" opacity={shut ? 0.25 : 0.9} />
      <circle cx={780} cy={500} r={26} fill={SCH.live} opacity={shut ? 0.2 : 0.95} />
      {shut && <path d="M 620 500 Q 780 560 940 500" stroke={SCH.line} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.9} />}
      <SwapRing x={780} y={500} r={150} t={t + 1} period={9} color={SCH.live} />
      <Arrow x0={1060} y0={500} x1={1220} y1={500} t={t - 8} color={SCH.dim} />
      <SchLabel x={960} y={905} t={t - 4} text="EVERY ONE IS A SWAP" size={40} color={SCH.dim} />
      <SchLabel x={1430} y={430} t={t - 12} text="15–20" size={130} color={SCH.live} />
      <SchLabel x={1430} y={520} t={t - 18} text="BLINKS / MINUTE" size={40} color={SCH.dim} />
    </g>
  );
};

// ---------- S14: macro on the digits: 15 to 20, ticking like a clock ----------
export const S14: React.FC<ShotProps> = ({ t, len }) => {
  const rate = Math.min(20, 15 + Math.floor(thresholds(t - 8, [6, 14, 24, 36, 52])));
  const flipped = t > 8 && [6, 14, 24, 36, 52].includes(findStep(t - 8, [6, 14, 24, 36, 52]));
  const secs = Math.max(0, Math.floor((t - 8) / 30));
  return (
    <g transform="translate(960 540) scale(1.35) translate(-960 -620)">
      <Schematic t={t + 480} id="bs14" />
      <text x={960} y={500} textAnchor="middle" fontFamily={FONT.ui} fontSize={300} fill={SCH.live} style={{ filter: `drop-shadow(0 0 26px ${SCH.glow}88)` }}>
        {rate}
      </text>
      {flipped && <circle cx={960} cy={420} r={150} fill="none" stroke={SCH.live} strokeWidth={8} opacity={0.5} />}
      <SchLabel x={960} y={660} t={t - 2} text="BLINKS EVERY MINUTE" size={52} color={SCH.dim} />
      <SchLabel x={960} y={940} t={t - 12} text={`T+${secs}s  ·  ${20 * secs} BLINKS SO FAR`} size={44} color={SCH.line} />
      <SwapRing x={960} y={400} r={210} t={t} period={9} color={SCH.live} />
    </g>
  );
};

// ---------- S15: schematic bar: a tenth of your waking hours, shut ----------
export const S15: React.FC<ShotProps> = ({ t }) => {
  const shut = Math.max(0, Math.floor((t - 8) / 30));
  const closed = t > 8 && (t - 8) % 30 < 4;
  return (
    <g transform={`translate(960 540) scale(${kf(t, [[0, 1], [50, 1.03]])}) translate(-960 -540)`}>
      <Schematic t={t + 900} id="bs15" />
      <g>
        <rect x={380} y={520} width={1160} height={140} fill="none" stroke={SCH.line} strokeWidth={6} />
        <rect x={380} y={520} width={1120 * clamp((t - 8) / 40)} height={140} fill={SCH.live} opacity={0.85} />
        <SchLabel x={960} y={470} t={t - 3} text="AWAKE, EYES CLOSED" size={52} color={SCH.line} />
        <CountUp x={960} y={760} t={t - 10} to={10} dur={26} size={120} suffix="%" />
        <SchLabel x={960} y={860} t={t - 16} text="EVERY WAKING MINUTE" size={40} color={SCH.dim} />
      </g>
      <g transform="translate(660 300)">
        <path d="M -180 0 Q 0 150 180 0 Q 0 -40 -180 0 Z" fill="none" stroke={closed ? SCH.live : SCH.dim} strokeWidth={7} />
        <SchLabel x={0} y={220} t={t - 6} text={closed ? 'SHUT' : 'OPEN'} size={40} color={closed ? SCH.live : SCH.dim} />
      </g>
      <SwapRing x={660} y={300} r={170} t={t} period={9} color={SCH.live} />
    </g>
  );
};

// ---------- S16: close-up: Pip, rubbing his eyes, bags under them ----------
export const S16: React.FC<ShotProps> = ({ t }) => {
  const sc = 3.9;
  const rub = Math.sin(t / 2.5) * 4;
  const pose: Pose = { ...basePose, x: 900, y: 600 - HEAD.y * sc, scale: sc, yaw: 0.3, look: 0.2, armL: { a: 145 + rub, b: 104 }, armR: { a: 150 - rub, b: 100 }, headTilt: 8, ...faceAt(t, [[0, 'tired']]) };
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-300 -50) scale(1.9)">
          <Study t={t + 460} id="bs16" night />
          <Desk x0={560} x1={1300} y={700} laptop={false} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.25} />
      <Hero look={PIP} pose={pose} rimId="rimR" shadow={0} />
    </g>
  );
};

// ---------- S17: extreme close-up: the eye snaps open on "That's real." ----------
export const S17: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 7.2;
  const pose: Pose = { ...basePose, x: 960, y: 700 - HEAD.y * sc * 0.62, scale: sc, yaw: 0.1, look: 0.15, armL: { a: 14, b: -6 }, armR: { a: 16, b: -4 } };
  const blink = kf(t, [[0, 1], [4, 0.82], [9, 0], [10, 0.04], [len, 0]]);
  const glint = kf(t, [[0, 0], [9, 0], [11, 1], [24, 0.5]]);
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-320 -60) scale(2.0)">
          <Study t={t + 520} id="bs17" night />
          <Desk x0={560} x1={1300} y={700} laptop={false} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.3} />
      <rect x={0} y={0} width={1920} height={1080} fill="#FF3344" opacity={0.05 * clamp(t / len)} />
      <g style={{ filter: 'drop-shadow(0 0 30px rgba(127,212,255,0.4))' }}>
        <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'worried']]), blink, glint: clamp(glint), glintColor: '#B4E9FF' }} rimId={t > 18 ? 'rimRed' : 'rimR'} shadow={0} />
      </g>
    </g>
  );
};

// ---------- S18: wide, low angle: the whole world mid-swap; he can't keep his eyes open ----------
export const S18: React.FC<ShotProps> = ({ t, len }) => {
  const pose = poseAt(t, [
    { f: 0, p: { x: 960, y: 830 - LEG_LEN * 1.02, scale: 1.02, yaw: 0, look: -0.2, legL: { a: 8, b: -8 }, legR: { a: -6, b: 4 }, armL: { a: 150, b: 116 }, armR: { a: 150, b: 116 } } },
    { f: 16, p: { headTilt: 6 } },
  ]);
  const normal: Pose = { ...basePose, x: 960, y: 830 - LEG_LEN * 1.02, scale: 1.02, yaw: 0, legL: { a: 8, b: -8 }, legR: { a: -6, b: 4 }, armL: { a: 150, b: 116 }, armR: { a: 150, b: 116 } };
  return (
    <g transform={camT(960, kf(t, [[0, 500], [len, 470]]), kf(t, [[0, 1.02], [len, 1.18]]))}>
      <g transform="translate(0 -8)"><Rooftop t={t + 660} sunX={1120} sunY={540} red={1} cityLit={2.6} low={90} /></g>
      <Hero look={PIP} pose={{ ...pose, ...faceAt(t, [[0, 'worried'], [16, 'shock']]), blink: 1 }} rimId="rimRed" shadow={0} />
      {t >= 20 && <g opacity={0.16}><Hero look={PIP} pose={{ ...normal, armL: { a: 130, b: 100 } }} rimId="rimRed" shadow={0} /></g>}
      <SwapRing x={430} y={330} r={200} t={t} period={7} />
      <SwapRing x={1490} y={520} r={230} t={t + 2} period={7} />
      <SwapRing x={960} y={210} r={150} t={t + 4} period={7} />
      <Foreground blur={10}>
        <path d="M 0 1080 L 180 860 L 120 1080 Z" fill="#12080E" />
      </Foreground>
    </g>
  );
};

// ---------- S19: close-up: half-lit face, the eyelids sliding down, the world still flickering ----------
export const S19: React.FC<ShotProps> = ({ t, len }) => {
  const sc = 3.5 * (1 + 0.02 * clamp(t / len));
  const pose: Pose = { ...basePose, x: 840, y: 600 - HEAD.y * sc, scale: sc, yaw: 0.4, look: 0.5, armL: { a: 14, b: -6 }, armR: { a: 14, b: -6 }, headTilt: kf(t, [[0, 0], [30, -6]]), ...faceAt(t, [[0, 'tired']]) };
  const blink = kf(t, [[0, 0.35], [26, 0.5], [54, 0.75], [len, 0.8]]);
  const echo = Math.floor(t / 4) % 2 === 0;
  return (
    <g>
      <g filter="url(#blur16)">
        <g transform="translate(-260 -70) scale(1.9)">
          <Rooftop t={t + 760} sunX={1040} sunY={600} red={0.4} low={220} cityLit={2.0} />
        </g>
      </g>
      <rect x={0} y={0} width={1920} height={1080} fill="#07040C" opacity={0.28} />
      {echo && (
        <g opacity={0.18} transform="translate(7 -5)">
          <Hero look={PIP} pose={{ ...pose, armL: { a: 30, b: 20 }, armR: { a: 30, b: 20 } }} rimId="rimR" shadow={0} />
        </g>
      )}
      <Hero look={PIP} pose={{ ...pose, blink }} rimId="rimL" shadow={0} />
      <Foreground blur={10}>
        <path d="M 1560 1080 Q 1620 860 1540 700 L 1700 1080 Z" fill="#0E1610" />
      </Foreground>
    </g>
  );
};

// helpers used by S14/S15
function thresholds(v: number, ks: number[]): number {
  let c = 0;
  for (const k of ks) if (v >= k) c++;
  return c;
}
function findStep(v: number, ks: number[]): number {
  for (const k of ks) if (Math.abs(v - k) < 0.5) return k;
  return -1;
}
