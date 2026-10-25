#!/usr/bin/env python3
"""RunSphere crawler.

Pulls upcoming running events from public sources, normalises them into one
schema, merges the hand-curated global races, keeps only the next 13 months,
and writes public/events.json for the React app.

Sources (all public, no login):
  - iFinish        POST https://api2.ifinish.in/api/eventListByType  (their own listing API)
  - IndiaRunning   event pages listed in https://indiarunning.com/sitemap.xml
  - MarathonMitra  event pages listed in https://marathonmitra.com/sitemap.xml (schema.org SportsEvent)
  - data/global_events.json  hand-verified international + marquee Indian races

Usage:  python3 scripts/runsphere/crawl.py   (stdlib only, ~3-5 minutes)
Runs weekly via .github/workflows/runsphere-weekly.yml.
"""
import datetime as dt
import html
import json
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / "public" / "data" / "runsphere" / "events.json"
CURATED = HERE / "global_events.json"
# If a source starts blocking us, don't replace a good calendar with a gutted one.
MIN_KEEP_RATIO = 0.6
UA = "Mozilla/5.0 (RunSphere event aggregator; personal project)"
WINDOW_MONTHS = 13


# ---------------------------------------------------------------- helpers
def fetch(url, data=None, timeout=30):
    headers = {"User-Agent": UA}
    if data is not None:
        data = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def strip_html(s):
    s = re.sub(r"<(br|/p|/h\d|/li)[^>]*>", "\n", s or "", flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"[ \t]+", " ", html.unescape(s)).strip()


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


NAMED = [
    (r"\bfull\s*marathon\b|\b42(\.2)?\s*k", 42.2),
    (r"\bhalf\s*marathon\b|\b21(\.1)?\s*k", 21.1),
]
DIST_RE = re.compile(r"(?<![\d.])(\d{1,3}(?:\.\d{1,2})?)\s*(k|km|kms|kilometer|kilometre)s?\b", re.I)
MILE_RE = re.compile(r"(?<![\d.])(\d{2,3})\s*(mi|miles?|m(?=\b))\b", re.I)


def parse_distances(*texts):
    """Return sorted unique distances in km found in the given strings."""
    found = set()
    for t in texts:
        if not t:
            continue
        for pat, km in NAMED:
            if re.search(pat, t, re.I):
                found.add(km)
        for num, _ in DIST_RE.findall(t):
            v = float(num)
            if 0.5 <= v <= 1000:
                found.add(round(v, 1))
        for num, _ in MILE_RE.findall(t):
            v = int(num)
            if v in (50, 100, 135, 150, 200, 240):
                found.add(round(v * 1.609, 1))
    # 21K / 42K -> canonical
    canon = {21.0: 21.1, 42.0: 42.2, 42.19: 42.2}
    return sorted({canon.get(d, d) for d in found})


def classify(name, text, distances):
    blob = f"{name} {text}".lower()
    if re.search(r"ironman|triathlon|aquathlon|duathlon|70\.3|swimrun", blob):
        return "Triathlon"
    if re.search(r"virtual|anywhere in india|run from anywhere", blob):
        return "Virtual"
    if re.search(r"walkathon|\bwalk\b", name.lower()):
        return "Walk"
    if re.search(r"\b(trail|forest|hills?|ghats?|mountain|sky ?race|vertical|himalaya|ladakh|khardung|fort|everesting|trek)\b", blob):
        return "Trail / Ultra" if (distances and max(distances) > 42.2) else "Trail"
    if distances and max(distances) > 42.2:
        return "Ultra (Road)"
    return "Road"


