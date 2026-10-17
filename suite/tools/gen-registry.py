#!/usr/bin/env python3
"""Generate launcher/apps.json from the upstream HeyPuter/everything README.
usage: gen-registry.py <upstream-checkout> <out.json>"""
import json, re, sys, os

up, out = sys.argv[1], sys.argv[2]
# Upstream apps this OS does not ship at all: not built, not listed, no icon.
REMOVED = {"notes", "records", "whiteboard", "tasks", "wiki", "assets", "childcare", "contracts", "crm", "field-service", "fleet",
           "help-desk", "hiring", "inventory", "legal", "pos", "property-management", "shifts", "accounting", "cap-table", "expense", "invoicing"}
readme = open(os.path.join(up, "README.md"), encoding="utf-8").read()
cat = None
apps = []
strip = lambda t: re.sub(r"<[^>]+>", "", t).replace("&nbsp;", " ").strip()
for line in readme.splitlines():
    m = re.match(r"^## (.+)$", line)
    if m:
        cat = m.group(1).strip()
        continue
    if not line.startswith("<tr><td") or 'src="src/' not in line and 'src="./src/' not in line:
        continue
    slug = re.search(r'src="(?:\./)?src/([a-z0-9-]+)/icon', line)
    tds = re.findall(r"<td[^>]*>(.*?)</td>", line)
    name = re.search(r"<strong>(.*?)</strong>", line)
    if not (slug and name and len(tds) >= 2):
        continue
    slug = slug.group(1)
    if slug in REMOVED:
        continue
    src = os.path.join(up, "src", slug)
    apps.append({
        "slug": slug,
        "name": strip(name.group(1)),
        "category": cat,
        "alternativeTo": strip(tds[1]),
        "hasSource": os.path.exists(os.path.join(src, "package.json")),
    })
apps.sort(key=lambda a: a["slug"])
json.dump(apps, open(out, "w"), indent=2)
print(f"{len(apps)} apps, {sum(a['hasSource'] for a in apps)} buildable")
