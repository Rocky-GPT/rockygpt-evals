"""Run the unchanged suite once, supervise its server, and record identities."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
import urllib.request

OUT = Path(__file__).parent
BRAIN = Path.cwd()
EVALS = BRAIN.parent / "rockygpt-evals" / "brain-reset"

def fingerprint(name):
    files = sorted(p for p in (BRAIN/"src").rglob("*") if p.is_file() and p.suffix in {".py", ".md"}) + [BRAIN/"pyproject.toml"]
    data = {"brain_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(), "brain_clean": not subprocess.check_output(["git", "status", "--porcelain"], text=True).strip(), "runtime_files": {str(p.relative_to(BRAIN)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}, "corpus_sha256": hashlib.sha256((EVALS/"conversations.json").read_bytes()).hexdigest(), "runner_sha256": hashlib.sha256((EVALS/"run.py").read_bytes()).hexdigest()}
    (OUT/name).write_text(json.dumps(data, indent=2)+"\n")
    return data

def readiness(name):
    with urllib.request.urlopen("http://127.0.0.1:8001/readiness", timeout=15) as response:
        data = json.load(response)
    (OUT/name).write_text(json.dumps(data, indent=2)+"\n")
    return data

assert not (OUT/"full-suite.json").exists(), "A full pass must start from an empty report"
before = fingerprint("fingerprints-before.json")
assert before["brain_clean"], "Runtime must be committed and clean"
assert before["corpus_sha256"] == "fb9604b7794a2dd92736271a0aa7013ce9710d093d2c61e81114524155ac72f2"
assert before["runner_sha256"] == "df03a1a0c34f3ec8199e4fbc559c6294a5d3b867e217206d5759b37d8e6c6ece"
print("Committed runtime:", before["brain_commit"], flush=True)
with (OUT/"server.log").open("w") as log:
    server = subprocess.Popen([sys.executable, str(OUT/"observe.py")], stdout=log, stderr=subprocess.STDOUT)
    try:
        for attempt in range(20):
            if server.poll() is not None:
                raise RuntimeError("Acceptance server exited before readiness")
            try:
                dataset = readiness("readiness-before.json")
                break
            except Exception:
                time.sleep(1)
        else:
            raise RuntimeError("Acceptance server did not become ready")
        print("Published dataset:", dataset["campus_data"]["dataset_version"], flush=True)
        result = subprocess.run([sys.executable, str(EVALS/"run.py"), "--base-url", "http://127.0.0.1:8001", "--interval", "15", "--output", str(OUT/"full-suite.json")])
        after = fingerprint("fingerprints-after.json")
        final_dataset = readiness("readiness-after.json")
        assert before == after, "Runtime or suite changed during acceptance"
        assert dataset == final_dataset, "Published dataset changed during acceptance"
        print("Runtime, suite, and published dataset remained unchanged.", flush=True)
    finally:
        server.terminate()
        try:
            server.wait(timeout=15)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait()
sys.exit(result.returncode)
