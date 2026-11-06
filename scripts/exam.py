"""The free agents' exam, direct mode: the model only writes text, the scripts do everything else. For each model,
the keyword researcher, the script writer and the publisher get their own instructions (the agent files in
opencode/agents/) and the data in one message; the answer is saved, graded by keycheck / scriptcheck /
publishcheck, and the failures are sent back for up to three rounds. Every score is measured, not claimed.
Works anywhere a free chat model is reachable: GitHub Models inside GitHub Actions (the run's own token), or any
OpenAI-compatible endpoint (scripts/llm.py).

python <skill>/scripts/exam.py [--models auto|id,id] [--seeds "ماذا لو,ستيك مان"] [--region SA] [--work exam] [--rounds 3]
Writes <work>/results.json and results.md (and the GitHub job summary), with every answer and check under <work>/.
"""
import json, os, pathlib, re, shutil, subprocess, sys, time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
SKILL = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL / 'scripts'))
from llm import chat, catalog, probe  # noqa: E402

args = sys.argv[1:]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
seeds = [s.strip() for s in opt('--seeds', 'ماذا لو,ستيك مان').split(',') if s.strip()]
region, rounds = opt('--region', 'SA'), int(opt('--rounds', 3))
work = pathlib.Path(opt('--work', 'exam')).resolve()
py = sys.executable
PREFER = ['glm', 'deepseek', 'qwen', 'gpt-4.1-mini', 'gpt-4o-mini', 'llama-4', 'gemma', 'mistral', 'grok', 'phi-4', 'gpt-4.1']


def pick_models():
    want = opt('--models', 'auto')
    if want != 'auto':
        return [m.strip() for m in want.split(',') if m.strip()]
    ids = catalog()
    print(f'{len(ids)} models to choose from: {", ".join(ids[:40])}', flush=True)
    ranked = [i for p in PREFER for i in ids if p in i.lower() and 'embed' not in i.lower()]
    ranked = list(dict.fromkeys(ranked + [i for i in ids if 'embed' not in i.lower()]))
    chosen = probe(ranked)  # only models that really answer
    if not chosen:
        raise SystemExit('no free model answered: see the lines above')
    return chosen


