#!/usr/bin/env python3
"""Tiny local server for on-the-spot copy editing of wayfair-new.html.

Run from anywhere:  python3 tools/edit-server.py
Then open:          http://localhost:8777/wayfair-new.html?edit

- GET /wayfair-new.html?edit  -> serves the page with an inline editor injected
  (contenteditable text + a Save button). The editor is NEVER written to disk.
- GET anything else           -> normal static file serving from the project dir.
- POST /__save                -> overwrites wayfair-new.html with the cleaned HTML
                                 the editor sends (editor artifacts already removed).

Only wayfair-new.html can be written, and the server binds to 127.0.0.1 only.
"""
import json
import os
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # repo root
EDITABLE_FILES = {"wayfair-new.html"}
PORT = 8777

EDITOR = r"""
<style id="wf-editor-style">
  [data-wfedit] { outline: 1px dashed transparent; outline-offset: 2px; transition: outline-color .15s; border-radius: 2px; }
  [data-wfedit]:hover { outline-color: rgba(128,21,102,.45); }
  [data-wfedit]:focus { outline: 2px solid #801566 !important; background: rgba(128,21,102,.04); }
  #wf-bar { position: fixed; right: 16px; bottom: 16px; z-index: 99999;
    display: flex; gap: 8px; align-items: center; padding: 10px 12px;
    background: #201e1d; color: #fff; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.25);
    font: 600 13px/1 "Archivo", system-ui, sans-serif; }
  #wf-bar button { font: inherit; cursor: pointer; border: 0; border-radius: 8px; padding: 9px 14px; }
  #wf-bar .wf-save { background: #801566; color: #fff; }
  #wf-bar .wf-save:hover { background: #9a1a7b; }
  #wf-bar .wf-revert { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4); }
  #wf-bar .wf-revert:hover { border-color: #fff; }
  #wf-bar .wf-status { opacity: .7; font-weight: 400; max-width: 180px; }
</style>
<div id="wf-bar">
  <span class="wf-status" id="wf-status">Edit any text, then Save</span>
  <button class="wf-revert" id="wf-revert" type="button">Revert</button>
  <button class="wf-save" id="wf-save" type="button">Save</button>
</div>
<script id="wf-editor-script">
(function () {
  var SEL = 'h1,h2,h3,p,li,dt,dd,figcaption,.cs-eyebrow,.cs-hero-eyebrow,.wf-tag,.wf-tldr-label,.cs-impact-num,.cs-impact-label,.wf-group-h,.cs-meta dt,.cs-meta dd,.cs-next-name,.cs-next-co,.cs-h2';
  var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
  els.forEach(function (el) {
    // skip elements that only contain other editable blocks
    if (el.querySelector(SEL)) return;
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.setAttribute('data-wfedit', '1');
  });
  var status = document.getElementById('wf-status');
  var version = '__WF_VERSION__';

  document.getElementById('wf-revert').addEventListener('click', function () {
    if (confirm('Discard your unsaved edits and reload the last saved version?')) {
      window.location.reload();
    }
  });

  document.getElementById('wf-save').addEventListener('click', function () {
    status.textContent = 'Saving...';
    var clone = document.documentElement.cloneNode(true);
    ['wf-bar', 'wf-editor-style', 'wf-editor-script'].forEach(function (id) {
      var n = clone.querySelector('#' + id);
      if (n) n.remove();
    });
    // Drop nodes injected at runtime by third-party scripts (Font Awesome kit
    // styles, Clarity tags, etc.) so only authored markup is saved.
    clone.querySelectorAll('style[id^="fa-"], script[src*="clarity.ms"], script[src*="fontawesome.com/releases"]').forEach(function (n) { n.remove(); });
    // Drop inline styles written at runtime (nav scroll state, emptied styles).
    clone.querySelectorAll('nav.nav-collapse, nav.nav-collapse [style], [style=""]').forEach(function (n) { n.removeAttribute('style'); });
    clone.querySelectorAll('[data-wfedit]').forEach(function (n) {
      n.removeAttribute('contenteditable');
      n.removeAttribute('spellcheck');
      n.removeAttribute('data-wfedit');
    });
    var html = ('<!DOCTYPE html>\n' + clone.outerHTML + '\n').replace(/\n(?:[ \t]*\n){2,}/g, '\n\n');
    fetch('/__save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: html, file: location.pathname.replace(/^\//, ''), version: version })
    }).then(function (r) {
      if (r.status === 409) {
        return r.json().then(function (j) {
          throw new Error('file changed since you opened it. Your edits are safe in ' + j.copy + '. Reload to continue.');
        });
      }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      version = j.version;
      var t = new Date().toLocaleTimeString();
      status.textContent = 'Saved at ' + t;
    }).catch(function (e) {
      status.textContent = 'Save failed: ' + e.message;
    });
  });
})();
</script>
"""


def file_version(path):
    return str(os.stat(path).st_mtime_ns)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=BASE, **kw)

    def do_GET(self):
        parsed = urlparse(self.path)
        name = parsed.path.lstrip("/")
        if name in EDITABLE_FILES and "edit" in parsed.query:
            try:
                with open(os.path.join(BASE, name), "r", encoding="utf-8") as f:
                    page = f.read()
            except OSError as e:
                self.send_error(500, str(e))
                return
            editor = EDITOR.replace("__WF_VERSION__", file_version(os.path.join(BASE, name)))
            if "</body>" in page:
                page = page.replace("</body>", editor + "\n</body>", 1)
            else:
                page = page + editor
            body = page.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/__save":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            html = data["html"]
            if not isinstance(html, str) or "<html" not in html.lower():
                raise ValueError("payload does not look like a full HTML document")
            name = data.get("file", "")
            if name not in EDITABLE_FILES:
                raise ValueError("file not editable: %r" % name)
            target = os.path.join(BASE, name)
            if data.get("version") != file_version(target):
                # The file changed since this tab loaded it (or the tab predates
                # version tracking). Never overwrite: keep the tab's edits in a
                # side copy instead.
                stamp = time.strftime("%Y%m%d-%H%M%S")
                copy = "%s.conflict-%s.html" % (name[:-5], stamp)
                with open(os.path.join(BASE, copy), "w", encoding="utf-8") as f:
                    f.write(html)
                resp = json.dumps({"ok": False, "copy": copy}).encode("utf-8")
                self.send_response(409)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
                return
            with open(target, "w", encoding="utf-8") as f:
                f.write(html)
            resp = json.dumps({"ok": True, "version": file_version(target)}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
        except Exception as e:  # noqa: BLE001
            self.send_error(400, str(e))

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("edit-server on http://127.0.0.1:%d" % PORT)
    httpd.serve_forever()