INDIA_REGIONS = {
    "South": ["telangana", "hyderabad", "secunderabad", "karnataka", "bengaluru", "bangalore", "mysuru", "mysore",
              "tamil", "chennai", "coimbatore", "madurai", "kerala", "kochi", "trivandrum", "thiruvananthapuram",
              "andhra", "visakhapatnam", "vizag", "vijayawada", "tirupati", "puducherry", "pondicherry",
              "auroville", "chikmagalur", "coorg", "ooty", "warangal", "kozhikode", "thrissur", "mangalore", "mangaluru"],
    "West": ["maharashtra", "mumbai", "pune", "nashik", "nagpur", "thane", "navi mumbai", "goa", "gujarat",
             "ahmedabad", "surat", "vadodara", "rajkot", "mahesana", "mehsana", "satara", "lonavala", "aurangabad",
             "vasai", "kutch", "indore", "bhopal", "madhya pradesh", "raipur", "chhattisgarh"],
    "North": ["delhi", "new delhi", "gurugram", "gurgaon", "noida", "haryana", "punjab", "chandigarh", "rajasthan",
              "jaipur", "udaipur", "jodhpur", "uttar pradesh", "lucknow", "varanasi", "agra", "uttarakhand",
              "dehradun", "mussoorie", "rishikesh", "himachal", "shimla", "manali", "ladakh", "leh", "kashmir",
              "srinagar", "jammu", "dwarka", "faridabad", "ghaziabad"],
    "East & North-East": ["kolkata", "west bengal", "odisha", "bhubaneswar", "bihar", "patna", "jharkhand",
                          "ranchi", "jamshedpur", "assam", "guwahati", "meghalaya", "shillong", "sikkim",
                          "gangtok", "darjeeling", "manipur", "imphal", "nagaland", "mizoram", "tripura",
                          "arunachal"],
}


def india_region(*texts):
    blob = " ".join(t for t in texts if t).lower()
    for region, keys in INDIA_REGIONS.items():
        if any(re.search(r"\b" + re.escape(k) + r"\b", blob) for k in keys):
            return f"India - {region}"
    return "India - Other"


def make_event(**kw):
    base = {
        "id": "", "name": "", "date": "", "dateTBC": False, "endDate": None, "city": "", "venue": "", "country": "India",
        "region": "India - Other", "discipline": "Road", "distances": [], "categories": [],
        "priceFrom": None, "currency": "INR", "priceNote": None, "organizer": None,
        "regOpens": None, "regCloses": None, "status": None, "regLink": None, "entry": None,
        "sources": [], "tier": "community", "notes": None, "lastChecked": TODAY.isoformat(),
    }
    base.update({k: v for k, v in kw.items() if v is not None})
    return base


# ---------------------------------------------------------------- sources
def crawl_ifinish():
    out = []
    for etype in ("Running", "Triathlon"):
        data = json.loads(fetch("https://api2.ifinish.in/api/eventListByType",
                                {"eventType": etype, "userId": ""})).get("data") or []
        for e in data:
            text = strip_html(e.get("description") or "")
            dists = parse_distances(e["title"], text[:4000])
            prices = [int(p.replace(",", "")) for p in re.findall(r"(?:₹|rs\.?|inr)\s*([\d,]{3,6})", text, re.I)]
            prices = [p for p in prices if 99 <= p <= 100000]
            out.append(make_event(
                id=f"ifinish-{e['event_slug']}",
                name=e["title"].strip(),
                date=e["date"],
                endDate=e.get("event_end_date") if e.get("event_end_date") != e["date"] else None,
                city=(e.get("city") or "").strip(),
                venue=(e.get("location") or "").strip(),
                region=india_region(e.get("city"), e.get("location")),
                discipline=classify(e["title"], text[:1500] + " " + (e.get("city") or ""), dists),
                distances=dists,
                priceFrom=min(prices) if prices else None,
                organizer=e.get("cName"),
                regOpens=(e.get("registration_start") or "")[:10] or None,
                regCloses=(e.get("registration_close") or "")[:10] or None,
                regLink=f"https://www.ifinish.in/{etype.lower()}/{e['event_slug']}",
                sources=[{"name": "iFinish", "url": f"https://www.ifinish.in/{etype.lower()}/{e['event_slug']}"}],
            ))
    return out


def sitemap_urls(sitemap, prefix):
    xml = fetch(sitemap)
    return sorted({u for u in re.findall(r"<loc>\s*([^<\s]+)", xml) if u.startswith(prefix)})


