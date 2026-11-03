"""Send a fresh question set to a laptop Brain, one single-turn message each, keeping every full response.

  python3 run_fresh.py <port> practice <out.json>   # any number of times while building
  python3 run_fresh.py <port> check <out.json>      # once, at the very end
Talks to http://127.0.0.1:<port>/v1/chat with the diagnostics header, two questions at a time.
Only the "question" text is sent, never the expected reply. The check set's hash is checked first,
and the runner refuses to run on a changed file."""
import collections, datetime, hashlib, json, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
port, which, out = sys.argv[1], sys.argv[2], sys.argv[3]
if which == "check":
    blob = (HERE / "check-frozen.json").read_text()
    want = (HERE / "check-frozen.sha256").read_text().split()[0]
    if hashlib.sha256(blob.encode()).hexdigest() != want:
        sys.exit("the frozen check set changed")
elif which == "practice":
    blob = (HERE / "practice.json").read_text()
else:
    sys.exit("which set: practice or check")
cases = json.loads(blob)
only = set(sys.argv[4].split(",")) if len(sys.argv) > 4 and which == "practice" else None
if only:
    cases = [c for c in cases if c["id"] in only]


def ask(case):
    req = urllib.request.Request(f"http://127.0.0.1:{port}/v1/chat",
        data=json.dumps({"messages": [{"role": "user", "content": case["question"]}]}).encode(),
        headers={"content-type": "application/json", "x-rockygpt-diagnostics": "1"})
    answered_at = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    t0 = time.time()
    try:
        body = json.load(urllib.request.urlopen(req, timeout=170))
    except Exception as exc:  # noqa: BLE001
        body = {"error": str(exc)[:300]}
    return {**case, "answered_at": answered_at, "seconds": round(time.time() - t0, 1), "body": body}


with ThreadPoolExecutor(2) as pool:
    rows = list(pool.map(ask, cases))
Path(out).write_text(json.dumps(rows, indent=1, ensure_ascii=False))
print(len(rows), collections.Counter((r["body"].get("status") or "ERROR") for r in rows))
for group, n in collections.Counter(r["group"] for r in rows).items():
    print(f"  {group}: {n} questions")
