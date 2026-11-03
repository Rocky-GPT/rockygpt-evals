"""Send the frozen messy-student set once to the LIVE site, keeping every full response.

  python3 run_messy.py <out.json>
Posts each question as a single-turn chat to the production site's /api/chat (what
`rocky ask --prod` uses). Only the "question" text is sent, never the expected reply.
Checks the frozen file's hash first and refuses to run on a changed file. Two at a time."""
import collections, datetime, hashlib, json, os, secrets, sys, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
out = sys.argv[1]
blob = (HERE / "questions-frozen.json").read_text()
want = (HERE / "questions-frozen.sha256").read_text().split()[0]
if hashlib.sha256(blob.encode()).hexdigest() != want:
    sys.exit("the frozen question file changed")
cases = json.loads(blob)
url = os.environ.get("ROCKY_PROD_SITE", "https://rockygpt.danielrajakumar.com").rstrip("/") + "/api/chat"


def ask(case):
    # One client token per question, like one browser tab each, so the site's per-tab limit
    # doesn't refuse the run; a 429 is waited out and retried (at most 3 times).
    req = urllib.request.Request(url,
        data=json.dumps({"messages": [{"role": "user", "content": case["question"]}]}).encode(),
        headers={"content-type": "application/json", "accept": "application/json",
                 "x-rockygpt-client": secrets.token_hex(16)})
    for attempt in range(4):
        answered_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
        t0 = time.time()
        try:
            body = json.load(urllib.request.urlopen(req, timeout=170))
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < 3:
                time.sleep(int(exc.headers.get("retry-after") or 20))
                continue
            body = {"error": f"HTTP {exc.code}: {exc.read()[:300]!r}"}
        except Exception as exc:  # noqa: BLE001
            body = {"error": str(exc)[:300]}
        break
    return {**case, "answered_at": answered_at, "seconds": round(time.time() - t0, 1), "body": body}


with ThreadPoolExecutor(2) as pool:
    rows = list(pool.map(ask, cases))
Path(out).write_text(json.dumps(rows, indent=1, ensure_ascii=False))
print(len(rows), collections.Counter((r["body"].get("status") or "ERROR") for r in rows))
for group, n in collections.Counter(r["group"] for r in rows).items():
    print(f"  {group}: {n} questions")
