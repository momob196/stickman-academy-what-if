"""Keyword data for a What If episode, from YouTube itself, free and without an account or key.

python <skill>/scripts/keywords.py "<seed>" [--seed "<another>" ...] [--lang ar] [--region SA] [--top 12] [--out research/<name>.json]

1. Suggestions: YouTube's own search autocomplete for each seed, for the seed with a space and each letter of the
   alphabet after it, and for "ماذا لو <seed>" / "what if <seed>". A phrase YouTube offers first, and for more
   prefixes, is one more people type: that is the demand signal (`demand`, 0-100).
2. Results: for the best phrases, the first page of YouTube's video results (titles, views, upload age, length).
   From it: `median_views`, `fresh` (share of the top results uploaded in the last 30 days), `hot` (the best
   views-per-day among those fresh uploads), `exact` (share of top titles that contain the phrase: high means a
   crowded phrase), and `score`, which favours demand and fresh, hot results over crowded ones.
Writes the JSON (every number the research agent may quote) and prints the ranked table. No keys, no credits.
vidIQ, when connected, adds search volume and competition on top of this; it doesn't replace it.
"""
import json, pathlib, re, statistics, sys, time, urllib.parse, urllib.request

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
args = sys.argv[1:]
if not args or args[0].startswith('--'):
    raise SystemExit(__doc__)


def opt(name, default=None, many=False):
    vals = [args[i + 1] for i, a in enumerate(args) if a == name and i + 1 < len(args)]
    return vals if many else (vals[0] if vals else default)


