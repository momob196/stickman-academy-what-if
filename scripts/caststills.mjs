// Renders the StickMan Academy cast-check stills through the JS API (same pathway as stills.mjs, which the CLI's
// 30 s browser launch timeout sometimes trips on):
//   node <skill>/scripts/caststills.mjs [Cast CastPoses AcademyScene] [--scale 1]
// Writes out/<composition>.png from a single bundle. Run from the studio folder.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve('package.json'));
const { bundle } = require('@remotion/bundler');
const { renderStill, selectComposition } = require('@remotion/renderer');

const args = process.argv.slice(2);
const scaleAt = args.indexOf('--scale');
const scale = scaleAt >= 0 ? Number(args[scaleAt + 1]) : 1;
const comps = args.slice(0, scaleAt >= 0 ? scaleAt : undefined).length
  ? args.slice(0, scaleAt >= 0 ? scaleAt : undefined)
  : ['Cast', 'CastPoses', 'AcademyScene'];

const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
fs.mkdirSync(path.resolve('out'), { recursive: true });
for (const id of comps) {
  // The 30 s default launch/eval timeout is too tight under a busy 4-core system: give the browser room.
  const composition = await selectComposition({ serveUrl, id, timeoutInMilliseconds: 300000 });
  const output = path.resolve('out', `${id}.png`);
  await renderStill({ serveUrl, composition, frame: 0, output, overwrite: true, scale, timeoutInMilliseconds: 300000 });
  process.stdout.write(`${id} `);
}
console.log('\ndone');
