// The free thumbnail: renders the Thumb composition with the props in out/<slug>/publish.json ("thumbnail.render"),
// so the thumbnail is drawn by the same code as the episode (the real cast, the Arabic title set right) instead of an
// image model. Run from the studio folder:
//   node <skill>/scripts/thumb.mjs <slug>
// Writes out/<slug>/thumbnail.png (1280 x 720) and thumbnail.jpg (under YouTube's 2 MB limit).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(path.resolve('package.json'));
const { bundle } = require('@remotion/bundler');
const { renderStill, selectComposition } = require('@remotion/renderer');

const slug = process.argv[2];
if (!slug) {
  console.error('usage: node thumb.mjs <slug>');
  process.exit(2);
}
const pub = path.resolve('out', slug, 'publish.json');
if (!fs.existsSync(pub)) {
  console.error(`no ${pub}: the publishing agent writes it`);
  process.exit(2);
}
const props = JSON.parse(fs.readFileSync(pub, 'utf8')).thumbnail?.render ?? {};
if ((props.cast ?? []).length > 2) {
  console.error('thumbnail.render.cast has more than two characters: two at most');
  process.exit(1);
}
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id: 'Thumb', inputProps: props, timeoutInMilliseconds: 300000 });
const png = path.resolve('out', slug, 'thumbnail.png');
await renderStill({ serveUrl, composition, frame: 0, output: png, overwrite: true, inputProps: props, timeoutInMilliseconds: 300000 });
const jpg = png.replace(/\.png$/, '.jpg');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '3', jpg]);
console.log(`${png}\n${jpg} (${Math.round(fs.statSync(jpg).size / 1024)} KB)`);
