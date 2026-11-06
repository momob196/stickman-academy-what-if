"""Free YouTube publishing through the YouTube Data API (no paid service, no vidIQ credits): fills in a private
video's title, description, tags and thumbnail from out/<slug>/publish.json. The video stays private; the person
makes it public themselves in YouTube Studio. Standard library only.

One-time setup (free): in Google Cloud Console make a project, enable "YouTube Data API v3", create an OAuth client
of type "Desktop app", download its JSON to .youtube/client_secret.json next to the studio, and add your Google
account as a test user on the OAuth consent screen. Then:

  python <skill>/scripts/youtube.py auth                      opens the browser once; keeps a token in .youtube/token.json
  python <skill>/scripts/youtube.py check <video-id|url>       shows the video's title and privacy (read only)
  python <skill>/scripts/youtube.py apply <slug> --video <id|url> [--dry] [--yes]
        --dry  prints exactly what would be written and touches nothing
        --yes  writes it (the person confirms the values first; without --yes nothing is written)
  python <skill>/scripts/youtube.py upload <slug> --audited --yes
        uploads out/<slug>/<slug>-final.mp4 as private. Only for a Google Cloud project that has passed YouTube's API
        audit: uploads from an unaudited project are locked private for good and can never be made public.

Safety: apply refuses a video that isn't private, never sets anything but private, and writes only with --yes. The
upload the person does in YouTube Studio (Create > Upload, visibility Private) is never locked.
Quota (free, 10,000 units a day): apply costs about 50 units, the thumbnail 50.
"""
import base64, hashlib, http.server, json, pathlib, re, secrets, sys, threading, time, urllib.error, urllib.parse, urllib.request, webbrowser

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
args = sys.argv[1:]
if not args:
    raise SystemExit(__doc__)
cmd = args[0]
opt = lambda k: args[args.index(k) + 1] if k in args and args.index(k) + 1 < len(args) else None
HOME = pathlib.Path(opt('--home') or '.youtube')
SECRET, TOKEN = HOME / 'client_secret.json', HOME / 'token.json'
SCOPE = 'https://www.googleapis.com/auth/youtube'
API = 'https://www.googleapis.com/youtube/v3'
CATEGORY = {'Entertainment': '24', 'Education': '27', 'Film & Animation': '1', 'Comedy': '23', 'Science & Technology': '28'}


def video_id(s):
    m = re.search(r'(?:v=|youtu\.be/|shorts/|/video/)([\w-]{11})', s or '')
    return m[1] if m else (s if re.fullmatch(r'[\w-]{11}', s or '') else None)


def client():
    if not SECRET.exists():
        raise SystemExit(f'no {SECRET}: create a Desktop OAuth client in Google Cloud and save its JSON there (see the top of this file)')
    c = json.loads(SECRET.read_text(encoding='utf-8'))
    return c.get('installed') or c.get('web')


def post(url, data):
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode(), headers={'Content-Type': 'application/x-www-form-urlencoded'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def auth():
    c = client()
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
    got = {}

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            got.update({k: v[0] for k, v in q.items()})
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write('تم. يمكنك إغلاق هذه الصفحة والعودة.'.encode())

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(('127.0.0.1', 0), H)
    redirect = f'http://127.0.0.1:{srv.server_port}'
    url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode({
        'client_id': c['client_id'], 'redirect_uri': redirect, 'response_type': 'code', 'scope': SCOPE,
        'access_type': 'offline', 'prompt': 'consent', 'code_challenge': challenge, 'code_challenge_method': 'S256'})
    threading.Thread(target=srv.handle_request, daemon=True).start()
    print('Opening Google sign-in in your browser. If it does not open, visit:\n' + url)
    webbrowser.open(url)
    for _ in range(600):
        if got:
            break
        time.sleep(0.5)
    if 'code' not in got:
        raise SystemExit(f'no sign-in code came back ({got.get("error", "timed out")})')
    tok = post('https://oauth2.googleapis.com/token', {'client_id': c['client_id'], 'client_secret': c.get('client_secret', ''),
                                                       'code': got['code'], 'code_verifier': verifier, 'grant_type': 'authorization_code', 'redirect_uri': redirect})
    HOME.mkdir(exist_ok=True)
    TOKEN.write_text(json.dumps({'refresh_token': tok['refresh_token']}), encoding='utf-8')
    print(f'signed in; token kept in {TOKEN} (keep it out of git)')


def access():
    if not TOKEN.exists():
        raise SystemExit(f'not signed in: python {sys.argv[0]} auth')
    c = client()
    return post('https://oauth2.googleapis.com/token', {'client_id': c['client_id'], 'client_secret': c.get('client_secret', ''),
                                                        'refresh_token': json.loads(TOKEN.read_text())['refresh_token'], 'grant_type': 'refresh_token'})['access_token']


def call(method, url, body=None, ctype='application/json'):
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers={'Authorization': f'Bearer {access()}', 'Content-Type': ctype})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        raise SystemExit(f'YouTube said {e.code}: {e.read().decode(errors="replace")[:600]}')