def ir_event(url):
    h = fetch(url)
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S)
    info = json.loads(m.group(1))["props"]["pageProps"].get("eventInfo") if m else None
    if not info or not info.get("eventDate"):
        return None
    cats = info.get("categories") or []
    sports = {c.get("sportName") for c in cats}
    if sports and not sports & {"Running", "Triathlon", "Walking", None}:
        return None  # cycling / racket sports etc.
    if any(c.get("type") == "Virtual" for c in cats) and all(c.get("type") == "Virtual" for c in cats):
        virtual = True
    else:
        virtual = False
    loc = info.get("location") or {}
    titles = [re.sub(r"\s*-\s*(men|women|male|female)\s*$", "", (c.get("title") or "").strip(), flags=re.I) for c in cats]
    titles = list(dict.fromkeys(t for t in titles if t))
    about = strip_html(" ".join(a.get("content") or "" for a in info.get("aboutRace") or []))
    dists = parse_distances(info["title"], " | ".join(titles))
    city = (loc.get("area") or loc.get("city") or "").strip()
    disc = "Virtual" if virtual else classify(info["title"], about[:1500], dists)
    return make_event(
        id=f"ir-{info['slug']}",
        name=info["title"].strip(),
        date=info["eventDate"][:10],
        endDate=(info.get("endDate") or "")[:10] or None,
        city=city,
        venue=", ".join(x.strip() for x in [loc.get("line1"), loc.get("state")] if x and x.strip()),
        country=(loc.get("country") or "India").strip(),
        region=india_region(city, loc.get("state"), loc.get("line1")),
        discipline=disc,
        distances=dists,
        categories=titles,
        regLink=f"https://indiarunning.com/events/{info['slug']}",
        sources=[{"name": "IndiaRunning", "url": url}] + (
            [{"name": "Official site", "url": info["website"]}] if info.get("website") else []),
    )


def mm_event(url):
    h = fetch(url)
    for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try:
            j = json.loads(blk)
        except ValueError:
            continue
        items = j.get("@graph", [j]) if isinstance(j, dict) else j
        for it in items:
            if not isinstance(it, dict) or it.get("@type") != "SportsEvent" or not it.get("startDate"):
                continue
            loc = it.get("location") or {}
            addr = loc.get("address") or {}
            subs = it.get("subEvent") or []
            sub_names = [s.get("name", "") + " " + str(s.get("distance", "")) for s in subs]
            dists = parse_distances(it["name"], " | ".join(sub_names), it.get("description", ""))
            offer = it.get("offers") or {}
            if isinstance(offer, list):
                offer = offer[0] if offer else {}
            prices = []
            for s in subs:
                o = s.get("offers") or {}
                if isinstance(o, dict) and str(o.get("price", "0")).replace(".", "").isdigit():
                    prices.append(float(o["price"]))
            if str(offer.get("price", "0")).replace(".", "").isdigit():
                prices.append(float(offer["price"]))
            prices = [p for p in prices if p > 0]
            city = addr.get("addressLocality") or ""
            org = it.get("organizer") or {}
            virtual = "Online" in str(it.get("eventAttendanceMode", ""))
            return make_event(
                id="mm-" + url.rstrip("/").rsplit("/", 1)[-1],
                name=it["name"].strip(),
                date=it["startDate"][:10],
                endDate=it.get("endDate", "")[:10] if it.get("endDate", "")[:10] != it["startDate"][:10] else None,
                city=city,
                venue=loc.get("name") or addr.get("streetAddress") or "",
                region=india_region(city, loc.get("name"), addr.get("streetAddress")),
                discipline="Virtual" if virtual else classify(it["name"], it.get("description", ""), dists),
                distances=dists,
                categories=[s.get("name") for s in subs if s.get("name")],
                priceFrom=int(min(prices)) if prices else None,
                organizer=org.get("name") if isinstance(org, dict) else None,
                regLink=offer.get("url") or url,
                status="Cancelled" if "Cancelled" in str(it.get("eventStatus", "")) else None,
                sources=[{"name": "MarathonMitra", "url": url}],
            )
    return None


FM_URL = "https://fatmarathoner.com/upcoming-marathon-calendar-india/"
FM_TYPES = {"road": "Road", "trail": "Trail", "ultra": "Trail / Ultra", "triathlon": "Triathlon",
            "kids": "Road", "walk": "Walk", "virtual": "Virtual"}


