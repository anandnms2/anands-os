#!/usr/bin/env python3
"""Adapt the built upstream apps so they never talk to puter.com.
  * every https://js.puter.com/v2/ (the Puter.js SDK) -> /_suite/puter.js, our local shim
  * remove the old /_suite/config.js injection if present
  * strip third-party analytics (Plausible)
  * make absolute /asset hrefs relative so apps work under /apps/<slug>/
  * fix service-worker registration paths
usage: postprocess.py <dist/apps>"""
import os, re, sys

root = sys.argv[1]
SDK = "/_suite/puter.js"
SDK_RE = re.compile(rb"https://js\.puter\.com/v2/?")
html_n = js_n = stripped = rewired = sw = 0
# The Calendar's error messages name Puter and its hosted email service. Here, invitations go out through your own SMTP settings.
WORDING = [
    (b"The invitation service is unavailable right now.", b"Email is not set up yet. Open Settings in Anands OS, add your SMTP server, then try again."),
    (b"The email service needs an update before it can send cancellations.", b"Cancellation email could not be sent. Check Email (SMTP) in Anands OS Settings."),
    (b"The email service needs an update before it can send your reply.", b"Your reply could not be sent. Check Email (SMTP) in Anands OS Settings."),
    (b"The email service needs an update before it can send this event.", b"The invitation could not be prepared. Check Email (SMTP) in Anands OS Settings."),
    (b"Sign in to Puter again", b"Sign in to Anands OS again"),
]

for dp, _, files in os.walk(root):
    for f in files:
        p = os.path.join(dp, f)
        if f.endswith(".html"):
            s = open(p, encoding="utf-8", errors="surrogateescape").read()
            o = s
            s = s.replace('<script src="/_suite/config.js"></script>', "")
            s = re.sub(r"<script[^>]*plausible[^>]*>\s*</script>", "", s, flags=re.I)
            s = re.sub(r"<link[^>]+rel=[\"']?(?:preconnect|dns-prefetch)[\"']?[^>]+href=[\"']https?://[^\"']*puter\.com[^>]*>", "", s, flags=re.I)
            s = re.sub(r"<script(?![^>]*src)[^>]*>(?:(?!</script>).)*plausible(?:(?!</script>).)*</script>", "", s, flags=re.I | re.S)
            if s != o: stripped += 1
            app_root = os.path.join(root, os.path.relpath(p, root).split(os.sep)[0])
            rel_up = os.path.relpath(app_root, dp)
            prefix = "./" if rel_up == "." else rel_up.replace(os.sep, "/") + "/"
            def fix(m):
                global rewired
                target = m.group(2)
                if os.path.exists(os.path.join(app_root, target.split("#")[0].split("?")[0])):
                    rewired += 1
                    return f'{m.group(1)}="{prefix}{target}"'
                return m.group(0)
            s = re.sub(r'((?:href|src))="/([A-Za-z0-9][^"/][^"]*|[A-Za-z0-9])"', fix, s)
            s = SDK_RE.sub(SDK.encode(), s.encode("utf-8", "surrogateescape")).decode("utf-8", "surrogateescape")
            open(p, "w", encoding="utf-8", errors="surrogateescape").write(s)
            html_n += 1
        elif f.endswith(".js"):
            b = open(p, "rb").read()
            nb = SDK_RE.sub(SDK.encode(), b)
            nb = nb.replace(b'serviceWorker.register("/sw.js"', b'serviceWorker.register("./sw.js"')
            for a, b2 in WORDING:
                nb = nb.replace(a, b2)
            if nb != b:
                if SDK.encode() in nb and SDK_RE.search(b): js_n += 1
                if b'serviceWorker.register("./sw.js"' in nb and b'serviceWorker.register("/sw.js"' in b: sw += 1
                open(p, "wb").write(nb)

# verify: nothing that loads or calls the SDK from puter.com remains
left = 0
for dp, _, files in os.walk(root):
    for f in files:
        if f.endswith((".js", ".html")):
            if re.search(rb"js\.puter\.com", open(os.path.join(dp, f), "rb").read()): left += 1
print(f"postprocess: {html_n} html, SDK url rewritten in {js_n} js, analytics stripped from {stripped}, {rewired} abs refs relativised, {sw} sw paths fixed; files still naming js.puter.com: {left}")