def run(cmd, cwd=None):
    p = subprocess.run([str(c) for c in cmd], cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace', env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
    return p.stdout + p.stderr, p.returncode


def instructions(agent):
    body = re.sub(r'^---.*?---\n', '', (SKILL / 'opencode' / 'agents' / f'{agent}.md').read_text(encoding='utf-8'), flags=re.S)
    return (body.replace('<skill>', str(SKILL)) + '\n\nIn this exam you have no tools: the data you would read is in the message. '
            'Answer with the complete file and nothing else (no explanation, no code fence).')


def strip(text):
    t = text.strip()
    m = re.search(r'```(?:json|markdown|md)?\s*\n(.*?)```', t, re.S)
    return (m[1] if m else t).strip()


def task(model, agent, prompt, save, check, kind):
    """Ask, save, grade, send the failures back; return the record of every round."""
    msgs = [{'role': 'system', 'content': instructions(agent)}, {'role': 'user', 'content': prompt}]
    rec = {'model': model, 'rounds': [], 'seconds': 0}
    t0 = time.time()
    for r in range(rounds):
        try:
            ans = chat(msgs, model)
        except Exception as e:
            rec['rounds'].append({'score': 0, 'error': str(e)[:300]})
            break
        text = strip(ans)
        save.parent.mkdir(parents=True, exist_ok=True)
        save.write_text(text, encoding='utf-8')
        out, code = check()
        m = re.search(r'(\d+)/100', out)
        sc = 0 if code == 2 else (int(m[1]) if m else 0)
        fails = [l[5:] for l in out.splitlines() if l.startswith('FAIL')]
        if kind == 'json':
            try:
                json.loads(text)
            except Exception as e:
                sc, fails = 0, [f'not valid JSON: {e}'] + fails
        rec['rounds'].append({'score': sc, 'failures': fails[:10]})
        print(f'    round {r + 1}: {sc}/100', flush=True)
        if sc == 100:
            break
        msgs += [{'role': 'assistant', 'content': ans},
                 {'role': 'user', 'content': 'The check failed:\n' + '\n'.join(fails or [out[-600:]]) + '\nReturn the complete corrected file only.'}]
    rec['seconds'] = round(time.time() - t0)
    rec['score'] = rec['rounds'][-1]['score'] if rec['rounds'] else 0
    rec['first_try'] = rec['rounds'][0]['score'] if rec['rounds'] else 0
    rec['failures'] = rec['rounds'][-1].get('failures') or ([rec['rounds'][-1]['error']] if rec['rounds'] and 'error' in rec['rounds'][-1] else [])
    return rec


shutil.rmtree(work, ignore_errors=True)
(work / 'research').mkdir(parents=True)
studio = work / 'studio'
shutil.copytree(SKILL / 'studio' / 'src' / 'episodes', studio / 'src' / 'episodes')
done = SKILL / 'cloud' / 'blink-swap' / 'src'
if done.exists():
    shutil.copytree(done, studio / 'src' / 'episodes' / 'blink-swap', dirs_exist_ok=True)

seed_args = [seeds[0]] + sum([['--seed', s] for s in seeds[1:]], [])
data_path = work / 'research' / 'data.json'
out, code = run([py, SKILL / 'scripts' / 'keywords.py', *seed_args, '--region', region, '--top', '15', '--out', data_path])
if code or not data_path.exists():
    raise SystemExit(f'keywords.py failed:\n{out[-800:]}')
data = json.loads(data_path.read_text(encoding='utf-8'))
# what the model needs from the data: every number it may quote, and a few titles per phrase for flavour
slim = {'fetched': data['fetched'], 'keywords': [{k: v for k, v in kw.items() if k != 'top_videos'} | {'top_titles': [t['title'] for t in kw['top_videos'][:3]]} for kw in data['keywords']]}
print(f'data: {len(data["keywords"])} phrases', flush=True)

models = pick_models()
print(f'models: {", ".join(models)}', flush=True)
res = {'seeds': seeds, 'region': region, 'models': models, 'keywords': [], 'script': [], 'publish': []}
ref = lambda n: (SKILL / 'references' / n).read_text(encoding='utf-8')
example = (studio / 'src' / 'episodes' / 'blink-swap' / 'episode.json').read_text(encoding='utf-8') if (studio / 'src' / 'episodes' / 'blink-swap').exists() else ''

for m in models:
    t = re.sub(r'[^a-z0-9]+', '-', m.lower()).strip('-')
    print(f'{m}', flush=True)
    # 1. keywords
    brief = work / 'research' / f'kw-{t}.md'
    print('  wi-keywords', flush=True)
    r = task(m, 'wi-keywords', 'research/data.json, already fetched:\n' + json.dumps(slim, ensure_ascii=False) + f'\n\nWrite research/kw-{t}.md.', brief,
             lambda: run([py, SKILL / 'scripts' / 'keycheck.py', brief, data_path]), 'md')
    res['keywords'].append(r)
    prem = re.search(r'^##\s*فكرة الحلقة\s*\n+(.+)$', brief.read_text(encoding='utf-8'), re.M) if brief.exists() else None
    premise = prem[1].strip() if prem else 'ماذا لو كان كل زر في العالم يضغط نفسه؟'
    # 2. script
    slug = f'test-{t}'
    ep = studio / 'src' / 'episodes' / slug / 'episode.json'
    print('  wi-script', flush=True)
    r = task(m, 'wi-script', f'references/formula.md:\n{ref("formula.md")}\n\nreferences/cast.md:\n{ref("cast.md")}\n\nAn example episode.json (for the shape, not the content):\n{example}\n\n'
             f'The keyword brief:\n{brief.read_text(encoding="utf-8") if brief.exists() else "(none)"}\n\nSlug: {slug}. Premise: {premise}\nShort cut (45 to 65 words). '
             'Write src/episodes/' + slug + '/episode.json.', ep, lambda: run([py, SKILL / 'scripts' / 'scriptcheck.py', slug], cwd=studio), 'json')
    r['premise'] = premise
    if ep.exists():
        try:
            r['lines'] = [b.get('text', '') for b in json.loads(ep.read_text(encoding='utf-8')).get('script', [])]
        except Exception:
            pass
    res['script'].append(r)
    # 3. the YouTube package for the finished blink-swap
    if example:
        pdir = studio / 'out' / 'blink-swap'
        pdir.mkdir(parents=True, exist_ok=True)
        (pdir / 'report.json').write_text(json.dumps({'seconds': 25.1}), encoding='utf-8')
        pj = pdir / 'publish.json'
        print('  wi-publish', flush=True)
        r = task(m, 'wi-publish', f'src/episodes/blink-swap/episode.json:\n{example}\n\nout/blink-swap/report.json: {{"seconds": 25.1}}\n\nreferences/cast.md:\n{ref("cast.md")}\n\n'
                 'No keyword brief. Write out/blink-swap/publish.json.', pj, lambda: run([py, SKILL / 'scripts' / 'publishcheck.py', 'blink-swap'], cwd=studio), 'json')
        if pj.exists():
            shutil.copy2(pj, work / 'research' / f'publish-{t}.json')
            try:
                r['title'] = json.loads(pj.read_text(encoding='utf-8')).get('title')
            except Exception:
                pass
        res['publish'].append(r)

(work / 'results.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
md = ['# Free agents: measured', '', f'Seeds: {", ".join(seeds)} · region {region} · models on GitHub Models (free)', '',
      '| Agent | Model | First try | Final | Rounds | Time | Left over |', '|---|---|---|---|---|---|---|']
for kind, rows in (('wi-keywords', res['keywords']), ('wi-script', res['script']), ('wi-publish', res['publish'])):
    for r in rows:
        md.append(f'| {kind} | `{r["model"]}` | {r["first_try"]}/100 | **{r["score"]}/100** | {len(r["rounds"])} | {r["seconds"]} s | {"; ".join(r["failures"][:2]) or "none"} |')
best = max(res['script'], key=lambda r: r['score'], default=None)
if best and best.get('lines'):
    md += ['', f'Best script ({best["model"]}), premise: {best["premise"]}', ''] + [f'> {l}' for l in best['lines']]
bp = max(res['publish'], key=lambda r: r['score'], default=None)
if bp and bp.get('title'):
    md += ['', f'Best YouTube title ({bp["model"]}): {bp["title"]}']
(work / 'results.md').write_text('\n'.join(md), encoding='utf-8')
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as f:
        f.write('\n'.join(md) + '\n')
print('\n'.join(md))
