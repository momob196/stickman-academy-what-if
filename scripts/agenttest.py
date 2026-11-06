"""The free agents' exam: runs the keyword researcher and the script writer on each free model with the same task and
the same data, grades every answer with keycheck.py and scriptcheck.py, times it, then has the fact checker read the
best script. The point is proof, not promises: a score out of 100 per model, measured by scripts that can't be
talked round. Runs the same on this machine and on GitHub Actions (.github/workflows/agents.yml).

python <skill>/scripts/agenttest.py [--seeds "ماذا لو,ستيك مان"] [--region SA]
    [--models "opencode/glm-5.3-flash-free,opencode/deepseek-v4.1-flash-free:max"] [--work agent-test] [--timeout 900]
A model may carry a reasoning level after a colon (":max"). Writes <work>/results.json and <work>/results.md (and
the GitHub job summary when GITHUB_STEP_SUMMARY is set); keeps every brief, script and log under <work>/.
"""
import json, os, pathlib, re, shutil, subprocess, sys, time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
SKILL = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
seeds = [s.strip() for s in opt('--seeds', 'ماذا لو,ستيك مان').split(',') if s.strip()]
region = opt('--region', 'SA')
models = [m.strip() for m in opt('--models', 'opencode/glm-5.3-flash-free,opencode/deepseek-v4.1-flash-free:max').split(',') if m.strip()]
work = pathlib.Path(opt('--work', 'agent-test')).resolve()
limit = int(opt('--timeout', 900))
py = sys.executable