def crawl_fatmarathoner():
    """Editorial India calendar: card list with date, city and distance pills (no direct reg links)."""
    h = fetch(FM_URL)
    out = []
    for attrs, body in re.findall(r'<div class="amc-card"([^>]*)>(.*?)Check Registration', h, re.S):
        if 'data-past="true"' in attrs:
            continue
        name = re.search(r'class="amc-name">(.*?)</div>', body, re.S)
        date = re.search(r'amc-meta-date">\D*(\d{1,2} \w{3} \d{4})', body)
        if not name or not date:
            continue
        name = html.unescape(strip_html(name.group(1)))
        try:
            d = dt.datetime.strptime(date.group(1), "%d %b %Y").date()
        except ValueError:
            continue
        place = re.search(r"📍\s*([^<]+)", body)
        place = html.unescape(place.group(1).strip()) if place else ""
        etype = (re.search(r'data-type="(\w+)"', attrs) or [None, "road"])[1]
        pills = " ".join(re.findall(r'amc-pill">([^<]+)<', body))
        dists = parse_distances(name, pills)
        disc = FM_TYPES.get(etype, "Road")
        if disc == "Trail / Ultra" and dists and max(dists) <= 42.2:
            disc = "Trail"
        badges = " ".join(re.findall(r'amc-badge[^"]*">([^<]+)<', body))
        out.append(make_event(
            id="fm-" + slugify(f"{name}-{d.year}"),
            name=name if re.search(r"20\d\d", name) else f"{name} {d.year}",
            date=d.isoformat(),
            dateTBC="Est. Date" in badges,
            city=place.split(",")[0].strip(),
            venue=place,
            region=india_region(place),
            discipline=disc,
            distances=dists,
            sources=[{"name": "FatMarathoner calendar", "url": FM_URL}],
        ))
    return out


def crawl_pages(name, urls, parser, workers=4):
    def safe(u):
        time.sleep(0.25)  # be polite
        try:
            return parser(u)
        except Exception as ex:  # noqa: BLE001 - one bad page shouldn't stop the crawl
            print(f"  ! {name} {u}: {ex}", file=sys.stderr)
            return None
    with ThreadPoolExecutor(workers) as pool:
        return [e for e in pool.map(safe, urls) if e]


# ---------------------------------------------------------------- merge
STOP = {"the", "edition", "run", "race", "marathon", "half", "2026", "2027", "ed", "season", "of", "and", "-",
        "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"}


ALIASES = {"bangalore": "bengaluru", "mangalore": "mangaluru", "mysore": "mysuru", "bombay": "mumbai",
           "madras": "chennai", "calcutta": "kolkata", "gurgaon": "gurugram", "vizag": "visakhapatnam",
           "cochin": "kochi", "hm": "half"}


def key_tokens(name):
    toks = [ALIASES.get(t, t) for t in re.findall(r"[a-z0-9]+", name.lower())]
    return {t for t in toks if t not in STOP and not t.isdigit() and len(t) > 2}


def same_event(a, b):
    ta, tb = key_tokens(a["name"]), key_tokens(b["name"])
    if not ta or not tb:
        return False
    overlap = len(ta & tb) / min(len(ta), len(tb))
    if a["date"] != b["date"]:
        # estimated dates can be weeks off; match those on a strong name match only
        if a.get("dateTBC") or b.get("dateTBC"):
            gap = abs((dt.date.fromisoformat(a["date"]) - dt.date.fromisoformat(b["date"])).days)
            return gap <= 60 and overlap >= 0.75
        return False
    if overlap >= 0.6:
        return True
    # same day, same city, and a distinctive shared word (e.g. "signathon")
    city = key_tokens(a["city"]) | key_tokens(b["city"])
    same_city = a["city"].lower()[:5] == b["city"].lower()[:5] and a["city"]
    return bool(same_city and any(len(t) >= 6 for t in (ta & tb) - city))


