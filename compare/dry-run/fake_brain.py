"""A stand-in Brain for a dry run: answers POST /v1/chat with "GOOD" or "BAD", decided by the
question and RATE (the share of GOOD), the same every run. Standard library only."""
import hashlib, json, os, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

RATE = float(os.environ.get("RATE", "0.5"))

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        question = body["messages"][-1]["content"]
        roll = int(hashlib.sha256(question.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
        answer = "GOOD" if roll < RATE else "BAD"
        payload = json.dumps({"answer": f"{answer}: {question[:40]}", "status": "answered",
                              "citations": [{"url": "https://www.ramapo.edu/x/"}]}).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.end_headers(); self.wfile.write(payload)
    def log_message(self, *args):
        pass

HTTPServer(("127.0.0.1", int(sys.argv[1])), Handler).serve_forever()
