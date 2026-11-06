// Step 4b: the two-character rule. Draws every shot of an episode at several moments of its own clock (start,
// key frame, middle, end) and counts the figures it actually puts on screen: rig characters, Robo, and the extras a
// set draws by itself (the classroom's seated kids). No browser, no render: the shots are bundled with esbuild and
// drawn to markup with react-dom/server, so it runs in a second or two. Run from the studio folder:
//   node <skill>/scripts/castcheck.mjs <slug> [--max 2]
// Prints one line per shot that breaks the rule (and a one-line summary), exits 1 if any does.
// A figure counts even when it's tiny, blurred or half off-frame: if it's drawn, it's on screen.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('package.json'));
const esbuild = require('esbuild');

const args = process.argv.slice(2);
const slug = args[0];
if (!slug) {
  console.error('usage: node castcheck.mjs <slug> [--max 2]');
  process.exit(2);
}
const maxAt = args.indexOf('--max');
const MAX = maxAt >= 0 ? Number(args[maxAt + 1]) : 2;
const epDir = path.resolve('src/episodes', slug);
for (const f of ['shots.tsx', 'timeline.json']) {
  if (!fs.existsSync(path.join(epDir, f))) {
    console.error(`missing ${path.join(epDir, f)} (run plan.py and write the shots first)`);
    process.exit(2);
  }
}

// Remotion's runtime and the font loaders need a browser: stand in for them, nothing here draws text metrics.
const stub = {
  name: 'stub-remotion',
  setup(b) {
    b.onResolve({ filter: /^(remotion|@remotion\/.*)$/ }, (a) => ({ path: a.path, namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: `
        export const useCurrentFrame = () => 0;
        export const useVideoConfig = () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 1 });
        export const AbsoluteFill = ({ children }) => children ?? null;
        export const Audio = () => null;
        export const Composition = () => null;
        export const registerRoot = () => {};
        export const staticFile = (s) => s;
        export const loadFont = () => ({ waitUntilDone: () => Promise.resolve() });
        export default {};`,
      loader: 'js',
    }));
  },
};

const entry = `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as shots from ${JSON.stringify(path.join(epDir, 'shots.tsx'))};
import tl from ${JSON.stringify(path.join(epDir, 'timeline.json'))};
export function run() {
  const out = [];
  for (const s of tl.shots) {
    const Shot = shots[s.id];
    if (!Shot) { out.push({ id: s.id, missing: true }); continue; }
    const len = Math.max(1, s.len);
    const frames = [...new Set([0, s.key, Math.floor(len / 2), len - 1].map((v) => Math.max(0, Math.min(len - 1, v))))];
    let worst = { n: -1 };
    for (const t of frames) {
      const html = renderToStaticMarkup(React.createElement('svg', null, React.createElement(Shot, { t, len, f: (s.first ?? 0) + t })));
      const figs = [...html.matchAll(/data-figure="(\\w+)"[^>]*?data-look="([^"]*)"/g)].map((m) => m[1] === 'hero' || m[1] === 'robo' ? m[2] : m[1]);
      if (figs.length > worst.n) worst = { n: figs.length, t, figs };
    }
    out.push({ id: s.id, size: s.size, ...worst });
  }
  return out;
}`;

const res = await esbuild.build({
  stdin: { contents: entry, resolveDir: path.resolve('src'), loader: 'tsx' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  jsx: 'automatic',
  logLevel: 'silent',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [stub],
});
const tmp = path.resolve('out', `.castcheck-${slug}.cjs`);
fs.mkdirSync(path.dirname(tmp), { recursive: true });
fs.writeFileSync(tmp, res.outputFiles[0].text);
let rows;
try {
  rows = require(tmp).run();
} finally {
  fs.rmSync(tmp, { force: true });
}

const tally = (figs) => Object.entries(figs.reduce((m, f) => ((m[f] = (m[f] ?? 0) + 1), m), {})).map(([k, v]) => (v > 1 ? `${k}×${v}` : k)).join(', ');
const bad = rows.filter((r) => r.missing || r.n > MAX);
for (const r of bad) {
  if (r.missing) console.log(`${r.id}: no component exported for this shot`);
  else console.log(`${r.id} (${r.size}): ${r.n} figures at t=${r.t}: ${tally(r.figs)}`);
}
const most = Math.max(...rows.map((r) => r.n ?? 0));
console.log(`${rows.length} shots checked, ${bad.length} over the limit of ${MAX} (most in one shot: ${most})`);
process.exit(bad.length ? 1 : 0);