def get_video(vid):
    items = call('GET', f'{API}/videos?part=snippet,status&id={vid}').get('items') or []
    if not items:
        raise SystemExit(f'no video {vid} on the signed-in account')
    return items[0]


def package(slug):
    p = pathlib.Path('out') / slug / 'publish.json'
    if not p.exists():
        raise SystemExit(f'no {p}: the publishing agent writes it')
    pk = json.loads(p.read_text(encoding='utf-8'))
    if pk.get('privacy') != 'private':
        raise SystemExit('publish.json privacy is not "private": refusing')
    return pk


def body_for(pk, vid, current=None):
    snip = {'title': pk['title'][:100], 'description': pk['description'][:5000], 'tags': pk.get('tags', []),
            'categoryId': CATEGORY.get(pk.get('category', 'Entertainment'), '24'),
            'defaultLanguage': pk.get('language', 'ar'), 'defaultAudioLanguage': pk.get('language', 'ar')}
    status = {'privacyStatus': 'private'}
    if pk.get('made_for_kids') is not None:
        status['selfDeclaredMadeForKids'] = bool(pk['made_for_kids'])
    return {'id': vid, 'snippet': snip, 'status': status}


if cmd == 'auth':
    auth()
elif cmd == 'check':
    v = get_video(video_id(args[1]) or args[1])
    print(f'{v["id"]}: «{v["snippet"]["title"]}», privacy {v["status"]["privacyStatus"]}, channel {v["snippet"]["channelTitle"]}')
elif cmd == 'apply':
    slug, vid = args[1], video_id(opt('--video'))
    if not vid:
        raise SystemExit('give the private video: --video <id or link>')
    pk = package(slug)
    body = body_for(pk, vid)
    print(json.dumps(body, ensure_ascii=False, indent=1))
    thumb = pathlib.Path('out') / slug / 'thumbnail.jpg'
    print(f'thumbnail: {thumb if thumb.exists() else "none (run thumb.mjs)"}')
    if '--dry' in args or '--yes' not in args:
        print('dry run: nothing written' + ('' if '--dry' in args else ' (add --yes once the person has confirmed these values)'))
        sys.exit(0)
    cur = get_video(vid)
    if cur['status']['privacyStatus'] != 'private':
        raise SystemExit(f'the video is {cur["status"]["privacyStatus"]}, not private: refusing to touch it')
    call('PUT', f'{API}/videos?part=snippet,status', body)
    if thumb.exists() and thumb.stat().st_size <= 2 * 1024 * 1024:
        call('POST', f'https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}&uploadType=media', thumb.read_bytes(), 'image/jpeg')
    v = get_video(vid)
    print(f'done: «{v["snippet"]["title"]}», privacy {v["status"]["privacyStatus"]} (still private: publish it yourself in YouTube Studio)')
elif cmd == 'upload':
    slug = args[1]
    if '--audited' not in args or '--yes' not in args:
        raise SystemExit('upload needs --audited (your Google Cloud project passed the YouTube API audit; otherwise the video is locked private for good) and --yes')
    pk = package(slug)
    mp4 = pathlib.Path('out') / slug / f'{slug}-final.mp4'
    meta = body_for(pk, None)
    meta.pop('id')
    init = urllib.request.Request(f'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
                                  data=json.dumps(meta).encode(), method='POST',
                                  headers={'Authorization': f'Bearer {access()}', 'Content-Type': 'application/json; charset=UTF-8',
                                           'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': str(mp4.stat().st_size)})
    with urllib.request.urlopen(init, timeout=60) as r:
        loc = r.headers['Location']
    up = urllib.request.Request(loc, data=mp4.read_bytes(), method='PUT', headers={'Content-Type': 'video/mp4'})
    with urllib.request.urlopen(up, timeout=1800) as r:
        v = json.loads(r.read())
    print(f'uploaded as private: https://youtu.be/{v["id"]}')
else:
    raise SystemExit(__doc__)
