"""Checks an episode's YouTube package (out/<slug>/publish.json) before anything is uploaded: the proof that the
publishing agent kept the video private and wrote within YouTube's limits and the channel's rules.

python <skill>/scripts/publishcheck.py <slug>      (from the studio folder)
Prints one line per failure and a score out of 100; exits 1 below 100, and exits 2 at once if privacy isn't private.
"""
import json, pathlib, re, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if len(sys.argv) < 2:
    raise SystemExit(__doc__)
slug = sys.argv[1]
p = pathlib.Path('out') / slug / 'publish.json'
if not p.exists():
    raise SystemExit(f'no {p}: the publishing agent writes it')
pk = json.loads(p.read_text(encoding='utf-8'))
if pk.get('privacy') != 'private':
    print(f'FAIL privacy is {pk.get("privacy")!r}: it must be "private" (the person publishes it themselves)')
    sys.exit(2)

fails, checks = [], 0


def check(ok, msg):
    global checks
    checks += 1
    if not ok:
        fails.append(msg)


norm = lambda t: re.sub(r'[ً-ْـ]', '', (t or '').lower())
BANNED = ['ايران', 'إيران', 'اسرائيل', 'إسرائيل', 'فلسطين', 'غزة', 'حرب', 'روسيا', 'اوكرانيا', 'ترامب', 'رئيس', 'داعش',
          'ماين كرافت', 'minecraft', 'دراغون بول', 'dragon ball', 'بندريتا', 'henry stickmin', 'fortnite', 'roblox', 'naruto']
title, alts = pk.get('title', ''), pk.get('title_alternatives') or []
check(0 < len(title) <= 70, f'title is {len(title)} characters (1 to 70)')
check(len(alts) == 2 and len({title, *alts}) == 3 and all(0 < len(a) <= 70 for a in alts), 'needs two different alternative titles of at most 70 characters')
desc = pk.get('description', '')
check(0 < len(desc) <= 5000, f'description is {len(desc)} characters (1 to 5000)')
check('المصدر' in desc or 'Source' in desc, 'the description has no source line for the fact')
lines = [l for l in desc.splitlines() if l.strip()]
check(len(lines) >= 4, 'the description is too thin (a hook, the premise, the fact, the source, a question)')
tags = pk.get('tags') or []
check(bool(tags) and sum(len(t) for t in tags) + 2 * len(tags) <= 450, f'tags take {sum(len(t) for t in tags) + 2 * len(tags)} characters with separators (450 at most)')
check(all(0 < len(t) <= 30 for t in tags), 'a tag is empty or longer than 30 characters')
check(len(set(tags)) == len(tags), 'a tag is repeated')
tags_ok = len(tags) >= 8
check(tags_ok, f'{len(tags)} tags (8 or more)')
hs = pk.get('hashtags') or []
check(3 <= len(hs) <= 5, f'{len(hs)} hashtags (3 to 5)')
check(all(re.fullmatch(r'#[\w؀-ۿ]+', h or '') for h in hs), 'a hashtag has a space or a symbol (only # then letters, digits, _)')
tail = '\n'.join(lines[-2:])
check(all(h in tail for h in hs), 'the hashtags must close the description')
everything = norm(' '.join([title, *alts, desc, ' '.join(tags), ' '.join(hs)]))
bad = [b for b in BANNED if norm(b) in everything]
check(not bad, f'off-limits words: {", ".join(bad)}')

th = pk.get('thumbnail') or {}
prompt = th.get('prompt', '')
check(bool(prompt) and not re.search(r'[؀-ۿ]', prompt), 'the thumbnail prompt must be in English (image models garble Arabic)')
check('16:9' in prompt or '1280x720' in prompt.replace(' ', ''), 'the thumbnail prompt must say 16:9 or 1280x720')
LOOKS = {'stickman': r'stick ?man|red cape', 'zed': r'dr\.? ?zed|lab coat|round (glasses|specs)', 'promax': r'promax|gold (and black )?armou?r',
         'lina': r'lina|pink scarf|ponytail', 'shadow': r'shadow|hooded cloak|violet eyes', 'timo': r'timo|green cap',
         'robo': r'robo\b|small robot', 'zen': r'master zen|straw hat', 'glitch': r'glitch|neon green|screen face',
         'echo': r'echo\b|headphones', 'titan': r'titan|camera eye', 'chronos': r'chronos|copper coat|hourglass'}
who = [k for k, rx in LOOKS.items() if re.search(rx, prompt, re.I)]
check(len(who) <= 2, f'the thumbnail shows {len(who)} characters ({", ".join(who)}): two at most')
check(len(who) >= 1, 'the thumbnail prompt describes no character from the cast')
ov = (th.get('text_overlay') or '').split()
check(2 <= len(ov) <= 4, f'the overlay text is {len(ov)} words (2 to 4)')
check(bool(th.get('negative')), 'the thumbnail needs a negative prompt')

for f in fails:
    print('FAIL', f)
score = round(100 * (checks - len(fails)) / checks)
print(f'publishcheck: {score}/100 ({checks - len(fails)} of {checks} checks pass; privacy: private)')
sys.exit(0 if not fails else 1)
