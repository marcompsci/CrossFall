#!/usr/bin/env python3
"""Wrap web/crossfall.html (the game page, as published to Claude) into Crossfall/index.html for the iOS app.
Run from the repo root:  python3 scripts/build_index.py"""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
page = (root / "web" / "crossfall.html").read_text(encoding="utf-8")
# The iOS app makes no network requests for its own UI: swap the Google Fonts links for the
# OFL fonts bundled in Crossfall/Fonts (served from crossfall://app/ by BundleSchemeHandler).
import re
LOCAL_FONTS = ("<style>"
    "@font-face{font-family:'Bungee';font-weight:400;font-display:swap;src:url(bungee-400.woff2) format('woff2')}"
    "@font-face{font-family:'Martian Mono';font-weight:400 500;font-display:swap;src:url(martian-mono-500.woff2) format('woff2')}"
    "@font-face{font-family:'Martian Mono';font-weight:600 800;font-display:swap;src:url(martian-mono-700.woff2) format('woff2')}"
    "@font-face{font-family:'Atkinson Hyperlegible';font-weight:400;font-display:swap;src:url(atkinson-hyperlegible-400.woff2) format('woff2')}"
    "@font-face{font-family:'Atkinson Hyperlegible';font-weight:700;font-display:swap;src:url(atkinson-hyperlegible-700.woff2) format('woff2')}"
    "</style>")
links = re.findall(r'<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>\n?', page)
assert links, "expected the Google Fonts links in web/crossfall.html"
for l in links: page = page.replace(l, "")
page = LOCAL_FONTS + page
doc = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
       '<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);'
       'padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}'
       '[hidden]{display:none!important}</style></head><body>' + page + '</body></html>')
(root / "Crossfall" / "index.html").write_text(doc, encoding="utf-8")
print("Wrote Crossfall/index.html")
