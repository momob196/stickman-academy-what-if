"""One free chat call, no SDK: OpenRouter's free models, a local Ollama, GitHub Models (free for every GitHub account, and the way to reach a model from inside
GitHub Actions, with the run's own GITHUB_TOKEN and `permissions: models: read`), or any OpenAI-compatible endpoint.

As a module:  from llm import chat, catalog
  chat(messages, model)            -> the reply's text
  catalog()                        -> the model ids GitHub Models offers this account
From a shell:
  python <skill>/scripts/llm.py --list
  python <skill>/scripts/llm.py --probe          the first two models that answer
  python <skill>/scripts/llm.py --model openai/gpt-4.1-mini "prompt"

Which service, in this order: LLM_BASE_URL (+ LLM_API_KEY) for any OpenAI-compatible endpoint (a local Ollama at
http://localhost:11434/v1 is free); OPENROUTER_API_KEY for OpenRouter, where --list and --probe keep only the free
models (":free", price 0); otherwise GitHub Models with GITHUB_TOKEN.
"""
import json, os, sys, time, urllib.error, urllib.request

GH = 'https://models.github.ai'
OR = 'https://openrouter.ai/api/v1'


def _req(url, body=None, key=None, accept='application/json'):
    h = {'Content-Type': 'application/json', 'Accept': accept}
    if key:
        h['Authorization'] = f'Bearer {key}'
    if url.startswith(GH):
        h['X-GitHub-Api-Version'] = '2022-11-28'
    if url.startswith(OR):
        h['X-Title'] = 'StickMan Academy What If'
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, headers=h, method='POST' if body is not None else 'GET')
    # a model on a CPU (Ollama on a GitHub runner) can take many minutes for one long answer
    with urllib.request.urlopen(req, timeout=1800 if 'localhost' in url or '127.0.0.1' in url else 300) as r:
        raw, status, final, ctype = r.read(), r.status, r.geturl(), r.headers.get('content-type', '')
    try:
        return json.loads(raw)
    except ValueError:
        moved = f', redirected to {final}' if final != url else ''
        raise RuntimeError(f'{url} answered HTTP {status} {ctype or "no content-type"}{moved}: {len(raw)} bytes, not JSON: {raw[:120]!r}')


# GitHub Models has two front doors: the current one, and the older Azure-hosted one (model ids without the
# publisher prefix there). If one gives back something that isn't a model's answer, the other is tried.
ENDPOINTS = [(f'{GH}/inference/chat/completions', lambda m: m),
             ('https://models.inference.ai.azure.com/chat/completions', lambda m: m.split('/')[-1])]


def _token():
    key = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
    if not key:
        raise SystemExit('no GITHUB_TOKEN (or LLM_BASE_URL): GitHub Models needs the token; inside Actions, set permissions: models: read')
    return key


def _base():
    """Which service: an explicit OpenAI-compatible LLM_BASE_URL (a local Ollama), else OpenRouter when
    OPENROUTER_API_KEY is set (its ":free" models cost nothing), else GitHub Models."""
    if os.environ.get('LLM_BASE_URL'):
        return os.environ['LLM_BASE_URL'].rstrip('/'), os.environ.get('LLM_API_KEY')
    if os.environ.get('OPENROUTER_API_KEY'):
        return OR, os.environ['OPENROUTER_API_KEY']
    return None, None


def _where():
    base, key = _base()
    if base:
        return [(base + '/chat/completions', lambda m: m)], key
    return ENDPOINTS, _token()


# when the catalog can't be read, these well-known ids are tried instead (probe() keeps the ones that answer)
FALLBACK = ['openai/gpt-4.1-mini', 'openai/gpt-4o-mini', 'deepseek/DeepSeek-V3-0324', 'openai/gpt-4.1', 'meta/Llama-4-Scout-17B-16E-Instruct',
            'mistral-ai/mistral-small-2503', 'xai/grok-3-mini', 'microsoft/Phi-4']


def catalog():
    base, bkey = _base()
    if base:  # OpenRouter (free models only) or a local server: both list their models at /models
        rows = _req(base + '/models', key=bkey)
        rows = rows.get('data', rows.get('models', [])) if isinstance(rows, dict) else rows
        if base == OR:
            free = lambda r: r.get('id', '').endswith(':free') or all(str((r.get('pricing') or {}).get(k, '1')) in ('0', '0.0') for k in ('prompt', 'completion'))
            rows = [r for r in rows if free(r)]
        return [r.get('id') or r.get('name') for r in rows if (r.get('id') or r.get('name'))]
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
    doors, key = _where()
    errors = []
    for url, name in doors:  # the first front door that gives a real answer wins
        body = {'model': name(model), 'messages': messages, 'temperature': temperature}
        for k in range(tries):
            try:
                r = _req(url, body, key)
                return r['choices'][0]['message']['content'] or ''
            except urllib.error.HTTPError as e:
                msg = e.read().decode(errors='replace')[:300]
                if e.code in (429, 500, 502, 503) and k < tries - 1:  # rate limit or a busy model: wait and try again
                    time.sleep(int(e.headers.get('retry-after') or 20 * (k + 1)))
                    continue
                if e.code == 400 and 'temperature' in msg and 'temperature' in body:  # some reasoning models take no temperature
                    body.pop('temperature', None)
                    continue
                errors.append(f'{url}: HTTP {e.code}: {msg}')
                break
            except (RuntimeError, KeyError, urllib.error.URLError) as e:  # not a model's answer: try the other door
                errors.append(str(e)[:240])
                break
    raise RuntimeError(f'{model}: ' + ' | '.join(errors))


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
