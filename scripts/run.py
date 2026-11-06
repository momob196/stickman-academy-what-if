"""The quiet runner: runs one pipeline step, keeps its full output in a log file, and prints only what a person (or
an agent) needs to read. Retries the steps that open a browser, which can miss its launch window on a busy machine.
Its job is to keep long logs out of the conversation: render progress, bundling percentages, npm notices and stack
traces go to the log, a few lines come back.

python <skill>/scripts/run.py <step> <slug> [extra args for the step]
Steps: voice, plan, castcheck, stills, board, sfx, mixcheck, motiongrid, master, framesheet
Writes out/<slug>/logs/<step>.log; prints at most 25 lines and the log's path; exits with the step's exit code.
"""
import pathlib, re, subprocess, sys

SKILL = pathlib.Path(__file__).resolve().parent
sys.stdout.reconfigure(encoding='utf-8', errors='replace')  # Arabic paths and text on a Windows console
if len(sys.argv) < 3:
    raise SystemExit(__doc__)
step, slug, extra = sys.argv[1], sys.argv[2], sys.argv[3:]
py, node = sys.executable, 'node'
STEPS = {
    'voice': [py, SKILL / 'voice.py'],
    'plan': [py, SKILL / 'plan.py'],
    'castcheck': [node, SKILL / 'castcheck.mjs'],
    'stills': [node, SKILL / 'stills.mjs'],
    'board': [py, SKILL / 'board.py'],
    'sfx': [py, SKILL / 'sfx.py'],
    'mixcheck': [py, SKILL / 'mixcheck.py'],
    'motiongrid': [py, SKILL / 'motiongrid.py'],
    'master': [py, SKILL / 'master.py'],
    'framesheet': [py, SKILL / 'framesheet.py'],
}
if step not in STEPS:
    raise SystemExit(f'unknown step {step!r}; one of: {", ".join(STEPS)}')
RETRY = {'stills': 3}  # master.py retries its own render
NOISE = re.compile(r'^\s*(at |npm notice|Bundling \d|Rendered \d+/\d+|Encoded \d+/\d+|Getting composition|\[\d+/\d+\]|node:internal)|is using incorrect casing')

log_dir = pathlib.Path('out') / slug / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)
log = log_dir / f'{step}.log'
cmd = [str(c) for c in STEPS[step]] + [slug] + extra
code = 1
with open(log, 'w', encoding='utf-8') as fh:
    for attempt in range(RETRY.get(step, 1)):
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace',
                           env={**__import__('os').environ, 'PYTHONIOENCODING': 'utf-8'})
        fh.write(f'$ {" ".join(cmd)}  (try {attempt + 1})\n{p.stdout}\n')
        code = p.returncode
        if code == 0 or 'Timed out' not in p.stdout:
            break
lines = [l for l in p.stdout.splitlines() if l.strip() and not NOISE.search(l)]
keep = lines if len(lines) <= 25 else lines[:5] + [f'... ({len(lines) - 25} lines in the log) ...'] + lines[-20:]
print('\n'.join(keep))
print(f'[{step}: {"ok" if code == 0 else f"exit {code}"}; full log: {log}]')
sys.exit(code)
