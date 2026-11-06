"""The free-model bridge: hands one task to an OpenCode agent running on a free model (GLM-5.3-Flash Free, DeepSeek
V4.1 Flash Free, Nemotron 3.5 Lightning Free) and prints only its final answer. Lets Claude Code (or anything with
a shell) push the mechanical and checking work of an episode onto models that cost nothing.

python <skill>/scripts/free.py <agent> "<task>" [--model provider/id] [--variant max] [--file img.jpg ...] [--dir .]
  <agent>    one of the OpenCode agents in .opencode/agents/ (wi-runner, wi-board-check, wi-motion-check,
             wi-fact-check, wi-mix-fix, wi-shots), or "build" for OpenCode's own general agent
  --model    override the agent's model (opencode models | grep free lists what's free today)
  --variant  reasoning effort where the model has levels (DeepSeek V4.1 Flash Free goes up to "max")
  --file     attach images (a storyboard or frame sheet for the checkers)
Exits 2 when OpenCode is missing or too old for the free tier (it needs 1.18.0 or newer). Runs OpenCode with its own
data folder, <dir>/.opencode-free/, so an expired key in your OpenCode sign-ins can't block the free tier.
"""
import os, pathlib, re, shutil, subprocess, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if len(sys.argv) < 3:
    raise SystemExit(__doc__)
agent, task, rest = sys.argv[1], sys.argv[2], sys.argv[3:]
oc = shutil.which('opencode')
if not oc:
    print('OpenCode is not installed: npm install -g opencode-ai@latest')
    sys.exit(2)
ver = subprocess.run([oc, '--version'], capture_output=True, text=True).stdout.strip()
nums = tuple(int(n) for n in re.findall(r'\d+', ver)[:3]) or (0,)
if nums < (1, 18, 0):
    print(f'OpenCode {ver} is too old for the free models (1.18.0 or newer): npm install -g opencode-ai@latest')
    sys.exit(2)


def opt(name, many=False):
    vals = [rest[i + 1] for i, a in enumerate(rest) if a == name and i + 1 < len(rest)]
    return vals if many else (vals[0] if vals else None)


cmd = [oc, 'run', '--agent', agent]
for flag in ('--model', '--variant', '--dir'):
    if opt(flag):
        cmd += [flag, opt(flag)]
for f in opt('--file', many=True):
    cmd += ['--file', f]
cmd.append(task)
# The free tier needs no key, and an old or expired key saved in OpenCode's own sign-ins blocks it ("This API key
# has expired"). Run with a data folder of its own next to the project (.opencode-free/), so the free agents never
# read or change the person's OpenCode sign-ins. MCP sign-ins for the free agents (vidIQ) live there too.
data = pathlib.Path(opt('--dir') or '.').resolve() / '.opencode-free'
data.mkdir(exist_ok=True)
# no input: a permission prompt in a headless run fails at once instead of waiting for an answer that never comes
p = subprocess.run(cmd, capture_output=True, stdin=subprocess.DEVNULL, text=True, encoding='utf-8', errors='replace', env={**os.environ, 'XDG_DATA_HOME': str(data)})
text = re.sub(r'\x1b\[[0-9;]*m', '', p.stdout + ('\n' + p.stderr if p.returncode else ''))
# OpenCode prints the tool calls it made, then the answer: keep the answer (the last block), at most 40 lines
lines = [l for l in text.splitlines() if l.strip()]
print('\n'.join(lines[-40:]) if lines else '(no answer)')
if 'migrations' in text or 'constraint failed' in text:
    print('OpenCode\'s local database looks broken (failed data migrations): updating OpenCode usually fixes it')
sys.exit(p.returncode)
