import React from 'react';
import { lerp, easeInOut } from './anim';

// The cast, drawn entirely in code: one rig, and a costume (a Look) per character. Every character is built
// once here, so they look identical in every shot: that's the "drawn, not guessed" point. Original
// characters only: never a channel's own hero or anything that resembles a famous cartoon character.

export const C = {
  skin: '#F6EFE3',
  skinShade: '#E2D3BE',
  ink: '#1D2033',
  jacket: '#F2B33D',
  jacketShade: '#D4922A',
  shoe: '#2FB7A6',
  orange: '#FF8A3D',
  limb: '#EFE2CC',
};

/** A costume for the rig: the same body and animation, different colours and one optional extra piece. */
export type Look = {
  skin: string;
  skinShade: string;
  hand: string;
  jacket: string;
  jacketShade: string;
  accent: string;
  limb: string;
  line: string;
  shoe: string;
  face: string;
  hair: string;
  extra?: 'hood' | 'curls' | 'bunches' | 'bob' | 'suit' | 'spiky' | 'cloak' | 'pony' | 'labcoat' | 'armor' | 'cap' | 'sage' | 'glitch' | 'echo' | 'titan' | 'chronos';
  legs?: string; // trousers, when they differ from the sleeves
  boots?: boolean; // the shoe colour runs up the shin
  glow?: string; // eyes always lit in this colour
};
export type CastName = 'pip' | 'pipHood' | 'pipInk' | 'mo' | 'sis' | 'mom' | 'suit' | 'stickman' | 'shadow' | 'lina' | 'zed' | 'promax' | 'timo' | 'zen' | 'glitch' | 'echo' | 'titan' | 'chronos';
/** The StickMan Academy cast, in the order of the channel's poster (Robo is his own little rig: <Robo>). */
export const ACADEMY: CastName[] = ['shadow', 'lina', 'zed', 'stickman', 'promax', 'timo', 'zen'];
/** The four new students: Glitch, Echo, Titan-0 (draw him at about 1.25 of the others' scale) and Chronos. */
export const ACADEMY_NEW: CastName[] = ['glitch', 'echo', 'titan', 'chronos'];
export const LOOKS: Record<CastName, Look> = {
  // A: Pip as built
  pip: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: C.jacket, jacketShade: C.jacketShade, accent: C.jacketShade, limb: C.limb, line: C.ink, shoe: C.shoe, face: C.ink, hair: C.ink },
  // B: Pip in a dark hoodie with mustard drawstrings: the body goes dark and catches the rim light, the head stays the brightest thing
  pipHood: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#2E2B3D', jacketShade: '#24212F', accent: C.jacket, limb: '#2E2B3D', line: '#121019', shoe: C.shoe, face: C.ink, hair: C.ink, extra: 'hood' },
  // C: a dark head with light features, the genre's high-contrast convention, in Pip's mustard
  pipInk: { skin: '#26232F', skinShade: '#1C1A24', hand: '#26232F', jacket: C.jacket, jacketShade: C.jacketShade, accent: C.jacketShade, limb: '#26232F', line: '#121019', shoe: C.shoe, face: '#F6EFE3', hair: '#26232F' },
  // Mo, Pip's friend: a second recurring character with his own costume (curly hair, headphones round his neck)
  mo: { skin: '#C98E68', skinShade: '#B07A58', hand: '#C98E68', jacket: '#5E6E46', jacketShade: '#4C5A38', accent: '#E9C46A', limb: '#3A3446', line: '#1A1622', shoe: '#D9534F', face: C.ink, hair: '#2A1C18', extra: 'curls' },
  // the formula's recurring cast (beats 5 and 6): Pip's little sister (draw her at about 0.7 of Pip's scale), his mum,
  // and the man in a suit who notices the power. All three are ours: plain shapes, no famous silhouettes.
  sis: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#3E8C86', jacketShade: '#2F6E69', accent: '#F28C6A', limb: '#3A3446', line: '#14121C', shoe: '#F28C6A', face: C.ink, hair: '#3A2620', extra: 'bunches' },
  mom: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#8A5A6A', jacketShade: '#704858', accent: '#E9C46A', limb: '#3A3446', line: '#14121C', shoe: '#5A4A6A', face: C.ink, hair: '#5A3226', extra: 'bob' },
  suit: { skin: '#D9C6AE', skinShade: '#C2AE96', hand: '#D9C6AE', jacket: '#2B2F3A', jacketShade: '#20232C', accent: '#A8323E', limb: '#2B2F3A', line: '#0E0F14', shoe: '#14151A', face: C.ink, hair: '#17141A', extra: 'suit' },
  // StickMan Academy. StickMan, the hero: a white head, a black body, spiky hair, a red cape and scarf, red gloves
  stickman: { skin: '#FFFFFF', skinShade: '#E4E6EE', hand: '#E0262E', jacket: '#1C1D24', jacketShade: '#111218', accent: '#E0262E', limb: '#1C1D24', line: '#08080C', shoe: '#1C1D24', face: '#101018', hair: '#101018', extra: 'spiky' },
  // Shadow: a hooded cloak, a face lost in the dark, two violet eyes
  shadow: { skin: '#15111F', skinShade: '#0E0B16', hand: '#2A2238', jacket: '#231B33', jacketShade: '#171124', accent: '#9B4DFF', limb: '#2A2238', line: '#07050C', shoe: '#1A1426', face: '#E2C4FF', hair: '#15111F', extra: 'cloak', glow: '#B46CFF' },
  // Lina: a long brown ponytail, a pink and white top, a pink scarf, black leggings, pink boots
  lina: { skin: '#FFFFFF', skinShade: '#ECE4EA', hand: '#FFFFFF', jacket: '#F6F2F6', jacketShade: '#E07AAE', accent: '#EC5A9E', limb: '#1E1D26', line: '#14121C', shoe: '#EC5A9E', face: '#2A1A1C', hair: '#8E4E2C', extra: 'pony', legs: '#1E1D26', boots: true },
  // Dr. Zed: bald, round glasses, a white lab coat over a navy shirt
  zed: { skin: '#FFFFFF', skinShade: '#E4E6EE', hand: '#FFFFFF', jacket: '#F4F6F8', jacketShade: '#D6DCE4', accent: '#2E4A8A', limb: '#F4F6F8', line: '#14182A', shoe: '#2A2E3E', face: '#14182A', hair: '#14182A', extra: 'labcoat', legs: '#2E3550' },
  // ProMax: shades, a quiff, a black suit of armour picked out in gold
  promax: { skin: '#FFFFFF', skinShade: '#E4E6EE', hand: '#24252C', jacket: '#1A1B21', jacketShade: '#0F1015', accent: '#E8B230', limb: '#1A1B21', line: '#07070A', shoe: '#E8B230', face: '#101018', hair: '#101018', extra: 'armor', boots: true },
  // Timo: a green cap and a green backpack, always game
  timo: { skin: '#FFFFFF', skinShade: '#E4E6EE', hand: '#FFFFFF', jacket: '#1F2027', jacketShade: '#14151B', accent: '#3FAE3F', limb: '#1F2027', line: '#0A0A0E', shoe: '#3FAE3F', face: '#101018', hair: '#101018', extra: 'cap' },
  // Master Zen: a straw hat, a long white beard, a grey robe and a staff
  // Glitch: a half-drawn stickman in broken neon: the head is a dark screen, every line glows green, pixels fall off him
  glitch: { skin: '#0B1A12', skinShade: '#08140E', hand: '#0B1A12', jacket: '#0F2418', jacketShade: '#0A1A11', accent: '#39FF7A', limb: '#0F2418', line: '#39FF7A', shoe: '#0F2418', face: '#39FF7A', hair: '#0B1A12', extra: 'glitch' },
  // Echo: huge glowing cyan headphones, sound-wave rings round her wrists, a cyan streak in dark hair
  echo: { skin: '#FFFFFF', skinShade: '#E6EAF2', hand: '#FFFFFF', jacket: '#232848', jacketShade: '#181C36', accent: '#2FE0FF', limb: '#232848', line: '#0B0D1C', shoe: '#2FE0FF', face: '#121428', hair: '#2E2246', extra: 'echo' },
  // Titan-0: the academy's guard: a broad metal body, one orange camera eye, a tiny coffee cup
  titan: { skin: '#9AA3AE', skinShade: '#7D8692', hand: '#8A939E', jacket: '#7A838F', jacketShade: '#606873', accent: '#FF8A1E', limb: '#7A838F', line: '#1A1D22', shoe: '#4A5058', face: '#1A1D22', hair: '#1A1D22', extra: 'titan', boots: true },
  // Chronos: the exchange student out of time: a long copper coat, a glowing hourglass on his belt, hair that floats
  chronos: { skin: '#FFFFFF', skinShade: '#ECE6DE', hand: '#FFFFFF', jacket: '#B8703A', jacketShade: '#94562A', accent: '#FFC24A', limb: '#B8703A', line: '#1E140E', shoe: '#3A2418', face: '#1E140E', hair: '#8FB4C8', extra: 'chronos', legs: '#2E2A30', boots: true },
  zen: { skin: '#F2EEE6', skinShade: '#DDD6C8', hand: '#F2EEE6', jacket: '#7E786C', jacketShade: '#635E54', accent: '#6E4A2A', limb: '#7E786C', line: '#1E1A16', shoe: '#2E2A26', face: '#2A241E', hair: '#F4F2EE', extra: 'sage' },
};