def run(cmd, cwd=None, timeout=None):
    t0 = time.time()
    try:
        p = subprocess.run([str(c) for c in cmd], cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace',
                           timeout=timeout, env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
        out, code = p.stdout + p.stderr, p.returncode
    except subprocess.TimeoutExpired as e:
        out, code = (e.stdout or '') if isinstance(e.stdout, str) else '', 'timeout'
    return out, code, round(time.time() - t0)


def score(out):
    m = re.search(r'(\d+)/100', out)
    return int(m[1]) if m else 0


def tag(model):
    return re.sub(r'[^a-z0-9]+', '-', model.split('/')[-1].split(':')[0].replace('-free', ''))


def free(agent, task, model):
    name, _, variant = model.partition(':')
    cmd = [py, SKILL / 'scripts' / 'free.py', agent, task, '--model', name, '--dir', work]
    if variant:
        cmd += ['--variant', variant]
    return run(cmd, cwd=work, timeout=limit)


# the exam room: the agents, a studio with the example episodes, a research folder
shutil.rmtree(work, ignore_errors=True)
(work / '.opencode').mkdir(parents=True)
shutil.copytree(SKILL / 'opencode' / 'agents', work / '.opencode' / 'agents')
shutil.copytree(SKILL / 'studio' / 'src' / 'episodes', work / 'studio' / 'src' / 'episodes')
(work / 'research').mkdir()
logs = work / 'logs'
logs.mkdir()

# one data file for every model, so they are graded on the same facts
seed_args = [seeds[0]] + sum([['--seed', s] for s in seeds[1:]], [])
out, code, secs = run([py, SKILL / 'scripts' / 'keywords.py', *seed_args, '--region', region, '--top', '15', '--out', work / 'research' / 'data.json'])
(logs / 'keywords.log').write_text(out, encoding='utf-8')
if code != 0 or not (work / 'research' / 'data.json').exists():
    raise SystemExit(f'keywords.py failed ({code}):\n{out[-800:]}')
print(f'data: {len(json.loads((work / "research" / "data.json").read_text(encoding="utf-8"))["keywords"])} phrases in {secs} s')

results = {'seeds': seeds, 'region': region, 'data_seconds': secs, 'keywords': [], 'script': [], 'fact_check': None}
KW = ('Research keywords for a new StickMan Academy "What If" episode. The skill is in {skill} (that is <skill> in your '
      'instructions). The YouTube data is ALREADY in research/data.json: skip step 1 (do not run keywords.py), read that '
      'file, and write the brief to research/kw-{t}.md. Then run: python {skill}/scripts/keycheck.py research/kw-{t}.md '
      'research/data.json and fix the brief until it passes.')
for m in models:
    t = tag(m)
    out, code, secs = free('wi-keywords', KW.format(skill=SKILL, t=t), m)
    (logs / f'keywords-{t}.log').write_text(out, encoding='utf-8')
    brief = work / 'research' / f'kw-{t}.md'
    chk, _, _ = run([py, SKILL / 'scripts' / 'keycheck.py', brief, work / 'research' / 'data.json']) if brief.exists() else ('no brief written', 1, 0)
    (logs / f'keycheck-{t}.log').write_text(chk, encoding='utf-8')
    r = {'model': m, 'seconds': secs, 'exit': code, 'score': score(chk) if brief.exists() else 0,
         'failures': [l[5:] for l in chk.splitlines() if l.startswith('FAIL')][:8], 'brief': brief.name if brief.exists() else None}
    results['keywords'].append(r)
    print(f'keywords {m}: {r["score"]}/100 in {secs} s')

best = max(results['keywords'], key=lambda r: (r['score'], -r['seconds']))
premise = ''
if best['brief']:
    m = re.search(r'^##\s*فكرة الحلقة\s*\n+(.+)$', (work / 'research' / best['brief']).read_text(encoding='utf-8'), re.M)
    premise = m[1].strip() if m else ''
premise = premise or 'ماذا لو كان كل زر في العالم يضغط نفسه؟'
results['premise'] = premise

SC = ('Write the script of a new short What If episode. The skill is in {skill} (that is <skill> in your instructions); '
      'the studio is the folder "studio" here; the slug is "{slug}"; the premise is: {premise} ; the keyword brief is '
      'research/{brief}. When it is written, run from the studio folder: python {skill}/scripts/scriptcheck.py {slug} '
      'and fix the script until it passes.')
for m in models:
    t = tag(m)
    slug = f'test-{t}'
    out, code, secs = free('wi-script', SC.format(skill=SKILL, slug=slug, premise=premise, brief=best['brief'] or 'none'), m)
    (logs / f'script-{t}.log').write_text(out, encoding='utf-8')
    ep = work / 'studio' / 'src' / 'episodes' / slug / 'episode.json'
    chk, _, _ = run([py, SKILL / 'scripts' / 'scriptcheck.py', slug], cwd=work / 'studio') if ep.exists() else ('no episode.json written', 1, 0)
    (logs / f'scriptcheck-{t}.log').write_text(chk, encoding='utf-8')
    r = {'model': m, 'seconds': secs, 'exit': code, 'score': score(chk) if ep.exists() else 0,
         'failures': [l[5:] for l in chk.splitlines() if l.startswith('FAIL')][:8], 'slug': slug if ep.exists() else None}
    if ep.exists():
        try:
            r['lines'] = [b.get('text', '') for b in json.loads(ep.read_text(encoding='utf-8')).get('script', [])]
        except Exception as e:
            r['failures'].insert(0, f'episode.json does not parse: {e}')
            r['score'] = 0
    results['script'].append(r)
    print(f'script {m}: {r["score"]}/100 in {secs} s')

# the fact checker reads the best script (a second opinion on its one fact, graded by a person)
bs = max(results['script'], key=lambda r: (r['score'], -r['seconds']))
if bs.get('slug'):
    fc_model = next((m for m in models if m.endswith(':max')), models[0])
    task = (f'Check the science of studio/src/episodes/{bs["slug"]}/episode.json. The skill is in {SKILL}. '
            'Report in the shape your instructions give.')
    out, code, secs = free('wi-fact-check', task, fc_model)
    (logs / 'factcheck.log').write_text(out, encoding='utf-8')
    verdicts = re.findall(r'\b(OK|WRONG|OVERREACH)\b', out)
    results['fact_check'] = {'model': fc_model, 'seconds': secs, 'verdicts': verdicts, 'answer': out.strip().splitlines()[-15:]}

(work / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding='utf-8')
md = ['# Free agents: measured', '', f'Seeds: {", ".join(seeds)} · region {region} · data fetched in {results["data_seconds"]} s', '',
      '| Agent | Model | Score | Time | Main failures |', '|---|---|---|---|---|']
for kind, rows in (('wi-keywords', results['keywords']), ('wi-script', results['script'])):
    for r in rows:
        md.append(f'| {kind} | `{r["model"]}` | **{r["score"]}/100** | {r["seconds"]} s | {"; ".join(r["failures"][:3]) or "none"} |')
md += ['', f'Premise used for the scripts: {premise}', '']
if bs.get('lines'):
    md += [f'Best script ({bs["model"]}):', ''] + [f'> {l}' for l in bs['lines']] + ['']
if results['fact_check']:
    fc = results['fact_check']
    md += [f'Fact check (`{fc["model"]}`, {fc["seconds"]} s): {", ".join(fc["verdicts"]) or "no verdict line"}', '']
(work / 'results.md').write_text('\n'.join(md), encoding='utf-8')
if os.environ.get('GITHUB_STEP_SUMMARY'):
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as f:
        f.write('\n'.join(md) + '\n')
print('\n'.join(md))
