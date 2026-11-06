"""Checks a keyword brief against the data it claims to come from: the proof that the keyword agent didn't make
anything up and followed the channel's rules.

python <skill>/scripts/keycheck.py research/<name>.md research/<name>.json
Prints one line per failure and a score out of 100 (100 = every check passes); exits 1 below 100.

Checks: every phrase in the table is in the data (grounded) and its numbers match the data exactly; 5 to 8 rows;
nothing off-limits (politics, war, real countries in conflict, other people's franchises and brands); a title of at
most 70 characters that contains the first phrase (or all its words); a two-line description; 8 to 15 tags of at most
30 characters, the first one a table phrase; a premise that starts with «ماذا لو» and ends with «؟»; the sources.
"""
import json, re, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if len(sys.argv) < 3:
    raise SystemExit(__doc__)
brief = open(sys.argv[1], encoding='utf-8').read()
data = json.load(open(sys.argv[2], encoding='utf-8'))
norm = lambda t: re.sub(r'\s+', ' ', re.sub(r'[ً-ْـ]', '', (t or '').strip().lower()))
known = {norm(k['phrase']): k for k in data['keywords']}
# words that mark a phrase the channel must not use (politics, war, conflict, other people's franchises and brands)
BANNED = ['ايران', 'إيران', 'اسرائيل', 'إسرائيل', 'فلسطين', 'غزة', 'حرب', 'الحرب', 'روسيا', 'اوكرانيا', 'أمريكا', 'امريكا',
          'ترامب', 'رئيس', 'سقطت', 'داعش', 'ماين كرافت', 'ماينكرافت', 'minecraft', 'دراغون بول', 'dragon ball', 'بندريتا',
          'henry stickmin', 'فورتنايت', 'fortnite', 'روبلوكس', 'roblox', 'سبايدر', 'spider', 'ناروتو', 'naruto']


def section(title):
    m = re.search(rf'^##\s*{re.escape(title)}\s*\n(.*?)(?=^##\s|\Z)', brief, re.M | re.S)
    return m[1].strip() if m else None


fails, checks = [], 0


def check(ok, msg):
    global checks
    checks += 1
    if not ok:
        fails.append(msg)


for name in ['الكلمات المفتاحية', 'العنوان', 'الوصف', 'الوسوم', 'فكرة الحلقة', 'المصادر']:
    check(section(name) is not None, f'missing section: ## {name}')

table = section('الكلمات المفتاحية') or ''
rows = [[c.strip() for c in l.strip().strip('|').split('|')] for l in table.splitlines() if l.strip().startswith('|')]
rows = [r for r in rows if r and not set(r[0]) <= set('-: ') and norm(r[0]) not in ('العبارة', 'phrase')]
check(5 <= len(rows) <= 8, f'table has {len(rows)} rows (5 to 8)')
grounded = 0
for r in rows:
    k = known.get(norm(r[0]))
    if not k:
        fails.append(f'not in the data: "{r[0]}"')
        continue
    grounded += 1
    want = [k['demand'], k['fresh'], k['hot_views_per_day'], k['median_views']]
    got = r[1:5]
    for label, w, g in zip(['demand', 'fresh', 'hot/day', 'median'], want, got):
        try:
            same = w is None and g.lower() in ('none', '-', '') or abs(float(str(g).replace(',', '')) - float(w)) <= 0.011 * max(1, abs(float(w)))
        except (ValueError, TypeError):
            same = False
        check(same, f'"{r[0]}": {label} is {g}, the data says {w}')
check(rows and grounded == len(rows), f'{grounded} of {len(rows)} phrases are in the data')

everything = norm(' '.join([table, section('العنوان') or '', section('الوصف') or '', section('الوسوم') or '', section('فكرة الحلقة') or '']))
bad = [b for b in BANNED if norm(b) in everything]
check(not bad, f'off-limits words used: {", ".join(bad)}')

title = (section('العنوان') or '').splitlines()[0].strip() if section('العنوان') else ''
check(0 < len(title) <= 70, f'title is {len(title)} characters (1 to 70)')
if rows:
    first = norm(rows[0][0])
    check(first in norm(title) or all(w in norm(title) for w in first.split()), f'title doesn\'t contain the first phrase "{rows[0][0]}"')
desc = [l for l in (section('الوصف') or '').splitlines() if l.strip()]
check(len(desc) == 2, f'description has {len(desc)} lines (2)')
tags = [t.strip() for t in re.split(r'[,،]', section('الوسوم') or '') if t.strip()]
check(8 <= len(tags) <= 15, f'{len(tags)} tags (8 to 15)')
check(all(len(t) <= 30 for t in tags), 'a tag is longer than 30 characters')
check(bool(tags) and norm(tags[0]) in known, 'the first tag is not a phrase from the data')
prem = (section('فكرة الحلقة') or '').strip().splitlines()[0] if section('فكرة الحلقة') else ''
check(prem.startswith('ماذا لو') and prem.rstrip().endswith('؟'), 'the premise must start with «ماذا لو» and end with «؟»')
check('research/' in (section('المصادر') or '') or '.json' in (section('المصادر') or ''), 'sources don\'t name the data file')

for f in fails:
    print('FAIL', f)
score = round(100 * (checks - len(fails)) / checks)
print(f'keycheck: {score}/100 ({checks - len(fails)} of {checks} checks pass; {grounded}/{len(rows)} phrases grounded)')
sys.exit(0 if not fails else 1)
