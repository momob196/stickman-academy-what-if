"""One free chat call, no SDK: GitHub Models (free for every GitHub account, and the way to reach a model from inside
GitHub Actions, with the run's own GITHUB_TOKEN and `permissions: models: read`), or any OpenAI-compatible endpoint.

As a module:  from llm import chat, catalog
  chat(messages, model)            -> the reply's text
  catalog()                        -> the model ids GitHub Models offers this account
From a shell:
  python <skill>/scripts/llm.py --list
  python <skill>/scripts/llm.py --probe          the first two models that answer
  python <skill>/scripts/llm.py --model openai/gpt-4.1-mini "prompt"

Environment: GITHUB_TOKEN (or GH_TOKEN) for GitHub Models. LLM_BASE_URL and LLM_API_KEY point it at another
OpenAI-compatible endpoint instead (a local Ollama at http://localhost:11434/v1 is free too).
"""
import json, os, sys, time, urllib.error, urllib.request

GH = 'https://models.github.ai'


def _req(url, body=None, key=None, accept='application/json'):
    h = {'Content-Type': 'application/json', 'Accept': accept}
    if key:
        h['Authorization'] = f'Bearer {key}'
    if url.startswith(GH):
        h['X-GitHub-Api-Version'] = '2022-11-28'
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=h, method='POST' if body is not None else 'GET')
    with urllib.request.urlopen(req, timeout=300) as r:
        raw = r.read()
    try:
        return json.loads(raw)
    except ValueError:
        raise RuntimeError(f'{url} answered {len(raw)} bytes that are not JSON: {raw[:200]!r}')


def _where():
    base, key = os.environ.get('LLM_BASE_URL'), os.environ.get('LLM_API_KEY')
    if base:
        return base.rstrip('/') + '/chat/completions', key
    key = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
    if not key:
        raise SystemExit('no GITHUB_TOKEN (or LLM_BASE_URL): GitHub Models needs the token; inside Actions, set permissions: models: read')
    return f'{GH}/inference/chat/completions', key


# when the catalog can't be read, these well-known ids are tried instead (probe() keeps the ones that answer)
FALLBACK = ['openai/gpt-4.1-mini', 'openai/gpt-4o-mini', 'deepseek/DeepSeek-V3-0324', 'openai/gpt-4.1', 'meta/Llama-4-Scout-17B-16E-Instruct',
            'mistral-ai/mistral-small-2503', 'xai/grok-3-mini', 'microsoft/Phi-4']


def catalog():
    key = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
    try:
        rows = _req(f'{GH}/catalog/models', key=key, accept='application/vnd.github+json')
        ids = [r['id'] for r in rows if isinstance(r, dict) and r.get('id')]
        if ids:
            return ids
        print(f'catalog: no ids in the answer: {str(rows)[:200]}', file=sys.stderr)
    except Exception as e:
        print(f'catalog unreadable ({e}); trying well-known ids', file=sys.stderr)
    return FALLBACK


def probe(ids, want=2):
    """The first `want` models that actually answer a one-line request (cheap: a few tokens each)."""
    ok = []
    for m in ids:
        try:
            if 'OK' in chat([{'role': 'user', 'content': 'Reply with exactly: OK'}], m, tries=2).upper():
                ok.append(m)
                print(f'  {m}: answers', file=sys.stderr)
        except Exception as e:
            print(f'  {m}: {str(e)[:160]}', file=sys.stderr)
        if len(ok) == want:
            break
    return ok


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
    elif '--probe' in a:
        found = probe(catalog())
        print('\n'.join(found) or 'no model answered')
        sys.exit(0 if found else 1)
    elif '--model' in a:
        m = a[a.index('--model') + 1]
        print(chat([{'role': 'user', 'content': a[-1]}], m))
    else:
        raise SystemExit(__doc__)
