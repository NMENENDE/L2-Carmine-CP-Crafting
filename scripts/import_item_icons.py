#!/usr/bin/env python3
"""Index original item icon filenames from the public Lineage2 API data.
Keeps image files at the upstream origin; creates only an ID/name -> icon URL manifest.
Never guesses a filename. Upstream is an Interlude reference, not the LU4 mechanics DB.
"""
import json
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = "https://raw.githubusercontent.com/cuteshaun/lineage2-api/main/"
JSON_URL = ROOT + "data/generated/interlude/items.json"
ICONS = ROOT + "public/icons/"
OUTPUT = Path("data/icons.json")
HEADERS = {"User-Agent":"CarmineForge-icon-indexer/1.0 noncommercial"}

def fetch(url):
    req = urllib.request.Request(url,headers=HEADERS)
    with urllib.request.urlopen(req,timeout=90) as r:
        return r.read()

def normalize(s):
    return re.sub(r"\s+"," ",str(s).strip()).casefold()

def flatten(root):
    # Input may be a list, a dict keyed by ID, or an envelope with a 'data' / 'items' key.
    if isinstance(root,list):
        for item in root:
            yield from flatten(item)
    elif isinstance(root,dict):
        if ("name" in root) and ("id" in root or "itemId" in root) and ("iconFile" in root or "icon" in root):
            yield root
        elif "items" in root and isinstance(root["items"],(dict,list)):
            yield from flatten(root["items"])
        elif "data" in root and isinstance(root["data"],(dict,list)):
            yield from flatten(root["data"])
        else:
            for val in root.values():
                if isinstance(val,(dict,list)):
                    yield from flatten(val)

def iconfile(raw):
    if not isinstance(raw,str) or not raw.strip():
        return None
    x=raw.strip().replace("icon.","").replace("\\","/")
    if "/" in x: x=x.rsplit("/",1)[-1]
    if not re.fullmatch(r"[\w.\-]+",x):return None
    if not x.lower().endswith(".png"):x+=".png"
    return x

def main():
    existing=json.loads(OUTPUT.read_text("utf-8")) if OUTPUT.exists() else {}
    by_id=dict(existing.get("byId",{}))
    by_name=dict(existing.get("byName",{}))
    seen=defaultdict(set)
    indexed=0
    raw=json.loads(fetch(JSON_URL))
    for row in flatten(raw):
        name=row.get("name")
        ident=row.get("id",row.get("itemId"))
        filename=iconfile(row.get("iconFile") or row.get("icon"))
        if not filename or not name or ident is None:continue
        url=ICONS+filename
        by_id[str(ident)]=url
        seen[normalize(name)].add(url)
        indexed+=1
    # Exact names with conflicting icons are deliberately not mapped; ID lookup remains safe.
    for name,urls in seen.items():
        if len(urls)==1:
            by_name[name]=next(iter(urls))
    if indexed<1000:
        raise RuntimeError(f"Only {indexed} icon-bearing items parsed; keeping current manifest")
    payload={"source":"cuteshaun/lineage2-api","origin":"Lineage II Interlude client icons","byId":by_id,"byName":by_name,"stats":{"indexed":indexed,"ids":len(by_id),"names":len(by_name),"ambiguous_names":sum(len(v)>1 for v in seen.values())}}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("Icon catalog entries:", payload["stats"])

if __name__=="__main__":
    main()
