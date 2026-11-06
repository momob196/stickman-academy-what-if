"""Checks an episode's script (episode.json) against the skill's writing rules: the proof that the script agent
followed the formula, the cast and the two-character rule, and backed its fact.

python <skill>/scripts/scriptcheck.py <slug> [--long]      (from the studio folder)
Prints one line per failure and a score out of 100; exits 1 below 100. --long checks the 40-60 s cut.

Checks: the fields (id, slug, topic, two-line title ending in «؟», accent in the title, power, cast, script, science);
word count (45-65, or 110-150 with --long) and the estimated length at 2.7 words a second; sentences of at most 12
words; at least three demo beats before the premise, the premise said as a line, «هذا حقيقي» after the fact, a last
line that is a question; at most two characters per beat (the beat's "cast", and the names said in it); names
spelled as cast.md has them; every number in the script appears in science, and every science entry has a claim,
a working and a source.
"""
import json, pathlib, re, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if len(sys.argv) < 2:
    raise SystemExit(__doc__)
slug, long_cut = sys.argv[1], '--long' in sys.argv
ep = json.loads((pathlib.Path('src/episodes') / slug / 'episode.json').read_text(encoding='utf-8'))
fails, checks = [], 0


def check(ok, msg):
    global checks
    checks += 1
    if not ok:
        fails.append(msg)


for k in ['id', 'slug', 'topic', 'title', 'accent', 'power', 'cast', 'script', 'science']:
    check(k in ep and ep[k], f'missing field: {k}')
title = ep.get('title') or []
check(isinstance(title, list) and len(title) == 2 and title[1].strip().endswith('؟'), 'title must be two lines, the second ending in «؟»')
check(bool(ep.get('accent')) and ep.get('accent', '') in ' '.join(title), 'accent is not a word of the title')

beats = ep.get('script') or []
text = ' '.join(b.get('text', '') for b in beats)
words = len(text.split())
lo, hi = (110, 150) if long_cut else (45, 65)
check(lo <= words <= hi, f'{words} words ({lo} to {hi}); about {words / 2.7:.0f} s')
for b in beats:
    for s in re.split(r'[.!؟?:]+', b.get('text', '')):
        if len(s.split()) > 12:
            check(False, f'a sentence of {len(s.split())} words (12 at most): «{s.strip()[:40]}…»')
            break

pi = next((i for i, b in enumerate(beats) if 'premise' in b.get('beat', '').lower() or 'title' in b.get('beat', '').lower()), None)
check(pi is not None and pi >= (1 if long_cut else 3), 'the premise beat must come after the demo beats (three in a short cut)')
check(pi is not None and 'ماذا لو' in beats[pi].get('text', ''), 'the premise line must say «ماذا لو»')
check('هذا حقيقي' in text, '«هذا حقيقي» is missing after the fact')
check(bool(beats) and beats[-1].get('text', '').strip().endswith(('؟', '?')), 'the last line must be a question')

# the cast: one spelling per name (cast.md), at most two per beat
NAMES = {'ستيكي مان': 'stickman', 'الظل': 'shadow', 'لينا': 'lina', 'الدكتور زيد': 'zed', 'زيد': 'zed', 'بروماكس': 'promax',
         'تيمو': 'timo', 'المعلم زن': 'zen', 'زن': 'zen', 'روبو': 'robo', 'غليتش': 'glitch', 'إيكو': 'echo',
         'تايتن زيرو': 'titan', 'تايتن': 'titan', 'كرونوس': 'chronos'}
WRONG = {'جليتش': 'غليتش', 'ستيك مان': 'ستيكي مان', 'الدكتور زد': 'الدكتور زيد', 'ايكو': 'إيكو', 'سنيكي مان': 'ستيكي مان'}
for w, right in WRONG.items():
    if w == 'ستيك مان':
        bad = re.search(r'ستيك مان(?!\S)', text.replace('ستيكي مان', ''))
    else:
        bad = w in text
    check(not bad, f'«{w}» is spelled «{right}» (cast.md)')
for i, b in enumerate(beats):
    said = {code for name, code in NAMES.items() if re.search(rf'(^|\s|[،,.]){re.escape(name)}($|\s|[،,.!؟])', b.get('text', ''))}
    listed = set(b.get('cast') or [])
    n = len(said | listed)
    check(n <= 2, f'beat {i + 1} puts {n} characters on screen: {", ".join(sorted(said | listed))}')
check(all('cast' in b for b in beats), 'every beat needs a "cast" list (who is on screen)')

# the fact: every number said is in science; every science entry is complete
sci = ep.get('science') or []
sci_text = json.dumps(sci, ensure_ascii=False)
AR = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
nums = set(re.findall(r'\d+(?:[.,]\d+)?', text.translate(AR)))
WORDNUM = ['ستين', 'ستون', 'خمسين', 'عشرين', 'ثلاثين', 'أربعين', 'مئة', 'مائة', 'ألف', 'مليون', 'مليار', 'نصف', 'ثلث', 'ثلثا', 'ربع', 'عشر']
check(bool(nums) or any(w in text for w in WORDNUM), 'the script states no number (the turn needs one real fact with a number)')
for n in nums:
    check(n in sci_text.translate(AR), f'the number {n} is said but not in science')
for i, s in enumerate(sci):
    check(all(s.get(k) for k in ('claim', 'working', 'source')), f'science entry {i + 1} needs claim, working and source')
    check(bool(re.search(r'(19|20)\d\d', s.get('source', ''))), f'science entry {i + 1}: the source has no year')

for f in fails:
    print('FAIL', f)
score = round(100 * (checks - len(fails)) / checks)
print(f'scriptcheck: {score}/100 ({checks - len(fails)} of {checks} checks pass; {words} words, about {words / 2.7:.0f} s)')
sys.exit(0 if not fails else 1)
