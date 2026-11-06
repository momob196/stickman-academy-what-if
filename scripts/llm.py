"""One free chat call, no SDK: GitHub Models (free for every GitHub account, and the way to reach a model from inside
GitHub Actions, with the run's own GITHUB_TOKEN and `permissions: models: read`), or any OpenAI-compatible endpoint.

As a module:  from llm import chat, catalog
  chat(messages, model)            -> the reply's text
  catalog()                        -> the model ids GitHub Models offers this account
From a shell:
  python <skill>/scripts/llm.py --list
  python <skill>/scripts/llm.py --model openai/gpt-4.1-mini "prompt"

Environment: GITHUB_TOKEN (or GH_TOKEN) for GitHub Models. LLM_BASE_URL and LLM_API_KEY point it at another
OpenAI-compatible endpoint instead (a local Ollama at http://localhost:11434/v1 is free too).
"""
import json, os, sys, time, urllib.error, urllib.request

GH = 'https://models.github.ai'


def _req(url, body=None, key=None):
    h = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    if key:
        h['Authorization'] = f'Bearer {key}'
    if url.startswith(GH):
        h['X-GitHub-Api-Version'] = '2022-11-28'
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=h, method='POST' if body is not None else 'GET')
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read())


def _where():
    base, key = os.environ.get('LLM_BASE_URL'), os.environ.get('LLM_API_KEY')
    if base:
        return base.rstrip('/') + '/chat/completions', key
    key = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
    if not key:
        raise SystemExit('no GITHUB_TOKEN (or LLM_BASE_URL): GitHub Models needs the token; inside Actions, set permissions: models: read')
    return f'{GH}/inference/chat/completions', key


def catalog():
    key = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
    rows = _req(f'{GH}/catalog/models', key=key)
    return [r['id'] for r in rows if 'chat' in json.dumps(r.get('capabilities', r.get('supported_output_modalities', 'chat')))] or [r['id'] for r in rows]


def chat(messages, model, temperature=0.3, tries=4):
    url, key = _where()
    body = {'model': model, 'messages': messages, 'temperature': temperature}
    for k in range(tries):
        try:
            r = _req(url, body, key)
            return r['choices'][0]['message']['content'] or ''
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')[:400]
            if e.code in (429, 500, 502, 503) and k < tries - 1:  # rate limit or a busy model: wait and try again
                time.sleep(int(e.headers.get('retry-after') or 20 * (k + 1)))
                continue
            if e.code == 400 and 'temperature' in msg:  # some reasoning models take no temperature
                body.pop('temperature', None)
                continue
            raise RuntimeError(f'{model}: HTTP {e.code}: {msg}')
    raise RuntimeError(f'{model}: no answer after {tries} tries')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    a = sys.argv[1:]
    if '--list' in a:
        print('\n'.join(catalog()))
    elif '--model' in a:
        m = a[a.index('--model') + 1]
        print(chat([{'role': 'user', 'content': a[-1]}], m))
    else:
        raise SystemExit(__doc__)
