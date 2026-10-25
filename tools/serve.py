"""Local static server for the Small Plays (what .claude/launch.json runs). Like `python -m http.server`, plus:
- byte ranges (206 Partial Content): without them Chrome can't seek the soundtrack, and every jump on the timeline
  starts the floor over from 0 (GitHub Pages serves ranges, so the site itself is fine);
- `Cache-Control: no-cache`: the browser checks each file again, so an edited module is never run stale next to new ones.

python tools/serve.py [port] [directory]        → defaults: 8765, the folder above this repo (D:/ClaudeAbout/small-plays)
"""
import os, re, sys
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def send_head(self):
        m = re.fullmatch(r'bytes=(\d*)-(\d*)', self.headers.get('Range', '').strip())
        path = self.translate_path(self.path)
        if not m or not os.path.isfile(path):
            self.range = None
            return super().send_head()
        size = os.path.getsize(path)
        a, b = m.groups()
        start, end = (int(a), int(b) if b else size - 1) if a else (max(0, size - int(b or 0)), size - 1)
        if start >= size or start > end:
            self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return None
        end = min(end, size - 1)
        f = open(path, 'rb')
        f.seek(start)
        self.range = end - start + 1
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(self.range))
        self.send_header('Last-Modified', self.date_time_string(int(os.path.getmtime(path))))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        if not getattr(self, 'range', None):
            return super().copyfile(source, outputfile)
        left = self.range
        while left > 0:
            chunk = source.read(min(64 * 1024, left))
            if not chunk:
                break
            outputfile.write(chunk)
            left -= len(chunk)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    root = sys.argv[2] if len(sys.argv) > 2 else str(Path(__file__).resolve().parents[2])
    print(f'serving {root} at http://127.0.0.1:{port}/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=root)).serve_forever()