// ---------- the hero ----------
/** Mitten hands: open (a palm and a thumb) or pointing (a fist with the index finger out). */
export type HandKind = 'open' | 'point';
export type Expr = 'neutral' | 'happy' | 'smug' | 'shock' | 'worried' | 'oops' | 'cool' | 'dizzy' | 'tired';
export type Limb = { a: number; b: number }; // a: upper segment angle, b: bend of the lower segment (degrees)
export type Pose = {
  x: number;
  y: number; // hip point
  scale: number;
  facing: 1 | -1;
  tilt: number; // torso lean around the hips, degrees, + leans screen-right
  spin: number; // whole-body rotation around the chest (tumbles)
  headTilt: number;
  armL: Limb;
  armR: Limb;
  legL: Limb;
  legR: Limb;
  expr: Expr;
  blink: number; // 0 open, 1 shut
  look: number; // -1..1 eye offset
  glasses: number; // 0..1
  yaw: number; // -1 profile facing screen-left, 0 front, 1 profile facing screen-right
  squash: number; // + squashes (landing), - stretches (jump), about the feet
  handL: HandKind;
  handR: HandKind;
  sway: number; // secondary motion: how far loose things (the hood's drawstrings) swing, degrees-ish
  glint?: number; // 0..1 the eyes light up in the power's colour (set it after poseAt: it isn't interpolated)
  glintColor?: string;
};

export const basePose: Pose = {
  x: 960,
  y: 700,
  scale: 1,
  facing: 1,
  tilt: 0,
  spin: 0,
  headTilt: 0,
  armL: { a: 10, b: -8 },
  armR: { a: 10, b: -8 },
  legL: { a: 5, b: 0 },
  legR: { a: -5, b: 0 },
  expr: 'neutral',
  blink: 0,
  look: 0,
  glasses: 0,
  yaw: 0,
  squash: 0,
  handL: 'open',
  handR: 'open',
  sway: 0,
};

type Key = { f: number; p: Partial<Pose>; ease?: (t: number) => number };

const mixLimb = (a: Limb, b: Limb, t: number): Limb => ({ a: lerp(a.a, b.a, t), b: lerp(a.b, b.b, t) });

/** Interpolates every numeric part of a pose between keys; the face swaps (never morphs) at its key. */
export const poseAt = (f: number, keys: Key[], from: Pose = basePose): Pose => {
  // resolve each key into a full pose, carrying values forward
  const full: { f: number; p: Pose; ease?: (t: number) => number }[] = [];
  let cur = from;
  for (const k of keys) {
    cur = { ...cur, ...k.p };
    full.push({ f: k.f, p: cur, ease: k.ease });
  }
  if (f <= full[0].f) return full[0].p;
  for (let i = 0; i < full.length - 1; i++) {
    const A = full[i];
    const B = full[i + 1];
    if (f <= B.f) {
      const t = (B.ease ?? easeInOut)((f - A.f) / Math.max(1e-6, B.f - A.f));
      return {
        x: lerp(A.p.x, B.p.x, t),
        y: lerp(A.p.y, B.p.y, t),
        scale: lerp(A.p.scale, B.p.scale, t),
        facing: t < 0.5 ? A.p.facing : B.p.facing,
        tilt: lerp(A.p.tilt, B.p.tilt, t),
        spin: lerp(A.p.spin, B.p.spin, t),
        headTilt: lerp(A.p.headTilt, B.p.headTilt, t),
        armL: mixLimb(A.p.armL, B.p.armL, t),
        armR: mixLimb(A.p.armR, B.p.armR, t),
        legL: mixLimb(A.p.legL, B.p.legL, t),
        legR: mixLimb(A.p.legR, B.p.legR, t),
        expr: A.p.expr, // a face swaps when its own key lands, so hold the earlier one
        handL: A.p.handL,
        handR: A.p.handR,
        blink: lerp(A.p.blink, B.p.blink, t),
        look: lerp(A.p.look, B.p.look, t),
        glasses: lerp(A.p.glasses, B.p.glasses, t),
        yaw: lerp(A.p.yaw, B.p.yaw, t),
        squash: lerp(A.p.squash, B.p.squash, t),
        sway: lerp(A.p.sway, B.p.sway, t),
      };
    }
  }
  return full[full.length - 1].p;
};

// body measurements (local space: hips at 0,0, y down)
const UPPER_ARM = 62;
const FORE_ARM = 58;
const THIGH = 72;
const SHIN = 68;
const SHOULDER = { x: 42, y: -108 };
const HIP = { x: 17, y: 0 };
export const HEAD = { x: 0, y: -176, r: 62 };
export const LEG_LEN = THIGH + SHIN;

const rad = (d: number) => (d * Math.PI) / 180;
type P = { x: number; y: number };
const rot = (p: P, deg: number, c: P = { x: 0, y: 0 }): P => {
  const r = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
};

/** Joint positions in local space (before the hip translate/scale), so scenes can attach props to hands. */
export const joints = (pose: Pose) => {
  const side = (s: 1 | -1, limb: Limb, root: P, l1: number, l2: number, isLeg: boolean) => {
    // arms swing outward (away from the body) on their own side; legs swing forward in the facing direction
    const dir = isLeg ? pose.facing : s;
    const d1 = { x: dir * Math.sin(rad(limb.a)), y: Math.cos(rad(limb.a)) };
    const mid = { x: root.x + d1.x * l1, y: root.y + d1.y * l1 };
    const a2 = limb.a + limb.b;
    const d2 = { x: dir * Math.sin(rad(a2)), y: Math.cos(rad(a2)) };
    return { root, mid, end: { x: mid.x + d2.x * l2, y: mid.y + d2.y * l2 } };
  };
  const torsoRot = (p: P) => rot(p, pose.tilt);
  const sp = limbSpread(pose.yaw);
  const shL = { x: -SHOULDER.x * sp + pose.yaw * 6, y: SHOULDER.y };
  const shR = { x: SHOULDER.x * sp + pose.yaw * 6, y: SHOULDER.y };
  const armL = side(-1, pose.armL, shL, UPPER_ARM, FORE_ARM, false);
  const armR = side(1, pose.armR, shR, UPPER_ARM, FORE_ARM, false);
  const legL = side(-1, pose.legL, { x: -HIP.x * sp, y: 0 }, THIGH, SHIN, true);
  const legR = side(1, pose.legR, { x: HIP.x * sp, y: 0 }, THIGH, SHIN, true);
  const r = (o: { root: P; mid: P; end: P }) => ({ root: torsoRot(o.root), mid: torsoRot(o.mid), end: torsoRot(o.end) });
  return { armL: r(armL), armR: r(armR), legL, legR, head: torsoRot(HEAD) };
};

/** How wide the body reads as it turns: full width face-on, about 60% in profile. */
export const turnWidth = (yaw: number) => 1 - 0.4 * Math.min(1, Math.abs(yaw));
/** Shoulders and hips close up as he turns, so in profile the limbs overlap the body. */
export const limbSpread = (yaw: number) => 1 - 0.85 * Math.min(1, Math.abs(yaw));

/** Face swaps happen through a blink: two frames shut either side of each change, as in the genre. */
export const faceAt = (f: number, keys: [number, Expr][]): { expr: Expr; blink: number } => {
  let expr = keys[0][1];
  let blink = 0;
  for (let i = 0; i < keys.length; i++) {
    const [k, e] = keys[i];
    if (f >= k) expr = e;
    if (i > 0 && f >= k - 2 && f < k + 1) blink = 1;
  }
  return { expr, blink };
};

/** A local point to world space, for attaching props (the mug in Pip's hand). */
export const toWorld = (pose: Pose, p: P): P => {
  const spun = rot(p, pose.spin, { x: 0, y: -90 });
  return { x: pose.x + spun.x * pose.scale, y: pose.y + spun.y * pose.scale };
};

/** Straight-arm reach: the right arm angle (local) that points the hand at a world target. */
export const reachAngle = (pose: Pose, target: P) => {
  const sh = toWorld(pose, rot({ x: SHOULDER.x * limbSpread(pose.yaw) + pose.yaw * 6, y: SHOULDER.y }, pose.tilt));
  const world = (Math.atan2(target.x - sh.x, target.y - sh.y) * 180) / Math.PI; // 0 = straight down
  return world - pose.tilt;
};

