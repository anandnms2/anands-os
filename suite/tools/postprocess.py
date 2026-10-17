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
    # Meeting links: Calendar events and the Meetings app use this server's /meet page (guests need no account), not meetings.puter.com.
    (b"var fa=`https://meetings.puter.com/`", b"var fa=location.origin+`/meet/`"),
    (rb"/^https:\/\/meetings\.puter\.com\/#\/m\/", rb"/^https?:\/\/[^\/]+\/meet\/#\/m\/"),
]
# Only in the Meetings app: the room directory and the share link live on this server.
MEETINGS = [
    (b'"https://puter-meetings-rooms.puter.work"', b"location.origin"),
    (b"location.origin+location.pathname", b'location.origin+"/meet/"'),
    # Branding: this is Anands Meeting, not Puter Meetings
    ('r("b",{},"Puter")," Meetings"'.encode(), 'r("b",{},"Anands")," Meeting"'.encode()),
    ("Puter Meetings".encode(), "Anands Meeting".encode()),
    ("Open Meetings from your Puter desktop to see".encode(), "Open Meeting from Anands OS to see".encode()),
    ("Sign in with Puter to continue".encode(), "Sign in to Anands OS to continue".encode()),
    ("Can’t reach Puter’s connection service — retrying…".encode(), "Can’t reach the meeting server — retrying…".encode()),
    ("Can’t reach Puter’s connection service. Check your connection and try again.".encode(), "Can’t reach the meeting server. Check your connection and try again.".encode()),
    ("or sign in with Puter to start it yourself.".encode(), "or sign in to Anands OS to start it yourself.".encode()),
    ("Guests without a Puter account may not be able to connect until Puter can be reached again.".encode(), "Guests may not be able to connect until the meeting server can be reached again.".encode()),
    ("Puter can be reached again — guests without an account can connect.".encode(), "The meeting server can be reached again — guests can connect.".encode()),
    ("Your browser blocked the Puter window. Allow pop-ups for this site, then try again.".encode(), "Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.".encode()),
    ("The Puter window closed before we could get you in. Try again.".encode(), "The sign-in window closed before we could get you in. Try again.".encode()),
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
            if os.sep + "meetings" + os.sep in p:
                for a, b2 in MEETINGS:
                    nb = nb.replace(a, b2)
            if nb != b:
                if SDK.encode() in nb and SDK_RE.search(b): js_n += 1
                if b'serviceWorker.register("./sw.js"' in nb and b'serviceWorker.register("/sw.js"' in b: sw += 1
                open(p, "wb").write(nb)

# Anands Meeting: page title and install name
for rel, pairs in (("meetings/index.html", [("<title>Puter Meetings</title>", "<title>Anands Meeting</title>")]), ("meetings/manifest.json", [("Puter Meetings", "Anands Meeting"), ('"short_name": "Meetings"', '"short_name": "Meeting"')])):
    q = os.path.join(root, rel)
    if os.path.exists(q):
        t = open(q, encoding="utf-8", errors="surrogateescape").read()
        for x, y in pairs: t = t.replace(x, y)
        open(q, "w", encoding="utf-8", errors="surrogateescape").write(t)

# Contacts: Card Scan features (scan a card, card photos, notes, reminders, sharing) added by an overlay script
ov = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "overlays", "contacts-cards.js")
ci = os.path.join(root, "contacts", "index.html")
if os.path.exists(ov) and os.path.exists(ci):
    import shutil
    shutil.copy(ov, os.path.join(root, "contacts", "cards-overlay.js"))
    t = open(ci, encoding="utf-8", errors="surrogateescape").read()
    if "cards-overlay.js" not in t:
        t = t.replace("</body>", '<script src="./cards-overlay.js" defer></script></body>', 1)
        open(ci, "w", encoding="utf-8", errors="surrogateescape").write(t)
    print("postprocess: Card Scan overlay added to Contacts")

# verify: nothing that loads or calls the SDK from puter.com remains
left = 0
for dp, _, files in os.walk(root):
    for f in files:
        if f.endswith((".js", ".html")):
            if re.search(rb"js\.puter\.com", open(os.path.join(dp, f), "rb").read()): left += 1
print(f"postprocess: {html_n} html, SDK url rewritten in {js_n} js, analytics stripped from {stripped}, {rewired} abs refs relativised, {sw} sw paths fixed; files still naming js.puter.com: {left}")