def merge(primary, extra):
    """Fold `extra` into `primary` keeping primary values, filling gaps, uniting sources/distances."""
    if primary.get("dateTBC") and not extra.get("dateTBC"):
        primary["date"], primary["dateTBC"] = extra["date"], False
    for k, v in extra.items():
        if k in ("date", "dateTBC"):
            continue
        if k in ("sources",):
            urls = {s["url"] for s in primary["sources"]}
            primary["sources"] += [s for s in v if s["url"] not in urls]
        elif k in ("distances",):
            primary[k] = sorted(set(primary[k]) | set(v))
        elif k == "categories":
            primary[k] = list(dict.fromkeys(primary[k] + v))
        elif primary.get(k) in (None, "", [], "India - Other", "Road") and v not in (None, "", []):
            primary[k] = v
    return primary


def compute_status(e):
    if e.get("status") in ("Cancelled", "Lottery / Ballot", "Sold Out", "Qualifier Only"):
        return e["status"]
    d = dt.date.fromisoformat(e["date"])
    if d < TODAY:
        return "Concluded"
    opens = dt.date.fromisoformat(e["regOpens"]) if e.get("regOpens") else None
    closes = dt.date.fromisoformat(e["regCloses"]) if e.get("regCloses") else None
    if opens and TODAY < opens:
        return "Opening Soon"
    if closes and TODAY > closes:
        return "Registrations Closed"
    if closes and (closes - TODAY).days <= 10:
        return "Closing Soon"
    if opens or closes:
        return "Registrations Open"
    return e.get("status") or "Check Organiser"


def main():
    global TODAY
    TODAY = dt.date.today()
    y, m = divmod(TODAY.month - 1 + WINDOW_MONTHS, 12)
    end = TODAY.replace(year=TODAY.year + y, month=m + 1, day=min(TODAY.day, 28))

    print("iFinish API ...")
    ifin = crawl_ifinish()
    print(f"  {len(ifin)} events")

    print("IndiaRunning sitemap ...")
    ir_urls = sitemap_urls("https://indiarunning.com/sitemap.xml", "https://indiarunning.com/events/")
    ir = crawl_pages("IndiaRunning", ir_urls, ir_event)
    print(f"  {len(ir)} / {len(ir_urls)} pages parsed")

    print("MarathonMitra sitemap ...")
    mm_urls = sitemap_urls("https://marathonmitra.com/sitemap.xml", "https://marathonmitra.com/events/")
    mm = crawl_pages("MarathonMitra", mm_urls, mm_event)
    print(f"  {len(mm)} / {len(mm_urls)} pages parsed")

    print("FatMarathoner calendar ...")
    try:
        fm = crawl_fatmarathoner()
    except Exception as ex:  # noqa: BLE001
        print(f"  ! failed: {ex}", file=sys.stderr)
        fm = []
    print(f"  {len(fm)} events")

    curated = json.loads(CURATED.read_text()) if CURATED.exists() else []
    curated = [make_event(**{**c, "lastChecked": c.get("lastChecked", TODAY.isoformat())}) for c in curated]
    print(f"Curated: {len(curated)} events")

    merged = []
    # curated first so hand-verified details win; then aggregators in order of data richness
    for e in curated + ifin + mm + ir + fm:
        if not e["date"]:
            continue
        hit = next((m for m in merged if same_event(m, e)), None)
        if hit:
            merge(hit, e)
        else:
            merged.append(e)

    window = []
    for e in merged:
        d = dt.date.fromisoformat(e["date"])
        if TODAY - dt.timedelta(days=7) <= d < end:
            e["status"] = compute_status(e)
            window.append(e)
    window.sort(key=lambda e: (e["date"], e["name"]))

    if OUT.exists():
        prev = len(json.loads(OUT.read_text()).get("events", []))
        if prev and len(window) < prev * MIN_KEEP_RATIO:
            sys.exit(f"Refusing to overwrite: {len(window)} events vs {prev} last time. A source is probably blocking.")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "windowStart": TODAY.isoformat(),
        "windowEnd": end.isoformat(),
        "sources": {"iFinish": len(ifin), "IndiaRunning": len(ir), "MarathonMitra": len(mm),
                    "FatMarathoner": len(fm), "Curated": len(curated)},
        "events": window,
    }, ensure_ascii=False, indent=1))
    print(f"Wrote {len(window)} events in window {TODAY} -> {end} to {OUT.relative_to(ROOT)}")


TODAY = dt.date.today()
if __name__ == "__main__":
    main()
