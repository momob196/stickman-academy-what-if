"""The frame sheet: one frame from the middle of every segment of a rendered episode, labelled and tiled on one
image, for checking the delivered video (framing, cropped heads, text, continuity) in a single look instead of
opening 35 files. Cheap to read: one image instead of one per shot.

python <skill>/scripts/framesheet.py <slug> [--video out/<slug>/<slug>-final.mp4] [--cols 5] [--width 480] [--shots S3 S9]
Writes out/<slug>/frames-sheet.jpg
"""
import json, pathlib, subprocess, sys, tempfile

from PIL import Image, ImageDraw

from wi import ep_dir, out_dir

slug = sys.argv[1]
args = sys.argv[2:]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
video = pathlib.Path(opt('--video', str(out_dir(slug) / f'{slug}-final.mp4')))
cols, W = int(opt('--cols', 5)), int(opt('--width', 480))
only = args[args.index('--shots') + 1:] if '--shots' in args else []
if not video.exists():
    raise SystemExit(f'no video at {video}: render it first (master.py)')
tl = json.loads((ep_dir(slug) / 'timeline.json').read_text(encoding='utf-8'))
fps = tl['fps']
segs = [s for s in tl['segments'] if not only or s['shot'] in only]
H = round(W * 9 / 16)
rows = (len(segs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 22)), (16, 14, 24))
draw = ImageDraw.Draw(sheet)
with tempfile.TemporaryDirectory() as tmp:
    for i, s in enumerate(segs):
        at = (s['a'] + s['b']) / 2 / fps
        f = pathlib.Path(tmp) / f'{i}.jpg'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{at:.3f}', '-i', str(video), '-frames:v', '1', '-vf', f'scale={W}:{H}', str(f)], check=True)
        x, y = (i % cols) * W, (i // cols) * (H + 22)
        sheet.paste(Image.open(f), (x, y + 22))
        draw.text((x + 6, y + 5), f"{s['shot']}  {at:.1f}s", fill=(255, 220, 120))
out = out_dir(slug) / 'frames-sheet.jpg'
sheet.save(out, quality=86)
print(f'{out} ({len(segs)} frames)')
