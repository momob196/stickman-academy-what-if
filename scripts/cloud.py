"""Render an episode on GitHub's servers (GitHub Actions) instead of this machine.

Local, from the studio folder, after the sound step (voice.wav, sfx.wav, music.wav exist):
    python <skill>/scripts/cloud.py <slug> [--sync-engine] [--no-wait]
  copies the episode into the skill repository's cloud/<slug>/, commits and pushes it, starts the "render" workflow,
  waits for it and downloads the result into out/<slug>/cloud/. Needs git and the GitHub CLI (gh auth login), and
  the skill folder to be a clone of your own repository. --sync-engine first copies this studio's src/engine into
  the repository's studio, with src/studio.config.ts and public/fonts (when you changed them locally); without
  it, a difference in any of them stops the run.

In the workflow, from the repository root:
    python scripts/cloud.py --stage <slug>
  puts cloud/<slug>/ back into studio/ (episode, audio, costs) and registers the episode for rendering.
No ElevenLabs calls either way: the voice and the sound were made locally.
"""
import filecmp, hashlib, json, pathlib, re, shutil, subprocess, sys, time

REPO = pathlib.Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
args = sys.argv[1:]
AUDIO = ['voice.wav', 'sfx.wav', 'music.wav']
SHARED = ['src/engine', 'src/studio.config.ts', 'public/fonts']  # what the repository's studio must match locally


def sh(*cmd, cwd=REPO, check=True, capture=True):
    p = subprocess.run(list(cmd), cwd=cwd, capture_output=capture, text=True, encoding='utf-8', errors='replace')
    if check and p.returncode:
        raise SystemExit(f'{" ".join(cmd)} failed:\n{(p.stderr or p.stdout)[-1500:]}')
    return (p.stdout or '').strip()


def tree_hash(d: pathlib.Path):
    h = hashlib.sha1()
    if d.is_file():
        h.update(d.read_bytes())
        return h.hexdigest()
    for f in sorted(d.rglob('*')) if d.exists() else []:
        if f.is_file():
            h.update(str(f.relative_to(d)).encode())
            h.update(f.read_bytes())
    return h.hexdigest()


def stage(slug):
    """In the workflow: cloud/<slug> -> studio/, and add the episode to the registry."""
    src = REPO / 'cloud' / slug
    if not src.exists():
        raise SystemExit(f'cloud/{slug} is not in the repository: push it with cloud.py <slug> first')
    studio = REPO / 'studio'
    ep = studio / 'src' / 'episodes' / slug
    shutil.copytree(src / 'src', ep, dirs_exist_ok=True)
    shutil.copytree(src / 'public', studio / 'public' / slug, dirs_exist_ok=True)
    if (src / 'costs.json').exists():
        (studio / 'out' / slug).mkdir(parents=True, exist_ok=True)
        shutil.copy2(src / 'costs.json', studio / 'out' / slug / 'costs.json')
    name = re.search(r'export const (\w+)\s*=\s*defineEpisode', (ep / 'index.tsx').read_text(encoding='utf-8'))
    if not name:
        raise SystemExit(f'no "export const x = defineEpisode(...)" in {ep / "index.tsx"}')
    reg = studio / 'src' / 'episodes' / 'index.ts'
    text = reg.read_text(encoding='utf-8')
    if f"from './{slug}'" not in text:
        text = text.replace('export const EPISODES = [', f"import {{ {name[1]} }} from './{slug}';\n\nexport const EPISODES = [", 1)
        text = re.sub(r'export const EPISODES = \[(.*?)\]', lambda m: f'export const EPISODES = [{m[1]}, {name[1]}]', text, flags=re.S)
        reg.write_text(text, encoding='utf-8')
    print(f'staged {slug} ({name[1]}) into studio/')


