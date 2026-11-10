#!/usr/bin/env python3
"""LU4 factual catalogue importer. Polite robot-aware HTTP. Never copies art assets."""
import json
import re
import time
import urllib.parse
import urllib.robotparser
from pathlib import Path
import requests
from bs4 import BeautifulSoup

BASE = "https://la2wiki.com"
OUT = Path("data")
OUT.mkdir(exist_ok=True)
session = requests.Session()
session.headers.update({"User-Agent":"CarmineForge-CatalogIndexer/1.0 (+https://github.com/NMENENDE/L2-Carmine-CP-Crafting; noncommercial factual indexing)"})
robots = urllib.robotparser.RobotFileParser(BASE + "/robots.txt")
try:
    robots.read()
except Exception as e:
    raise RuntimeError("Cannot verify robots policy; refusing crawl") from e

def fetch(path):
    url = urllib.parse.urljoin(BASE, path)
    if urllib.parse.urlsplit(url).netloc != "la2wiki.com":
        raise ValueError("External domain disallowed")
    if not robots.can_fetch(session.headers["User-Agent"], url):
        raise PermissionError("Robots disallows " + url)
    r = session.get(url,timeout=25)
    r.raise_for_status()
    time.sleep(1.25)
    return BeautifulSoup(r.text,"html.parser")

def clean(x):
    return re.sub(r"\s+"," ",x.get_text(" ",strip=True)).strip()

def source_link(a):
    href = a.get("href","")
    url = urllib.parse.urljoin(BASE,href)
    return url if url.startswith(BASE + "/lu4/") else None

def entries_from_table(page,section,category):
    records=[]
    for table in page.select("table"):
        for tr in table.select("tr"):
            tds=tr.find_all("td")
            if not tds: continue
            a=next((x for x in tds[0].find_all("a",href=True) if source_link(x)),None)
            if not a: continue
            name=clean(a)
            if not name: continue
            rec={"name":name,"category":category,"source_url":source_link(a),"source":"La2Wiki LU4"}
            if len(tds)>1:
                grade=clean(tds[1])
                if grade in ("NG","D","C","B","A","S"):rec["grade"]=grade
            records.append(rec)
    return records

def save(name,data):
    (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(name, len(data))

materials=entries_from_table(fetch("/lu4/materials"),"materials","material")
if len(materials)<100:
    raise RuntimeError(f"Only {len(materials)} materials parsed; refusing to replace existing dataset")
save("materials.json",materials)

# Discover all category listings through the published LU4 index.
index=fetch("/lu4/items")
categories={}
for a in index.select("a[href]"):
    title=clean(a).lower()
    url=source_link(a)
    if not url:continue
    if "weapon" in title:categories[url]="weapon"
    elif "armor" in title:categories[url]="armor"
    elif "jewel" in title:categories[url]="jewelry"
    elif "scroll" in title:categories[url]="scroll"
    elif "potion" in title:categories[url]="potion"
    elif "shot" in title or "arrow" in title:categories[url]="shot"
    elif "spellbook" in title:categories[url]="spellbook"
    elif "recipe" in title:categories[url]="recipe_item"
    elif "dye" in title:categories[url]="dye"
    elif "accessor" in title:categories[url]="accessory"
    elif "quest item" in title:categories[url]="quest"
items={x["source_url"]:x for x in materials}
for url,category in sorted(categories.items()):
    if url==BASE+"/lu4/items": continue
    try:
        soup=fetch(url)
        for x in entries_from_table(soup,category,category):
            items.setdefault(x["source_url"],x)
    except Exception as e:
        print("Category skipped",url,str(e))
# Item coverage reflects successfully parsed pages, not claimed full reference counts.
save("items.json",sorted(items.values(),key=lambda x:(x["category"],x["name"].lower())))

# Recipe index has 4 sections and category detail pages.
home=fetch("/lu4/recipes")
recipepages={"/lu4/recipes"}
for a in home.select("a[href]"):
    title=clean(a).lower()
    url=source_link(a)
    if url and ("recipes" in title or title.startswith("show all")):
        if "/recipes" in urllib.parse.urlsplit(url).path: recipepages.add(url)
recipes={}
for page_url in sorted(recipepages):
    try:
        soup = home if page_url=="/lu4/recipes" else fetch(page_url)
        for table in soup.select("table"):
            for tr in table.select("tr"):
                cells=tr.find_all("td")
                if len(cells)<5:continue
                a=cells[0].find("a",href=True)
                if not a or not clean(a).lower().startswith("recipe:"):continue
                url=source_link(a)
                if not url:continue
                result=cells[1].find("a",href=True)
                pct=clean(cells[4])
                grade=clean(cells[2])
                try:rate=float(pct.replace("%","").replace(",","."))/100
                except:rate=None
                try:level=int(clean(cells[3]))
                except:level=None
                recipes[url]={"name":clean(a),"result":clean(cells[1]),"output_source_url":source_link(result) if result else None,"grade":grade,"craft_level":level,"success_rate":rate,"source_url":url,"ingredients":None,"source":"La2Wiki LU4"}
    except Exception as e: print("Recipes page skipped",page_url,str(e))
save("recipes.json",list(recipes.values()))

sets={}
for p in range(1,6):
    url="/lu4/sets" if p==1 else f"/lu4/sets/page-{p}"
    try:
        soup=fetch(url)
        for a in soup.select('a[href*="/lu4/set/"]'):
            name=clean(a)
            link=source_link(a)
            if len(name)>2 and link and link not in sets:
                sets[link]={"name":name,"source_url":link,"source":"La2Wiki LU4"}
    except Exception as e:print("Sets page skipped",url,str(e))
save("sets.json",list(sets.values()))
save("summary.json",{"materials":len(materials),"items":len(items),"recipes":len(recipes),"sets":len(sets),"source":"La2Wiki LU4","icons_copied":0,"ingredients_imported":0})