const Face: React.FC<{ expr: Expr; blink: number; look: number; glasses: number; yaw?: number; ink?: string; glint?: number; glintColor?: string; lashes?: boolean; specs?: boolean }> = ({ expr, blink, look, glasses, yaw = 0, ink = C.ink, glint = 0, glintColor = '#8FF0FF', lashes = false, specs = false }) => {
  const ex = look * 7;
  const ay = Math.min(1, Math.abs(yaw));
  const farHidden = ay > 0.72;
  const farSide = yaw > 0 ? -1 : 1; // facing screen-right hides the screen-left eye
  const eyeY = HEAD.y - 4;
  // heavy lids: half shut when smug or cool, more than half when tired (with dark rings under the eyes)
  const lid = expr === 'smug' || expr === 'cool' ? 0.45 : expr === 'tired' ? 0.58 : 0;
  const open = Math.max(0.08, 1 - Math.max(blink, lid));
  const eye = (cx: number) => {
    if (farHidden && Math.sign(cx) === farSide) return null;
    if (expr === 'happy') return <path d={`M ${cx - 10} ${eyeY + 3} Q ${cx} ${eyeY - 9} ${cx + 10} ${eyeY + 3}`} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
    if (expr === 'oops') return <path d={`M ${cx - 9} ${eyeY - 6} L ${cx + 4} ${eyeY} L ${cx - 9} ${eyeY + 6}`} transform={cx > 0 ? `translate(${2 * cx},0) scale(-1,1)` : undefined} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    if (expr === 'dizzy') return <g stroke={ink} strokeWidth={5} strokeLinecap="round"><path d={`M ${cx - 7} ${eyeY - 7} L ${cx + 7} ${eyeY + 7} M ${cx + 7} ${eyeY - 7} L ${cx - 7} ${eyeY + 7}`} /></g>;
    // shut (a blink's middle frame, or asleep): the closed lid's curve, with the tired rings kept
    if (blink >= 0.95)
      return (
        <g>
          <path d={`M ${cx - 12} ${eyeY + 1} Q ${cx} ${eyeY + 8} ${cx + 12} ${eyeY + 1}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          {expr === 'tired' ? <path d={`M ${cx - 12} ${eyeY + 15} Q ${cx} ${eyeY + 22} ${cx + 12} ${eyeY + 15}`} stroke="#8C7AA6" strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={0.85} /> : null}
        </g>
      );
    const big = expr === 'shock';
    const rx = big ? 11 : 7;
    const ry = (big ? 13 : 10) * open;
    return (
      <g>
        <ellipse cx={cx + ex} cy={eyeY + (lid ? 3 : 0)} rx={rx} ry={ry} fill={ink} />
        {big && open > 0.5 ? <circle cx={cx + ex + 3.5} cy={eyeY - 4} r={3.4} fill="#fff" /> : null}
        {lid ? <path d={expr === 'tired' ? `M ${cx - 13} ${eyeY - 1} Q ${cx} ${eyeY - 5} ${cx + 13} ${eyeY - 1}` : `M ${cx - 12} ${eyeY - 4} L ${cx + 12} ${eyeY - 2}`} stroke={ink} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
        {expr === 'tired' ? <path d={`M ${cx - 12} ${eyeY + 14} Q ${cx} ${eyeY + 21} ${cx + 12} ${eyeY + 14}`} stroke="#8C7AA6" strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={0.85} /> : null}
      </g>
    );
  };
  const brows: Record<Expr, string> = {
    neutral: '',
    happy: '',
    smug: `M -34 ${eyeY - 22} L -12 ${eyeY - 20} M 12 ${eyeY - 26} L 34 ${eyeY - 30}`,
    shock: `M -32 ${eyeY - 28} Q -21 ${eyeY - 36} -10 ${eyeY - 29} M 10 ${eyeY - 29} Q 21 ${eyeY - 36} 32 ${eyeY - 28}`,
    worried: `M -32 ${eyeY - 18} L -12 ${eyeY - 26} M 12 ${eyeY - 26} L 32 ${eyeY - 18}`,
    oops: `M -32 ${eyeY - 20} L -12 ${eyeY - 16} M 12 ${eyeY - 16} L 32 ${eyeY - 20}`,
    cool: '',
    dizzy: '',
    tired: `M -33 ${eyeY - 17} Q -22 ${eyeY - 21} -11 ${eyeY - 19} M 11 ${eyeY - 19} Q 22 ${eyeY - 21} 33 ${eyeY - 17}`,
  };
  const mY = HEAD.y + 28;
  const mouth: Record<Expr, React.ReactNode> = {
    neutral: <path d={`M -10 ${mY} Q 0 ${mY + 4} 10 ${mY}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    happy: <path d={`M -18 ${mY - 4} Q 0 ${mY + 20} 18 ${mY - 4} Z`} fill={ink} />,
    smug: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    shock: <ellipse cx={0} cy={mY + 4} rx={10} ry={14} fill={ink} />,
    worried: <path d={`M -16 ${mY + 4} Q -8 ${mY - 4} 0 ${mY + 4} Q 8 ${mY + 12} 16 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    oops: <g><rect x={-18} y={mY - 6} width={36} height={16} rx={6} fill={ink} /><path d={`M -14 ${mY + 2} L 14 ${mY + 2}`} stroke="#fff" strokeWidth={3} /></g>,
    cool: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    dizzy: <path d={`M -14 ${mY + 4} Q -7 ${mY - 4} 0 ${mY + 4} Q 7 ${mY + 12} 14 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    tired: <path d={`M -11 ${mY + 4} Q 0 ${mY} 11 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
  };
  return (
    <g transform={`translate(${yaw * 30} 0) scale(${1 - 0.28 * ay} 1)`}>
      {eye(-21)}
      {eye(21)}
      {/* lashes: two flicks at the outer corner of each eye */}
      {lashes && blink < 0.95 && expr !== 'happy' && expr !== 'oops' && expr !== 'dizzy'
        ? [-21, 21].map((cx) =>
            farHidden && Math.sign(cx) === farSide ? null : (
              <path key={`la${cx}`} d={`M ${cx + Math.sign(cx) * 6 + ex} ${eyeY - 7} l ${Math.sign(cx) * 10} -7 M ${cx + Math.sign(cx) * 8 + ex} ${eyeY - 2} l ${Math.sign(cx) * 11} -2`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
            ),
          )
        : null}
      {/* round specs, always on: thin rims, a pale blue lens, a bridge */}
      {specs ? (
        <g>
          {[-21, 21].map((cx) => (farHidden && Math.sign(cx) === farSide ? null : <circle key={`sp${cx}`} cx={cx} cy={eyeY} r={19} fill="#BFE6FF" fillOpacity={0.35} stroke={ink} strokeWidth={5} />))}
          <path d={`M -3 ${eyeY - 2} Q 0 ${eyeY - 7} 3 ${eyeY - 2} M -40 ${eyeY - 4} L -58 ${eyeY - 8} M 40 ${eyeY - 4} L 58 ${eyeY - 8}`} stroke={ink} strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={`M -30 ${eyeY - 10} l 6 -5 M 12 ${eyeY - 10} l 6 -5`} stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
        </g>
      ) : null}
      {brows[expr] ? <path d={brows[expr]} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" /> : null}
      {mouth[expr]}
      {expr === 'shock' || expr === 'oops' ? <path d={`M 52 ${HEAD.y - 30} q 6 10 0 16 q -6 -6 0 -16 Z`} fill="#8FD3FF" /> : null}
      {/* a power lighting the eyes: a soft halo, a bright iris, a white catchlight (none while the lids are shut) */}
      {glint > 0.01 && blink < 0.95
        ? [-21, 21].map((cx) =>
            farHidden && Math.sign(cx) === farSide ? null : (
              <g key={`gl${cx}`} opacity={Math.min(1, glint)}>
                <circle cx={cx + ex} cy={eyeY} r={17} fill={glintColor} opacity={0.2} />
                <circle cx={cx + ex} cy={eyeY} r={12} fill={glintColor} opacity={0.28} />
                <ellipse cx={cx + ex} cy={eyeY + (lid ? 3 : 0)} rx={8} ry={Math.max(2, 11 * open)} fill={glintColor} />
                <circle cx={cx + ex + 2.5} cy={eyeY - 3} r={2.6} fill="#FFFFFF" />
              </g>
            ),
          )
        : null}
      {glasses > 0.01 ? (
        <g opacity={glasses} transform={`translate(0 ${(1 - glasses) * -60})`}>
          {/* classic shades: a full bar across, two big lenses, one bright glint so it reads at feed size */}
          <path d={`M -58 ${eyeY - 12} L 58 ${eyeY - 12}`} stroke={ink} strokeWidth={6} strokeLinecap="round" />
          <path d={`M -50 ${eyeY - 14} L -6 ${eyeY - 14} L -10 ${eyeY + 8} Q -28 ${eyeY + 18} -46 ${eyeY + 8} Z`} fill="#0D0F1C" stroke={ink} strokeWidth={3} />
          <path d={`M 6 ${eyeY - 14} L 50 ${eyeY - 14} L 46 ${eyeY + 8} Q 28 ${eyeY + 18} 10 ${eyeY + 8} Z`} fill="#0D0F1C" stroke={ink} strokeWidth={3} />
          <path d={`M -40 ${eyeY + 2} L -26 ${eyeY - 10} M 16 ${eyeY + 2} L 30 ${eyeY - 10}`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
        </g>
      ) : null}
    </g>
  );
};

type Piece = (L: Look, sw: number) => React.ReactNode;
const H = HEAD.y;

/** Behind the body, in torso space. */
const BACK: Partial<Record<NonNullable<Look['extra']>, Piece>> = {
  // a red cape off the shoulders, its hem trailing with the sway
  spiky: (L, sw) => (
    <g>
      <path d={`M -40 -114 Q -76 -20 ${-92 + sw} 116 Q ${-52 + sw} 98 ${-22 + sw} 128 Q ${16 + sw} 102 ${48 + sw} 124 Q ${68 + sw} 106 ${84 + sw} 118 Q 70 -20 40 -114 Z`} fill={L.accent} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M -20 -96 Q ${-40 + sw * 0.5} 10 ${-36 + sw} 112 M 22 -96 Q ${34 + sw * 0.5} 10 ${30 + sw} 110`} stroke="#9E1820" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
    </g>
  ),
  // the back of the cloak, down to the ankles with a ragged hem, inside a dark violet aura
  cloak: (L, sw) => (
    <g>
      <g filter="url(#blur6)" opacity={0.55}>
        <path d={`M -70 140 Q -150 40 ${-110 + sw} -120 Q -80 -60 -60 -200 Q -40 -270 ${10 + sw} -330 Q 20 -260 60 -230 Q 130 -160 ${120 + sw} -40 Q 150 60 80 140 Z`} fill="#6A2CD8" />
        <path d={`M -40 130 Q -100 30 ${-70 + sw} -110 Q -40 -180 ${0 + sw} -300 Q 40 -200 70 -150 Q 110 -40 50 130 Z`} fill="#9B4DFF" opacity={0.7} />
      </g>
    <path d={`M -48 -116 Q -96 -10 ${-104 + sw} 138 L ${-74 + sw} 124 L ${-52 + sw} 146 L ${-26 + sw} 128 L ${0 + sw} 148 L ${26 + sw} 128 L ${52 + sw} 146 L ${76 + sw} 124 L ${104 + sw} 138 Q 96 -10 48 -116 Z`} fill={L.jacketShade} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
    </g>
  ),
  // a green backpack, a little wider than the body
  cap: (L) => (
    <g>
      <rect x={-60} y={-106} width={120} height={100} rx={20} fill={L.accent} stroke={L.line} strokeWidth={4} />
      <rect x={-60} y={-106} width={120} height={22} rx={10} fill="#2E8A2E" />
    </g>
  ),
};

/** Over the torso, in torso space (scaled with the turn). */
const TORSO: Partial<Record<NonNullable<Look['extra']>, Piece>> = {
  // a red scarf: a knot at the neck and a tail that streams out to the side
  spiky: (L, sw) => (
    <g>
      <path d={`M 14 -112 Q ${46 + sw} -110 ${82 + sw * 1.4} -128 Q ${70 + sw} -100 ${86 + sw * 1.4} -82 Q ${46 + sw} -88 18 -98 Z`} fill={L.accent} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -36 -120 Q 0 -96 36 -120 L 34 -104 Q 0 -84 -34 -104 Z" fill={L.accent} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
    </g>
  ),
  // the open front of the cloak, a violet belt
  cloak: (L, sw) => (
    <g>
      <path d={`M -46 -112 L -40 2 Q ${-50 + sw * 0.5} 70 ${-62 + sw} 132 L ${-34 + sw} 122 Q -22 40 -16 -104 Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M 46 -112 L 40 2 Q ${50 + sw * 0.5} 70 ${62 + sw} 132 L ${34 + sw} 122 Q 22 40 16 -104 Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-40} y={-26} width={80} height={10} rx={3} fill={L.accent} />
      <rect x={-8} y={-29} width={16} height={16} rx={3} fill="#2A1640" stroke={L.accent} strokeWidth={3} />
    </g>
  ),
  // pink side panels on a white top, a pink scarf, black shorts
  pony: (L, sw) => (
    <g>
      <path d="M -46 -112 L -40 2 L -24 4 L -30 -110 Z M 46 -112 L 40 2 L 24 4 L 30 -110 Z" fill={L.accent} opacity={0.9} />
      <path d={`M -20 -108 Q ${-52 + sw} -86 ${-62 + sw * 1.3} -48 Q ${-40 + sw} -64 -12 -96 Z`} fill={L.accent} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -34 -122 Q 0 -98 34 -122 L 32 -106 Q 0 -86 -32 -106 Z" fill={L.accent} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <rect x={-40} y={-16} width={80} height={12} fill="#1E1D26" />
      {/* a glowing energy chevron on the chest */}
      <path d="M -14 -72 L 0 -60 L 14 -72 L 14 -62 L 0 -50 L -14 -62 Z" fill="#FF9AD8" stroke="#FFFFFF" strokeWidth={2} />
      <path d="M -14 -72 L 0 -60 L 14 -72 L 14 -62 L 0 -50 L -14 -62 Z" fill="#FF6AC0" opacity={0.5} filter="url(#blur3)" />
    </g>
  ),
  // a lab coat: a navy shirt and tie in the opening, long flaps over the thighs, a pocket and a pen
  labcoat: (L) => (
    <g>
      <path d="M -14 -116 L 14 -116 L 8 4 L -8 4 Z" fill={L.accent} />
      <path d="M -5 -110 L 5 -110 L 6 -60 L 0 -50 L -6 -60 Z" fill="#1A2440" />
      <path d="M -46 -112 L -50 74 L -6 74 L -10 -40 L -24 -116 Z" fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 46 -112 L 50 74 L 6 74 L 10 -40 L 24 -116 Z" fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -24 -116 L -10 -40 L -30 -76 Z M 24 -116 L 10 -40 L 30 -76 Z" fill={L.jacketShade} stroke={L.line} strokeWidth={3} strokeLinejoin="round" />
      <rect x={18} y={-70} width={20} height={16} rx={2} fill="none" stroke={L.jacketShade} strokeWidth={3} />
      <path d="M 24 -74 L 24 -58" stroke="#3A7BD5" strokeWidth={4} strokeLinecap="round" />
    </g>
  ),
  // armour: a gold-edged chest plate, ribbing, a belt, shoulder pads
  armor: (L) => (
    <g stroke={L.accent} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M -40 -104 Q 0 -66 40 -104" strokeWidth={5} />
      <path d="M -32 -60 L -8 -50 M 32 -60 L 8 -50 M -30 -40 L -8 -32 M 30 -40 L 8 -32" strokeWidth={4} />
      <rect x={-40} y={-20} width={80} height={11} rx={3} fill={L.accent} stroke="none" />
      <rect x={-9} y={-22} width={18} height={15} rx={3} fill="#2A2A30" strokeWidth={3} />
      <ellipse cx={-44} cy={-108} rx={16} ry={11} fill={L.jacket} strokeWidth={4} />
      <ellipse cx={44} cy={-108} rx={16} ry={11} fill={L.jacket} strokeWidth={4} />
    </g>
  ),
  // the backpack's straps
  cap: (L) => (
    <g>
      <path d="M -30 -116 Q -34 -70 -30 -24 M 30 -116 Q 34 -70 30 -24" stroke={L.line} strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d="M -30 -116 Q -34 -70 -30 -24 M 30 -116 Q 34 -70 30 -24" stroke={L.accent} strokeWidth={8} fill="none" strokeLinecap="round" />
    </g>
  ),
  // a long robe to the shins, a crossed collar and a cord belt
  sage: (L, sw) => (
    <g>
      <path d={`M -48 -112 Q -62 20 ${-72 + sw * 0.4} 118 L ${72 + sw * 0.4} 118 Q 62 20 48 -112 Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M 12 -110 Q 40 0 ${54 + sw * 0.4} 116`} stroke={L.jacketShade} strokeWidth={10} fill="none" opacity={0.7} />
      <path d="M -26 -116 L 10 -40 M 26 -116 L -2 -66" stroke="#B8B0A0" strokeWidth={8} strokeLinecap="round" />
      <rect x={-46} y={-34} width={92} height={10} rx={4} fill={L.accent} />
      <path d="M -8 -24 L -14 6 M 4 -24 L 8 4" stroke={L.accent} strokeWidth={5} strokeLinecap="round" />
    </g>
  ),
};

/** On the head, after the face. */
const HEADWEAR: Partial<Record<NonNullable<Look['extra']>, Piece>> = {
  // spiky hair swept up and back, one lock over the brow
  spiky: (L) => (
    <path
      d={`M -62 ${H - 4} L -90 ${H - 34} L -60 ${H - 46} L -84 ${H - 86} L -38 ${H - 72} L -40 ${H - 120} L -2 ${H - 80} L 18 ${H - 124} L 30 ${H - 76} L 72 ${H - 104} L 58 ${H - 54} L 94 ${H - 50} L 62 ${H - 10} Q 46 ${H - 50} 14 ${H - 44} L -2 ${H - 26} L -12 ${H - 46} Q -44 ${H - 44} -62 ${H - 4} Z`}
      fill={L.hair}
      stroke={L.line}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  ),
  // the hood's front edge, framing the face in shadow
  cloak: (L) => (
    <path d={`M -68 ${H + 44} Q -76 ${H - 74} 0 ${H - 80} Q 76 ${H - 74} 68 ${H + 44} Q 56 ${H - 28} 0 ${H - 40} Q -56 ${H - 28} -68 ${H + 44} Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
  ),
  // side-swept bangs and long locks down past the cheeks, a pink hair tie
  pony: (L) => (
    <g>
      <path d={`M -66 ${H + 56} Q -82 ${H - 70} 0 ${H - 72} Q 74 ${H - 70} 66 ${H + 40} Q 62 ${H - 6} 46 ${H - 34} Q 14 ${H - 22} -18 ${H - 48} Q -40 ${H - 24} -48 ${H + 4} Q -52 ${H + 34} -66 ${H + 56} Z`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={40} cy={H - 60} r={10} fill={L.accent} stroke={L.line} strokeWidth={3} />
    </g>
  ),
  // a swept quiff
  armor: (L) => (
    <path d={`M -60 ${H - 20} Q -66 ${H - 74} 0 ${H - 76} Q 44 ${H - 102} 84 ${H - 80} Q 62 ${H - 70} 62 ${H - 28} Q 40 ${H - 54} 0 ${H - 50} Q -40 ${H - 48} -60 ${H - 20} Z`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
  ),
  // a green cap, the peak turned to the side
  cap: (L) => (
    <g>
      <path d={`M -66 ${H - 12} Q -68 ${H - 84} 0 ${H - 84} Q 68 ${H - 84} 66 ${H - 12} Q 0 ${H - 38} -66 ${H - 12} Z`} fill={L.accent} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M 22 ${H - 28} Q 86 ${H - 48} 118 ${H - 22} Q 86 ${H - 4} 30 ${H - 14} Z`} fill="#2E8A2E" stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={0} cy={H - 84} r={6} fill="#2E8A2E" stroke={L.line} strokeWidth={3} />
      <circle cx={-22} cy={H - 52} r={11} fill="#FFFFFF" stroke={L.line} strokeWidth={2.5} />
    </g>
  ),
  // white brows, a moustache, a long beard, a wide straw hat
  sage: (L) => (
    <g>
      <path d={`M -38 ${H - 18} Q -22 ${H - 30} -8 ${H - 20} M 8 ${H - 20} Q 22 ${H - 30} 38 ${H - 18}`} stroke={L.hair} strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d={`M -44 ${H + 14} Q -50 ${H + 84} -12 ${H + 132} L 0 ${H + 156} L 12 ${H + 132} Q 50 ${H + 84} 44 ${H + 14} Q 22 ${H + 44} 0 ${H + 40} Q -22 ${H + 44} -44 ${H + 14} Z`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M 0 ${H + 20} Q -26 ${H + 12} -48 ${H + 36} Q -22 ${H + 30} 0 ${H + 30} Q 22 ${H + 30} 48 ${H + 36} Q 26 ${H + 12} 0 ${H + 20} Z`} fill={L.hair} stroke={L.line} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={`M -136 ${H - 30} Q 0 ${H - 50} 136 ${H - 30} L 8 ${H - 128} Q 0 ${H - 132} -8 ${H - 128} Z`} fill="#D9B56C" stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M -136 ${H - 30} Q 0 ${H - 50} 136 ${H - 30} Q 0 ${H - 20} -136 ${H - 30} Z`} fill="#B8924E" stroke={L.line} strokeWidth={3} />
      <path d={`M -90 ${H - 44} L -4 ${H - 124} M -40 ${H - 46} L 0 ${H - 126} M 40 ${H - 46} L 0 ${H - 126} M 90 ${H - 44} L 4 ${H - 124}`} stroke="#A8823E" strokeWidth={3} opacity={0.8} />
    </g>
  ),
};

type Joints = ReturnType<typeof joints>;

/** At the hands, drawn after the near arm: StickMan's energy gloves, Echo's sound rings, Titan's tiny cup. */
const HANDS: Partial<Record<NonNullable<Look['extra']>, (L: Look, j: Joints) => React.ReactNode>> = {
  spiky: (L, j) => (
    <g>
      {[j.armL.end, j.armR.end].map((e, k) => (
        <g key={k}>
          <circle cx={e.x} cy={e.y + 8} r={30} fill="#FF4A3A" opacity={0.28} filter="url(#blur6)" />
          <circle cx={e.x} cy={e.y + 8} r={6} fill="#FFD0A0" opacity={0.9} />
        </g>
      ))}
    </g>
  ),
  echo: (L, j) => (
    <g fill="none" stroke={L.accent} strokeLinecap="round">
      {[j.armL, j.armR].map((a, k) => {
        const w = { x: a.mid.x + (a.end.x - a.mid.x) * 0.8, y: a.mid.y + (a.end.y - a.mid.y) * 0.8 };
        const ang = (Math.atan2(a.end.y - a.mid.y, a.end.x - a.mid.x) * 180) / Math.PI;
        return (
          <g key={k} transform={`translate(${w.x} ${w.y}) rotate(${ang + 90})`}>
            <ellipse rx={13} ry={5} strokeWidth={4} />
            <ellipse rx={22} ry={8} strokeWidth={3} opacity={0.6} />
            <ellipse rx={31} ry={11} strokeWidth={2} opacity={0.3} />
          </g>
        );
      })}
    </g>
  ),
  titan: (L, j) => {
    const e = j.armR.end;
    return (
      <g transform={`translate(${e.x + 4} ${e.y + 2})`}>
        <path d="M -9 -14 L 9 -14 L 7 6 L -7 6 Z" fill="#FFFFFF" stroke={L.line} strokeWidth={3} strokeLinejoin="round" />
        <path d="M 9 -10 q 8 0 8 6 q 0 6 -8 6" stroke={L.line} strokeWidth={3} fill="none" />
        <rect x={-9} y={-9} width={18} height={5} fill={L.accent} />
        <path d="M -3 -20 q -4 -6 0 -12 M 4 -20 q -4 -6 0 -12" stroke="#FFFFFF" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7} />
      </g>
    );
  },
};

/** Titan-0's face: one orange camera lens. The lid comes down when he's bored (tired, smug, cool), opens wide in shock. */
const Lens: React.FC<{ expr: Expr; look: number; yaw: number; blink: number }> = ({ expr, look, yaw, blink }) => {
  const cx = yaw * 30;
  const cy = HEAD.y - 4;
  const lid = blink >= 0.95 ? 1 : expr === 'tired' ? 0.55 : expr === 'smug' || expr === 'cool' ? 0.4 : 0;
  const r = expr === 'shock' ? 30 : 25;
  return (
    <g>
      <rect x={cx - 52} y={cy - 22} width={104} height={44} rx={22} fill="#2A2E36" stroke="#1A1D22" strokeWidth={4} />
      <circle cx={cx} cy={cy} r={r + 10} fill="#FF8A1E" opacity={0.25} filter="url(#blur6)" />
      <circle cx={cx} cy={cy} r={r} fill="#14161A" stroke="#FF8A1E" strokeWidth={5} />
      <circle cx={cx + look * 7} cy={cy} r={r * 0.5} fill="#FF8A1E" />
      <circle cx={cx + look * 7 - 5} cy={cy - 5} r={4} fill="#FFFFFF" />
      {lid > 0 ? <path d={`M ${cx - r - 4} ${cy - r - 4} L ${cx + r + 4} ${cy - r - 4} L ${cx + r + 4} ${cy - r + 2 * r * lid} Q ${cx} ${cy - r + 2 * r * lid + 6} ${cx - r - 4} ${cy - r + 2 * r * lid} Z`} fill="#9AA3AE" stroke="#1A1D22" strokeWidth={3} /> : null}
      {/* a speaker grille for a mouth */}
      <path d={`M ${cx - 16} ${HEAD.y + 34} L ${cx + 16} ${HEAD.y + 34} M ${cx - 12} ${HEAD.y + 42} L ${cx + 12} ${HEAD.y + 42}`} stroke="#1A1D22" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

/** Behind the body, for the new students. */
Object.assign(BACK, {
  // pixels falling off Glitch's right side, and a line of code drifting away
  glitch: (L: Look) => (
    <g>
      {[
        [56, -96, 12], [70, -80, 9], [62, -60, 14], [84, -66, 8], [96, -90, 6], [76, -40, 10], [104, -52, 7], [-62, -30, 9], [-74, -48, 6],
      ].map(([x, y, w], i) => (
        <rect key={i} x={x} y={y} width={w} height={w} fill={L.accent} opacity={0.85 - i * 0.06} />
      ))}
    </g>
  ),
  // Chronos's coat tails, falling to the knees behind him
  chronos: (L: Look, sw: number) => (
    <path d={`M -46 -110 Q -66 0 ${-70 + sw} 96 L ${70 + sw} 96 Q 66 0 46 -110 Z`} fill={L.jacketShade} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
  ),
});

/** Over the torso, for the new students. */
Object.assign(TORSO, {
  // a dark body with its outline broken: a slice shifted out, neon scan lines
  glitch: (L: Look) => (
    <g>
      <path d="M -46 -64 L 46 -64 L 46 -52 L -46 -52 Z" fill={L.jacket} />
      <path d="M -40 -64 L 52 -64 L 52 -52 L -40 -52" stroke={L.accent} strokeWidth={3} fill="none" />
      {[-96, -84, -40, -28, -16].map((y) => (
        <path key={y} d={`M -38 ${y} L 38 ${y}`} stroke={L.accent} strokeWidth={1.5} opacity={0.35} />
      ))}
      <text x={0} y={-24} textAnchor="middle" fontFamily="Fragment Mono" fontSize={14} fill={L.accent}>{'</>'}</text>
    </g>
  ),
  // equaliser bars on the chest
  echo: (L: Look) => (
    <g>
      {[-24, -12, 0, 12, 24].map((x, i) => {
        const h = [14, 26, 36, 22, 12][i];
        return <rect key={x} x={x - 4} y={-58 - h / 2} width={8} height={h} rx={3} fill={L.accent} />;
      })}
      <path d="M -22 -118 Q 0 -100 22 -118" stroke={L.accent} strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  ),
  // a broad chest plate and huge shoulder plates, wider than the body, with rivets and an orange status light
  titan: (L: Look) => (
    <g>
      <path d="M -88 -130 Q -96 -96 -72 -80 L -40 -84 L -40 -126 Z M 88 -130 Q 96 -96 72 -80 L 40 -84 L 40 -126 Z" fill={L.skin} stroke={L.line} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -60 -126 Q 0 -140 60 -126 L 52 -40 Q 0 -28 -52 -40 Z" fill={L.skinShade} stroke={L.line} strokeWidth={5} strokeLinejoin="round" />
      {[-70, 70, -40, 40].map((x, i) => (
        <circle key={i} cx={x} cy={i < 2 ? -112 : -50} r={4} fill={L.line} />
      ))}
      <circle cx={0} cy={-84} r={9} fill={L.accent} stroke={L.line} strokeWidth={3} />
      <circle cx={0} cy={-84} r={18} fill={L.accent} opacity={0.3} filter="url(#blur3)" />
      <rect x={-44} y={-18} width={88} height={14} rx={4} fill="#4A5058" stroke={L.line} strokeWidth={3} />
    </g>
  ),
  // the copper coat front: lapels, brass buttons, a belt with a glowing hourglass
  chronos: (L: Look) => (
    <g>
      <path d="M -10 -116 L 10 -116 L 6 4 L -6 4 Z" fill="#E8DCCB" />
      <path d="M -46 -112 L -52 92 L -8 92 L -10 -30 L -24 -116 Z M 46 -112 L 52 92 L 8 92 L 10 -30 L 24 -116 Z" fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -24 -116 L -10 -30 L -32 -72 Z M 24 -116 L 10 -30 L 32 -72 Z" fill={L.jacketShade} stroke={L.line} strokeWidth={3} strokeLinejoin="round" />
      {[-90, -66, -42].map((y) => (
        <circle key={y} cx={-16} cy={y} r={4} fill="#E8B230" stroke={L.line} strokeWidth={2} />
      ))}
      <rect x={-48} y={-14} width={96} height={12} rx={3} fill="#4A2A18" stroke={L.line} strokeWidth={3} />
      {/* the hourglass, hanging at the hip and glowing */}
      <g transform="translate(30 14)">
        <circle cx={0} cy={0} r={22} fill={L.accent} opacity={0.35} filter="url(#blur6)" />
        <path d="M -9 -14 L 9 -14 L 1 0 L 9 14 L -9 14 L -1 0 Z" fill="#FFF2C0" stroke="#8A5A22" strokeWidth={3} strokeLinejoin="round" />
        <path d="M -5 9 L 5 9 L 6 13 L -6 13 Z M -1 0 L 1 0 L 1 8 L -1 8 Z" fill={L.accent} />
        <path d="M -11 -16 L 11 -16 M -11 16 L 11 16" stroke="#8A5A22" strokeWidth={4} strokeLinecap="round" />
      </g>
    </g>
  ),
});

/** On the head, for the new students. */
Object.assign(HEADWEAR, {
  // the screen face: scan lines, an error code, a slice of the head shifted out of place
  glitch: (L: Look) => (
    <g>
      {[-40, -28, 14, 26, 38].map((dy) => (
        <path key={dy} d={`M -50 ${H + dy} L 50 ${H + dy}`} stroke={L.accent} strokeWidth={1.5} opacity={0.25} />
      ))}
      <text x={0} y={H - 34} textAnchor="middle" fontFamily="Fragment Mono" fontSize={15} fill={L.accent} opacity={0.9}>ERROR 404</text>
      <path d={`M 40 ${H - 50} L 76 ${H - 50} L 76 ${H - 40} L 46 ${H - 40}`} fill={L.skin} stroke={L.accent} strokeWidth={3} />
      <rect x={66} y={H + 12} width={10} height={10} fill={L.accent} />
      <rect x={80} y={H + 2} width={7} height={7} fill={L.accent} opacity={0.7} />
    </g>
  ),
  // short dark hair with a cyan streak, under huge glowing headphones
  echo: (L: Look) => (
    <g>
      <path d={`M -64 ${H + 8} Q -72 ${H - 72} 0 ${H - 72} Q 72 ${H - 72} 64 ${H + 8} Q 52 ${H - 34} 20 ${H - 42} Q -10 ${H - 30} -40 ${H - 44} Q -58 ${H - 24} -64 ${H + 8} Z`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M 8 ${H - 70} Q 30 ${H - 60} 34 ${H - 42}`} stroke={L.accent} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M -66 ${H - 6} Q -70 ${H - 96} 0 ${H - 96} Q 70 ${H - 96} 66 ${H - 6}`} stroke={L.line} strokeWidth={16} fill="none" strokeLinecap="round" />
      <path d={`M -66 ${H - 6} Q -70 ${H - 96} 0 ${H - 96} Q 70 ${H - 96} 66 ${H - 6}`} stroke="#3A4070" strokeWidth={9} fill="none" strokeLinecap="round" />
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <circle cx={sd * 66} cy={H + 2} r={36} fill={L.accent} opacity={0.3} filter="url(#blur6)" />
          <rect x={sd * 66 - 20} y={H - 30} width={40} height={64} rx={18} fill="#232848" stroke={L.line} strokeWidth={4} />
          <rect x={sd * 66 - 12} y={H - 20} width={24} height={44} rx={11} fill={L.accent} />
          <rect x={sd * 66 - 5} y={H - 14} width={6} height={18} rx={3} fill="#FFFFFF" opacity={0.7} />
        </g>
      ))}
    </g>
  ),
  // a dome, rivets and a stub antenna
  titan: (L: Look) => (
    <g>
      <path d={`M -62 ${H - 20} Q -60 ${H - 66} 0 ${H - 66} Q 60 ${H - 66} 62 ${H - 20}`} stroke={L.line} strokeWidth={4} fill="none" />
      <path d={`M 30 ${H - 58} L 40 ${H - 92}`} stroke={L.line} strokeWidth={5} strokeLinecap="round" />
      <circle cx={41} cy={H - 96} r={6} fill={L.accent} stroke={L.line} strokeWidth={2.5} />
      {[-44, 44].map((x) => (
        <circle key={x} cx={x} cy={H + 30} r={4} fill={L.line} />
      ))}
    </g>
  ),
  // brass goggles up on the brow, and hair that floats as if under water (it drifts with the sway)
  chronos: (L: Look, sw: number) => (
    <g>
      {/* soft locks that wave sideways and up, slow as if under water */}
      {[
        [-52, -34, -70], [-30, -52, -92], [-6, -60, -102], [18, -58, -98], [42, -48, -84], [58, -28, -60],
      ].map(([x, y0, y1], i) => {
        const d = `M ${x} ${H + y0} C ${x - 22} ${H + y0 - 18} ${x + 34 + sw * 0.5} ${H + y1 + 22} ${x + 22 + sw} ${H + y1}`;
        return (
          <g key={i}>
            <path d={d} stroke={L.line} strokeWidth={21} fill="none" strokeLinecap="round" />
            <path d={d} stroke={L.hair} strokeWidth={14} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      <path d={`M -60 ${H - 26} Q 0 ${H - 74} 60 ${H - 26} Q 0 ${H - 50} -60 ${H - 26} Z`} fill={L.hair} />
      <path d={`M -62 ${H - 30} Q 0 ${H - 52} 62 ${H - 30}`} stroke="#5A3A20" strokeWidth={9} fill="none" />
      {[-24, 24].map((x) => (
        <g key={x}>
          <circle cx={x} cy={H - 42} r={17} fill="#C8E8E0" fillOpacity={0.7} stroke="#C8922E" strokeWidth={6} />
          <path d={`M ${x - 7} ${H - 46} l 5 -4`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
    </g>
  ),
});

/** Lina's ponytail, behind the head: tied high, it falls to her shoulder and swings with the sway. */
const PONYTAIL: Piece = (L, sw) => (
  <path d={`M 28 ${H - 60} Q 104 ${H - 96} ${104 + sw * 0.4} ${H + 10} Q ${102 + sw} ${H + 96} ${70 + sw * 1.5} ${H + 160} Q ${82 + sw} ${H + 70} 60 ${H + 4} Z`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
);

/** Robo, the academy's little robot: his own small rig. Feet at (x, y); he bobs on his own clock and waves. */
export const Robo: React.FC<{ x: number; y: number; scale?: number; t?: number; wave?: number; happy?: boolean; rimId?: string }> = ({ x, y, scale = 1, t = 0, wave = 0, happy = true, rimId = 'rimR' }) => {
  const bob = Math.sin(t / 9) * 4;
  const arm = wave > 0 ? -150 + Math.sin(t / 4) * 22 * wave : -20;
  const line = '#141826';
  const cyan = '#3FD4FF';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-figure="robo" data-look="robo">
      <ellipse cx={0} cy={4} rx={70} ry={11} fill="#000" opacity={0.2} />
      <g transform={`translate(0 ${bob})`} filter={`url(#${rimId})`}>
        {/* stubby legs and feet */}
        {[-24, 24].map((lx) => (
          <g key={lx}>
            <rect x={lx - 10} y={-46} width={20} height={34} rx={8} fill="#DDE3EC" stroke={line} strokeWidth={4} />
            <ellipse cx={lx + Math.sign(lx) * 4} cy={-10} rx={22} ry={11} fill="#F6F8FB" stroke={line} strokeWidth={4} />
          </g>
        ))}
        {/* arms: the left one waves */}
        <g transform={`rotate(${arm} -50 -98)`}>
          <rect x={-60} y={-100} width={20} height={56} rx={10} fill="#F6F8FB" stroke={line} strokeWidth={4} />
          <circle cx={-50} cy={-40} r={13} fill="#F6F8FB" stroke={line} strokeWidth={4} />
        </g>
        <g transform="rotate(20 50 -98)">
          <rect x={40} y={-100} width={20} height={56} rx={10} fill="#F6F8FB" stroke={line} strokeWidth={4} />
          <circle cx={50} cy={-40} r={13} fill="#F6F8FB" stroke={line} strokeWidth={4} />
        </g>
        {/* the body and its glowing core */}
        <ellipse cx={0} cy={-84} rx={50} ry={46} fill="#F6F8FB" stroke={line} strokeWidth={4} />
        <path d="M 20 -120 Q 46 -100 40 -60" stroke="#D2DAE6" strokeWidth={10} fill="none" strokeLinecap="round" />
        <circle cx={0} cy={-82} r={22} fill={cyan} opacity={0.25} />
        <circle cx={0} cy={-82} r={14} fill={cyan} stroke={line} strokeWidth={3.5} />
        <circle cx={-4} cy={-86} r={4} fill="#fff" />
        {/* the head: a rounded box with a dark visor, ear discs, an antenna */}
        <path d="M 0 -206 L 0 -232" stroke={line} strokeWidth={5} />
        <circle cx={0} cy={-238} r={9} fill={cyan} stroke={line} strokeWidth={3.5} />
        {/* the antenna transmitting: rings going out from the tip */}
        {[0, 1, 2].map((k) => {
          const q = (t / 18 + k / 3) % 1;
          return <circle key={`sg${k}`} cx={0} cy={-238} r={12 + q * 40} fill="none" stroke={cyan} strokeWidth={3} opacity={0.8 * (1 - q)} />;
        })}
        <rect x={-80} y={-206} width={160} height={92} rx={40} fill="#F6F8FB" stroke={line} strokeWidth={4} />
        <circle cx={-82} cy={-160} r={13} fill={cyan} stroke={line} strokeWidth={3.5} />
        <circle cx={82} cy={-160} r={13} fill={cyan} stroke={line} strokeWidth={3.5} />
        <rect x={-62} y={-194} width={124} height={68} rx={30} fill="#1A2236" stroke={line} strokeWidth={3} />
        {happy ? (
          <g stroke={cyan} strokeWidth={6} strokeLinecap="round" fill="none">
            <path d="M -36 -160 Q -26 -172 -16 -160 M 16 -160 Q 26 -172 36 -160" />
            <path d="M -16 -146 Q 0 -134 16 -146" />
          </g>
        ) : (
          <g fill={cyan}>
            <ellipse cx={-26} cy={-162} rx={8} ry={10} />
            <ellipse cx={26} cy={-162} rx={8} ry={10} />
            <rect x={-12} y={-146} width={24} height={5} rx={2} />
          </g>
        )}
        <path d="M -50 -190 Q -30 -198 -10 -192" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.25} fill="none" />
      </g>
    </g>
  );
};

/** The name a look is registered under in LOOKS ('custom' for a one-off). */
const lookName = (L: Look) => (Object.keys(LOOKS) as CastName[]).find((k) => LOOKS[k] === L) ?? 'custom';

export const Hero: React.FC<{ pose: Pose; shadow?: number; rimId?: string; look?: Look }> = ({ pose, shadow = 1, rimId = 'rimR', look = LOOKS.pipHood }) => {
  const j = joints(pose);
  const L = look;
  // limbs are light with a dark outline, so they read on the dark sets (navy limbs vanished on navy walls)
  const limb = (o: { root: P; mid: P; end: P }, w: number, color = L.limb) => {
    const d = `M ${o.root.x} ${o.root.y} L ${o.mid.x} ${o.mid.y} L ${o.end.x} ${o.end.y}`;
    return (
      <g>
        <path d={d} stroke={L.line} strokeWidth={w + 7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  const big = L.extra === 'titan';
  const aw = big ? 19 : 11; // arm and leg thickness
  const lw = big ? 20 : 12;
  // a leg: the trousers, and boots that run the shoe colour up the lower half of the shin
  const leg = (o: { root: P; mid: P; end: P }) => {
    if (!L.boots) return limb(o, lw, L.legs ?? L.limb);
    const k = { x: o.mid.x + (o.end.x - o.mid.x) * 0.45, y: o.mid.y + (o.end.y - o.mid.y) * 0.45 };
    return (
      <g>
        {limb(o, lw, L.legs ?? L.limb)}
        <path d={`M ${k.x} ${k.y} L ${o.end.x} ${o.end.y}`} stroke={L.shoe} strokeWidth={lw + 5} strokeLinecap="round" />
        <path d={`M ${k.x - 9} ${k.y} L ${k.x + 9} ${k.y}`} stroke={L.line} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
      </g>
    );
  };
  const shoe = (o: { root: P; mid: P; end: P }) => (
    <ellipse cx={o.end.x + pose.facing * 9} cy={o.end.y + 4} rx={22} ry={11} fill={L.shoe} stroke={L.line} strokeWidth={4} />
  );
  // a mitten along the forearm: the palm, the thumb toward the body, two knuckle marks; or a pointing fist
  const hand = (o: { mid: P; end: P }, side: 1 | -1, kind: HandKind) => {
    const ang = (Math.atan2(o.end.x - o.mid.x, o.end.y - o.mid.y) * 180) / Math.PI;
    return (
      <g transform={`translate(${o.end.x} ${o.end.y}) rotate(${-ang}) scale(${big ? 1.35 : 1})`}>
        {kind === 'point' ? (
          <g>
            <rect x={-4} y={10} width={8} height={24} rx={4} fill={L.hand} stroke={L.line} strokeWidth={3.5} />
            <path d="M -11 -2 Q -14 14 -6 18 L 7 18 Q 14 14 11 -2 Z" fill={L.hand} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
            <ellipse cx={side * 10} cy={6} rx={4.5} ry={7} fill={L.hand} stroke={L.line} strokeWidth={3.5} />
          </g>
        ) : (
          <g>
            <ellipse cx={side * 10} cy={3} rx={5.5} ry={9} transform={`rotate(${side * -28} ${side * 10} 3)`} fill={L.hand} stroke={L.line} strokeWidth={4} />
            <ellipse cx={0} cy={10} rx={11} ry={15} fill={L.hand} stroke={L.line} strokeWidth={4} />
            <path d="M -4 17 L -4 23 M 3 18 L 3 24" stroke={L.line} strokeWidth={2} opacity={0.45} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  };
  const kw = turnWidth(pose.yaw);
  const sw = pose.sway * 0.8 - pose.tilt * 0.5; // how far loose cloth trails
  const torso = (
    <g transform={`rotate(${pose.tilt}) translate(${pose.yaw * 6} 0) scale(${kw} 1)`}>
      <path d="M -46 -112 Q 0 -124 46 -112 L 40 2 Q 0 12 -40 2 Z" fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 10 -116 Q 30 -114 46 -112 L 40 2 Q 26 8 12 9 Z" fill={L.jacketShade} opacity={0.55} />
      <path d="M 0 -112 L 0 4" stroke={L.jacketShade} strokeWidth={4} />
      {L.extra === 'suit' ? (
        // a white shirt in the V of the jacket and a tie in the accent colour
        <g>
          <path d="M -24 -116 L 0 -54 L 24 -116 Z" fill="#EDE8DE" />
          <path d="M -7 -112 L 7 -112 L 9 -100 L 5 -64 L 0 -56 L -5 -64 L -9 -100 Z" fill={L.accent} />
          <path d="M -26 -116 L 0 -54 M 26 -116 L 0 -54" stroke={L.line} strokeWidth={4} />
        </g>
      ) : L.extra && TORSO[L.extra] ? (
        TORSO[L.extra]!(L, sw)
      ) : (
        <path d="M -22 -118 Q 0 -100 22 -118" stroke={L.accent} strokeWidth={6} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
  // pieces behind the whole body (a cape, the back of a cloak, a backpack), and a staff in the right hand
  const back = L.extra && BACK[L.extra] ? <g transform={`rotate(${pose.tilt}) translate(${-pose.yaw * 22} 0)`}>{BACK[L.extra]!(L, sw)}</g> : null;
  const staff =
    L.extra === 'sage' ? (
      <g>
        <path d={`M ${j.armR.end.x + 6} ${j.armR.end.y - 150} L ${j.armR.end.x + 6} ${LEG_LEN + 8}`} stroke={L.line} strokeWidth={15} strokeLinecap="round" />
        <path d={`M ${j.armR.end.x + 6} ${j.armR.end.y - 150} L ${j.armR.end.x + 6} ${LEG_LEN + 8}`} stroke="#8A5A32" strokeWidth={9} strokeLinecap="round" />
        <path d={`M ${j.armR.end.x + 6} ${j.armR.end.y - 148} q 0 -30 22 -30 q 18 0 18 18 q 0 14 -14 14 q -10 0 -10 -10`} stroke="#8A5A32" strokeWidth={9} fill="none" strokeLinecap="round" />
        {/* old runes carved down the staff, faintly lit */}
        {[0, 1, 2, 3].map((k) => {
          const rx = j.armR.end.x + 6;
          const ry = j.armR.end.y - 120 + k * 34 + (k > 1 ? 60 : 0);
          return <path key={k} d={k % 2 ? `M ${rx - 3} ${ry} l 3 -7 l 3 7 M ${rx} ${ry - 3} l 0 8` : `M ${rx - 3} ${ry - 5} l 6 0 l -6 8 l 6 0`} stroke="#F2CC7A" strokeWidth={2.2} fill="none" strokeLinecap="round" />;
        })}
      </g>
    ) : null;
  const head = (
    <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt} 0 ${HEAD.y + 40})`}>
      {L.extra === 'pony' ? <g transform={`translate(${-pose.yaw * 14} 0)`}>{PONYTAIL(L, sw)}</g> : null}
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={L.skin} stroke={L.line} strokeWidth={4} />
      <path d={`M ${HEAD.x + 14} ${HEAD.y + 58} A ${HEAD.r} ${HEAD.r} 0 0 0 ${HEAD.x + 60} ${HEAD.y + 14} A 70 70 0 0 1 ${HEAD.x + 14} ${HEAD.y + 58} Z`} fill={L.skinShade} />
      {L.extra === 'bunches' || L.extra === 'bob' || L.extra === 'suit' || L.extra === 'labcoat' || (L.extra && HEADWEAR[L.extra]) ? null : (
        <path transform={`translate(${-pose.yaw * 16} 0)`} d={`M -6 ${HEAD.y - 60} q 10 -26 30 -18 q -16 2 -14 16 q -8 -10 -16 2 Z`} fill={L.hair} />
      )}
      {L.extra === 'bunches' ? (
        // a fringe cap and two bunches tied with coral bands; the bunches swing a little with sway
        <g>
          {[-1, 1].map((sd) => (
            <g key={sd} transform={`rotate(${pose.sway * 0.5} ${sd * 58} ${HEAD.y - 30})`}>
              <circle cx={sd * 72 - pose.yaw * 10} cy={HEAD.y - 24} r={24} fill={L.hair} stroke={L.line} strokeWidth={4} />
              <circle cx={sd * 55 - pose.yaw * 10} cy={HEAD.y - 30} r={8} fill={L.accent} />
            </g>
          ))}
          <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -60 ${HEAD.y - 22} Q -62 ${HEAD.y - 66} 0 ${HEAD.y - 66} Q 62 ${HEAD.y - 66} 60 ${HEAD.y - 22} Q 40 ${HEAD.y - 46} 14 ${HEAD.y - 40} Q 0 ${HEAD.y - 50} -14 ${HEAD.y - 40} Q -40 ${HEAD.y - 46} -60 ${HEAD.y - 22} Z`} fill={L.hair} />
        </g>
      ) : null}
      {L.extra === 'bob' ? (
        // a chin-length bob framing the face, a side parting
        <path
          transform={`translate(${-pose.yaw * 12} 0)`}
          d={`M -74 ${HEAD.y + 34} Q -84 ${HEAD.y - 70} 0 ${HEAD.y - 72} Q 84 ${HEAD.y - 70} 74 ${HEAD.y + 34} L 56 ${HEAD.y + 34} Q 60 ${HEAD.y - 20} 40 ${HEAD.y - 40} Q 10 ${HEAD.y - 34} -16 ${HEAD.y - 48} Q -52 ${HEAD.y - 30} -56 ${HEAD.y + 34} Z`}
          fill={L.hair}
          stroke={L.line}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ) : null}
      {L.extra === 'suit' ? (
        // short combed-back hair with a hard side parting
        <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -60 ${HEAD.y - 18} Q -64 ${HEAD.y - 70} 4 ${HEAD.y - 68} Q 64 ${HEAD.y - 64} 60 ${HEAD.y - 18} Q 52 ${HEAD.y - 44} 18 ${HEAD.y - 46} L 12 ${HEAD.y - 54} L 6 ${HEAD.y - 46} Q -44 ${HEAD.y - 46} -60 ${HEAD.y - 18} Z`} fill={L.hair} />
      ) : null}
      {big ? <Lens expr={pose.expr} look={pose.look} yaw={pose.yaw} blink={pose.blink} /> : <Face
        expr={pose.expr}
        blink={pose.blink}
        look={pose.look}
        glasses={L.extra === 'armor' ? 1 : pose.glasses}
        yaw={pose.yaw}
        ink={L.face}
        glint={L.glow ? 1 : pose.glint}
        glintColor={L.glow ?? pose.glintColor}
        lashes={L.extra === 'pony'}
        specs={L.extra === 'labcoat'}
      />}
      {L.extra && HEADWEAR[L.extra] ? <g transform={`translate(${-pose.yaw * 14} 0)`}>{HEADWEAR[L.extra]!(L, sw)}</g> : null}
      {L.extra === 'curls'
        ? [-150, -125, -100, -78, -55, -30].map((deg, k) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={k} cx={Math.cos(a) * 54} cy={HEAD.y + Math.sin(a) * 54} r={24} fill={L.hair} />;
          })
        : null}
    </g>
  );
  // data-figure tags every character drawn, so scripts/castcheck.mjs can count who is on screen in each shot
  return (
    <g data-figure="hero" data-look={lookName(L)}>
      {shadow > 0 ? <ellipse cx={pose.x} cy={pose.y + LEG_LEN * pose.scale + 10} rx={70 * pose.scale} ry={12 * pose.scale} fill="#000" opacity={0.25 * shadow} /> : null}
      <g transform={`translate(${pose.x} ${pose.y}) scale(${pose.scale}) rotate(${pose.spin} 0 -90)`} filter={`url(#${rimId})`}>
        <g transform={`translate(0 ${LEG_LEN}) scale(${1 + 0.6 * pose.squash} ${1 - pose.squash}) translate(0 ${-LEG_LEN})`}>
          {/* the far side is drawn first, so a turned body overlaps itself the right way */}
          {back}
          {pose.yaw < 0 ? <>{leg(j.legR)}{shoe(j.legR)}{leg(j.legL)}{shoe(j.legL)}</> : <>{leg(j.legL)}{shoe(j.legL)}{leg(j.legR)}{shoe(j.legR)}</>}
          {pose.yaw < 0 ? <>{limb(j.armR, aw)}{hand(j.armR, -1, pose.handR)}</> : <>{limb(j.armL, aw)}{hand(j.armL, 1, pose.handL)}</>}
          {torso}
          {staff}
          {pose.yaw < 0 ? <>{limb(j.armL, aw)}{hand(j.armL, 1, pose.handL)}</> : <>{limb(j.armR, aw)}{hand(j.armR, -1, pose.handR)}</>}
          {L.extra && HANDS[L.extra] ? HANDS[L.extra]!(L, j) : null}
          {L.extra === 'hood' ? (
            <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt * 0.5} 0 ${HEAD.y + 40})`}>
              <path d={`M -70 ${HEAD.y + 14} Q -80 ${HEAD.y - 74} 0 ${HEAD.y - 80} Q 80 ${HEAD.y - 74} 70 ${HEAD.y + 14} Q 52 -100 0 -106 Q -52 -100 -70 ${HEAD.y + 14} Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} />
              {(() => {
                const sw = pose.sway * 0.7 - pose.tilt * 0.6;
                return (
                  <g>
                    <path d={`M -12 -108 Q ${-14 + sw * 0.3} -88 ${-16 + sw} -66 M 12 -108 Q ${14 + sw * 0.3} -88 ${16 + sw} -66`} stroke={L.accent} strokeWidth={5} strokeLinecap="round" fill="none" />
                    <circle cx={-16 + sw} cy={-64} r={5} fill={L.accent} />
                    <circle cx={16 + sw} cy={-64} r={5} fill={L.accent} />
                  </g>
                );
              })()}
            </g>
          ) : null}
          {L.extra === 'cloak' ? (
            <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt * 0.5} 0 ${HEAD.y + 40})`}>
              <path d={`M -74 ${HEAD.y + 20} Q -88 ${HEAD.y - 70} -6 ${HEAD.y - 88} L ${36 + sw * 0.6} ${HEAD.y - 122} Q 40 ${HEAD.y - 90} 58 ${HEAD.y - 58} Q 84 ${HEAD.y - 20} 74 ${HEAD.y + 20} Q 52 -100 0 -106 Q -52 -100 -74 ${HEAD.y + 20} Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
            </g>
          ) : null}
          {L.extra === 'curls' ? (
            <g transform={`rotate(${pose.tilt})`}>
              <path d="M -46 -110 Q 0 -86 46 -110" stroke="#E06A5A" strokeWidth={8} fill="none" strokeLinecap="round" />
              <rect x={-60} y={-126} width={20} height={32} rx={8} fill="#E06A5A" stroke={L.line} strokeWidth={4} />
              <rect x={40} y={-126} width={20} height={32} rx={8} fill="#E06A5A" stroke={L.line} strokeWidth={4} />
            </g>
          ) : null}
          {head}
        </g>
      </g>
    </g>
  );
};


/** A character is the rig in a costume: <Actor> is the same as <Hero>, named for scenes with more than one person. */
export const Actor = Hero;

/**
 * A walk in profile. `phase` advances about 0.6 a frame for a normal walk; `ground` is the floor height under the hips
 * (a number, or a function of x for stairs and slopes). Leans into the step, bobs the head, bends the elbows, swings
 * loose things (the drawstrings) a beat behind the body.
 */
export const walkPose = (x: number, phase: number, ground: number | ((x: number) => number), scale = 0.9, extra: Partial<Pose> = {}, facing: 1 | -1 = 1): Pose => {
  const s = Math.sin(phase);
  const g = typeof ground === 'number' ? ground : ground(x);
  return {
    ...basePose,
    x,
    y: g - LEG_LEN * scale - Math.abs(Math.cos(phase)) * 7,
    scale,
    facing,
    yaw: facing,
    tilt: 5 * facing,
    headTilt: 2 * Math.sin(phase * 2),
    sway: 10 * Math.sin(phase + 0.8),
    legL: { a: 28 * s, b: -Math.max(0, 40 * Math.sin(phase + 1.2)) },
    legR: { a: -28 * s, b: -Math.max(0, 40 * Math.sin(phase + 1.2 + Math.PI)) },
    armL: { a: 24 * s, b: 12 + 14 * Math.abs(s) },
    armR: { a: 24 * s, b: 12 + 14 * Math.abs(s) },
    ...extra,
  };
};

/** Where the feet are for a pose standing at hip y: use it to put a character on a floor (y = floor - feetBelowHips). */
export const feetBelowHips = (scale: number) => LEG_LEN * scale;