def push_and_render(slug):
    studio = pathlib.Path.cwd()
    if not (studio / 'src' / 'episodes').exists():
        raise SystemExit('run this from the studio folder (the one with src/episodes and package.json)')
    if shutil.which('gh') is None:
        raise SystemExit('the GitHub CLI (gh) is not installed: https://cli.github.com, then gh auth login')
    remote = sh('git', 'remote', 'get-url', 'origin', check=False)
    if 'github.com' not in remote:
        raise SystemExit(f'{REPO} has no GitHub "origin" remote (found: {remote or "none"})')
    ep, pub = studio / 'src' / 'episodes' / slug, studio / 'public' / slug
    missing = [f for f in AUDIO if not (pub / f).exists()]
    if missing:
        raise SystemExit(f'missing {", ".join(missing)} in {pub}: run voice.py and sfx.py first')
    # the episode is drawn with this studio's engine, settings (the title face) and fonts: the repository must carry
    # the same ones, or the cloud render looks different (a missing titleFont falls back to another face)
    differ = [s for s in SHARED if tree_hash(studio / s) != tree_hash(REPO / 'studio' / s)]
    if differ:
        if '--sync-engine' not in args:
            raise SystemExit(f'this studio differs from the repository in {", ".join(differ)}: add --sync-engine to copy them over (and commit them)')
        for s in differ:
            src, dst = studio / s, REPO / 'studio' / s
            shutil.copytree(src, dst, dirs_exist_ok=True) if src.is_dir() else shutil.copy2(src, dst)
        print(f'synced into the repository: {", ".join(differ)}')
    dst = REPO / 'cloud' / slug
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(ep, dst / 'src')
    (dst / 'public').mkdir(parents=True)
    for f in AUDIO:
        shutil.copy2(pub / f, dst / 'public' / f)
    costs = studio / 'out' / slug / 'costs.json'
    if costs.exists():
        shutil.copy2(costs, dst / 'costs.json')
    paths = ['cloud/' + slug] + ['studio/' + s for s in SHARED]
    sh('git', 'add', *paths)
    if sh('git', 'status', '--porcelain', *paths, check=False):
        sh('git', 'commit', '-m', f'cloud: render {slug}')
    branch = sh('git', 'rev-parse', '--abbrev-ref', 'HEAD')
    print(f'pushing {branch} ...')
    sh('git', 'push', 'origin', branch)
    before = sh('gh', 'run', 'list', '--workflow', 'render.yml', '--limit', '1', '--json', 'databaseId', '-q', '.[0].databaseId', check=False)
    sh('gh', 'workflow', 'run', 'render.yml', '--ref', branch, '-f', f'slug={slug}')
    run_id = before
    for _ in range(30):  # the new run takes a few seconds to appear
        time.sleep(3)
        run_id = sh('gh', 'run', 'list', '--workflow', 'render.yml', '--limit', '1', '--json', 'databaseId', '-q', '.[0].databaseId', check=False)
        if run_id and run_id != before:
            break
    url = sh('gh', 'run', 'view', run_id, '--json', 'url', '-q', '.url', check=False)
    print(f'workflow started: {url}')
    if '--no-wait' in args:
        print(f'later: gh run download {run_id} -D out/{slug}/cloud')
        return
    ok = subprocess.run(['gh', 'run', 'watch', run_id, '--exit-status', '--interval', '20'], cwd=REPO,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
    if not ok:
        raise SystemExit(f'the cloud render failed: gh run view {run_id} --log-failed   ({url})')
    out = studio / 'out' / slug / 'cloud'
    shutil.rmtree(out, ignore_errors=True)
    sh('gh', 'run', 'download', run_id, '-D', str(out))
    rep = next(out.rglob('report.json'), None)
    if rep:
        r = json.loads(rep.read_text(encoding='utf-8'))
        print(f"done: {r.get('seconds')} s, {r.get('lufs')} LUFS, peak {r.get('true_peak_dbtp')} dBTP -> {out}")
    else:
        print(f'done -> {out}')


if args and args[0] == '--stage':
    stage(args[1])
elif args:
    push_and_render(args[0])
else:
    raise SystemExit(__doc__)
