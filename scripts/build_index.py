#!/usr/bin/env python3
"""Wrap web/crossfall.html (the game page, as published to Claude) into Crossfall/index.html for the iOS app.
Run from the repo root:  python3 scripts/build_index.py"""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
page = (root / "web" / "crossfall.html").read_text(encoding="utf-8")
doc = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
       '<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);'
       'padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}'
       '[hidden]{display:none!important}</style></head><body>' + page + '</body></html>')
(root / "Crossfall" / "index.html").write_text(doc, encoding="utf-8")
print("Wrote Crossfall/index.html")
