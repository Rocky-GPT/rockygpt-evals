"""Course search and lookup for subject questions (tool level, no model)."""
import re, sys, json
from datetime import datetime
from rockygpt_brain.retrieval.data import CampusData
from rockygpt_brain.retrieval.models import CAMPUS_ZONE, SearchQuery
from rockygpt_brain.retrieval.profiles import ProfileQuery

URL = sys.argv[1]
data = CampusData(URL, datetime.now(CAMPUS_ZONE))
rows = []
for q in ["CS courses", "psych classes", "history courses", "computer science courses", "Comp Sci",
          "art history courses", "literature courses", "READ courses", "courses to read", "ACCT 100",
          "CMPS", "bio courses about genetics", "business courses"]:
    result = data.search(SearchQuery(collection="courses", query=q))
    codes = [r.get("fields", {}).get("code", "?") for r in result.get("records", [])]
    prefixes = sorted({re.match(r"[A-Z]+", c).group(0) for c in codes if re.match(r"[A-Z]+", c)})
    resolved = [(m["code"], m["basis"]) for m in result["coverage"].get("subject_resolution") or []]
    rows.append({"query": q, "total": result.get("total_matches"), "prefixes": prefixes, "first": codes[:4], "subjects": resolved})
    print(f"{q!r:30} total={result.get('total_matches'):4} subjects={resolved} prefixes={prefixes[:6]} first={codes[:4]}")
for name in ["CMPS", "LITR", "Computer Science", "Computer Science (CMPS)"]:
    out = data.lookup_profile(ProfileQuery(entity=name, include=["subject"]))
    res = out["resolution"]
    print(f"lookup {name!r:28} -> {res['status']}: {[(c['kind'], c['name']) for c in ([res['entity']] if res.get('entity') else res.get('candidates', []))]}")
data.close()
json.dump(rows, open(sys.argv[2], "w"), indent=1)
