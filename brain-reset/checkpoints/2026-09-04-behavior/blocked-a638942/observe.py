"""Acceptance-only passive profiler. No application functions are replaced."""
import json
import os
from pathlib import Path
import threading
import time
import uvicorn
from rockygpt_brain.api.app import app

OUT = Path('/tmp/rockygpt-behavior-final-20260905T032903Z/observations.jsonl')
state = threading.local()
lock = threading.Lock()

def observe(frame, event, arg):
    name = frame.f_code.co_name
    if name not in {'chat_worker', 'run_turn', 'review_answer', 'create'}:
        return
    filename = frame.f_code.co_filename.replace('\\', '/')
    try:
        if name == 'chat_worker' and filename.endswith('/rockygpt_brain/api/app.py'):
            if event == 'call':
                state.turn = {'requestId': frame.f_locals['request_id'], 'campus_time': frame.f_locals['now'].isoformat(), 'model_calls': 0, 'evidence': [], 'trace': [], 'reviews': [], 'model_responses': [], 'connection_errors': []}
                state.started = time.monotonic()
            elif event == 'return' and getattr(state, 'turn', None) is not None:
                row = state.turn
                row['worker_seconds'] = time.monotonic() - state.started
                if isinstance(arg, dict):
                    row['response_status'] = arg.get('status')
                    row['metrics'] = arg.get('metrics')
                    row['model'] = arg.get('model')
                    row['datasetVersion'] = arg.get('datasetVersion')
                elif hasattr(arg, 'body'):
                    row['error_response'] = json.loads(arg.body)
                with lock:
                    with OUT.open('a') as handle:
                        handle.write(json.dumps(row, ensure_ascii=False, default=str) + '\n')
                state.turn = None
        elif name == 'create' and event in ('call', 'return') and filename.endswith('/openai/resources/responses/responses.py'):
            if getattr(state, 'turn', None) is not None:
                if event == 'call':
                    state.turn['model_calls'] += 1
                    state.model_started = time.monotonic()
                elif arg is not None:
                    state.turn['model_responses'].append({'model': getattr(arg, 'model', None), 'status': getattr(arg, 'status', None), 'seconds': time.monotonic() - state.model_started, 'usage': arg.usage.model_dump() if getattr(arg, 'usage', None) else None})
        elif name == 'review_answer' and event == 'return' and filename.endswith('/rockygpt_brain/engine.py'):
            if getattr(state, 'turn', None) is not None:
                state.turn['reviews'].append({'candidate': frame.f_locals['answer'].model_dump(), 'verdict': arg.model_dump() if arg is not None else None})
        elif name == 'run_turn' and event == 'return' and filename.endswith('/rockygpt_brain/engine.py'):
            if getattr(state, 'turn', None) is not None:
                state.turn['evidence'] = list(frame.f_locals.get('evidence', {}).values())
                state.turn['trace'] = frame.f_locals.get('trace', [])
    except Exception as error:
        print('Acceptance observer error:', type(error).__name__, flush=True)

print(json.dumps({'runtime_file': __import__('rockygpt_brain.api.app', fromlist=['app']).__file__, 'model': os.getenv('OPENAI_CHAT_MODEL') or 'gpt-5.4', 'key_configured': bool(os.getenv('OPENAI_API_KEY')), 'protected_chat': bool(os.getenv('STAGING_SERVICE_TOKEN'))}), flush=True)
def trace_errors(frame, event, arg):
    if event == 'exception' and frame.f_code.co_name == 'chat_worker' and getattr(state, 'turn', None) is not None:
        error = arg[1]
        if type(error).__name__ in {'APIConnectionError', 'APITimeoutError'}:
            causes = []
            while error is not None:
                causes.append({'type': type(error).__name__, 'errno': getattr(error, 'errno', None)})
                error = error.__cause__
            state.turn['connection_errors'].append(causes)
    return trace_errors if frame.f_code.co_name == 'chat_worker' else None

threading.setprofile(observe)
threading.settrace(trace_errors)
uvicorn.run(app, host='127.0.0.1', port=8001)
