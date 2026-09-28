"""로컬 미리보기 서버. python3 -m http.server와 같지만 Cache-Control: no-store를 붙여서
CSS·JS를 고친 뒤 새로고침만 하면 바로 보인다(기본 서버는 브라우저가 옛 파일을 한동안 재사용한다).
사용: python3 scripts/serve.py 8940"""
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):  # 조용히
        pass


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8940
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
http.server.ThreadingHTTPServer(("", port), NoCacheHandler).serve_forever()