seeds = [args[0]] + opt('--seed', many=True)
lang, region, top = opt('--lang', 'ar'), opt('--region', 'SA'), int(opt('--top', 12))
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'en'}
ALPHA = {'ar': 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي', 'en': 'abcdefghijklmnopqrstuvwxyz'}.get(lang, 'abcdefghijklmnopqrstuvwxyz')


def get(url, tries=3):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
                return r.read().decode('utf-8', 'replace')
        except Exception:
            time.sleep(1.5 * (k + 1))
    return ''


def suggest(q):
    u = 'https://suggestqueries.google.com/complete/search?' + urllib.parse.urlencode({'client': 'firefox', 'ds': 'yt', 'hl': lang, 'gl': region, 'q': q})
    try:
        return json.loads(get(u))[1]
    except Exception:
        return []


# 1. suggestions, weighted by position (first offered = most typed) and by how many prefixes surface the phrase
hits = {}
prefixes = []
for s in seeds:
    prefixes += [s, f'{s} '] + [f'{s} {c}' for c in ALPHA] + ([f'ماذا لو {s}'] if lang == 'ar' else [f'what if {s}'])
for q in prefixes:
    for rank, phrase in enumerate(suggest(q)[:10]):
        phrase = phrase.strip()
        h = hits.setdefault(phrase, {'weight': 0.0, 'prefixes': 0, 'best_rank': 99})
        h['weight'] += 1 / (rank + 1)
        h['prefixes'] += 1
        h['best_rank'] = min(h['best_rank'], rank + 1)
    time.sleep(0.15)
if not hits:
    raise SystemExit('YouTube returned no suggestions (offline, or the endpoint changed)')
wmax = max(h['weight'] for h in hits.values())
for h in hits.values():
    h['demand'] = round(100 * h['weight'] / wmax)


# 2. the first page of video results for the best phrases
AGE_UNITS = {'second': 1 / 86400, 'minute': 1 / 1440, 'hour': 1 / 24, 'day': 1, 'week': 7, 'month': 30, 'year': 365,
             's': 1 / 86400, 'min': 1 / 1440, 'm': 1 / 1440, 'h': 1 / 24, 'd': 1, 'w': 7, 'mo': 30, 'y': 365}


def age_days(txt):
    # YouTube writes it long ("3 weeks ago") or short ("6d ago", "3mo ago", "2y ago"): the longest unit name wins
    m = re.search(r'(\d+)\s*(second|minute|hour|day|week|month|year|min|mo|s|m|h|d|w|y)s?\b', txt or '')
    return int(m[1]) * AGE_UNITS[m[2]] if m else None


def views(txt):
    m = re.search(r'([\d,]+)\s+view', txt or '')
    return int(m[1].replace(',', '')) if m else (0 if txt and 'No views' in txt else None)


def results(q):
    u = 'https://www.youtube.com/results?' + urllib.parse.urlencode({'search_query': q, 'hl': 'en', 'gl': region, 'sp': 'EgIQAQ=='})
    m = None
    for k in range(3):  # YouTube now and then answers with a page that has no results data: ask again
        m = re.search(r'var ytInitialData = (\{.*?\});</script>', get(u), re.S)
        if m and 'videoRenderer' in m[1]:
            break
        time.sleep(2 * (k + 1))
    if not m:
        return []
    out = []

    def walk(o):
        if isinstance(o, dict):
            if 'videoRenderer' in o:
                v = o['videoRenderer']
                out.append({
                    'title': ''.join(r.get('text', '') for r in v.get('title', {}).get('runs', [])),
                    'channel': (v.get('ownerText', {}).get('runs') or [{}])[0].get('text', ''),
                    'views': views(v.get('viewCountText', {}).get('simpleText')),
                    'age_days': age_days(v.get('publishedTimeText', {}).get('simpleText')),
                    'length': v.get('lengthText', {}).get('simpleText'),
                    'id': v.get('videoId'),
                })
            for x in o.values():
                walk(x)
        elif isinstance(o, list):
            for x in o:
                walk(x)

    walk(json.loads(m[1]))
    return out[:15]


norm = lambda t: re.sub(r'[ً-ْـ]', '', t.lower())  # drop Arabic diacritics and tatweel for matching
ranked = sorted(hits.items(), key=lambda kv: -kv[1]['weight'])[: max(top * 2, 20)]
rows = []
for phrase, h in ranked:
    vids = results(phrase)
    time.sleep(0.4)
    vs = [v['views'] for v in vids if v['views'] is not None]
    fresh = [v for v in vids if v['age_days'] is not None and v['age_days'] <= 30]
    hot = max((v['views'] / max(v['age_days'], 0.5) for v in fresh if v['views']), default=0)
    exact = sum(1 for v in vids if norm(phrase) in norm(v['title'])) / len(vids) if vids else 0
    fresh_share = len(fresh) / len(vids) if vids else 0
    # demand first; fresh, hot results mean the phrase is moving now; a crowded exact phrase is harder to win
    score = round(0.5 * h['demand'] + 25 * fresh_share + 15 * min(1, hot / 50000) + 10 * (1 - exact), 1)
    rows.append({'phrase': phrase, 'demand': h['demand'], 'prefixes': h['prefixes'], 'best_rank': h['best_rank'],
                 'results': len(vids), 'median_views': int(statistics.median(vs)) if vs else None,
                 'fresh': round(fresh_share, 2), 'hot_views_per_day': int(hot), 'exact': round(exact, 2), 'score': score,
                 'top_videos': vids[:5]})
rows.sort(key=lambda r: -r['score'])
rows = rows[:top]

name = re.sub(r'\s+', '-', seeds[0].strip())[:40]
out = pathlib.Path(opt('--out', f'research/{name}.json'))
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({'seeds': seeds, 'lang': lang, 'region': region, 'fetched': time.strftime('%Y-%m-%d %H:%M'),
                           'source': 'YouTube search autocomplete and video results (public pages)', 'keywords': rows},
                          ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{"score":>5} {"demand":>6} {"fresh":>5} {"hot/day":>8} {"median":>9} {"exact":>5}  phrase')
for r in rows:
    print(f'{r["score"]:>5} {r["demand"]:>6} {r["fresh"]:>5} {r["hot_views_per_day"]:>8} {str(r["median_views"]):>9} {r["exact"]:>5}  {r["phrase"]}')
print(f'-> {out} ({len(hits)} suggestions seen, {len(rows)} ranked)')
