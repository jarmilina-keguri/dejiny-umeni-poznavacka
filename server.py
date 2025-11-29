import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs

PORT = 8000
DB_FILE = 'db.json'

class MyRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/questions':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.wfile.write(json.dumps(data['questions']).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/questions':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            new_question = json.loads(post_data.decode('utf-8'))

            with open(DB_FILE, 'r+', encoding='utf-8') as f:
                data = json.load(f)
                data['questions'].append(new_question)
                f.seek(0)
                json.dump(data, f, ensure_ascii=False, indent=4)
                f.truncate()

            self.send_response(201)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
        else:
            self.send_error(404, "Not Found")

    def do_PUT(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/questions':
            content_length = int(self.headers['Content-Length'])
            put_data = self.rfile.read(content_length)
            updated_questions = json.loads(put_data.decode('utf-8'))

            # Expecting a list of questions to replace the current list (simplest for now)
            # Or we could implement ID-based updates, but for now full list replacement is easier for reordering/editing.
            
            with open(DB_FILE, 'r+', encoding='utf-8') as f:
                data = json.load(f)
                data['questions'] = updated_questions
                f.seek(0)
                json.dump(data, f, ensure_ascii=False, indent=4)
                f.truncate()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
        else:
            self.send_error(404, "Not Found")

print(f"Server running at http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), MyRequestHandler) as httpd:
    httpd.serve_forever()
