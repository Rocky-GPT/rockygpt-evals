import json, os
from collections import defaultdict, Counter
import pathlib; G=str(pathlib.Path(__file__).parent)+'/'
key={k['hid']:k for k in json.load(open(''+G+'key.json'))}
q={x['id']:x['group'] for x in json.load(open(''+G+'../questions.json'))}
labels=defaultdict(dict)
for b in range(1,9):
    for g in 'AB':
        f=f'{G}labels-{b}-{g}.json'
        if os.path.exists(f):
            for x in json.load(open(f)): labels[x['id']][g]=x
GOOD={'correct','declined_ok','asked_ok'}
RANK={'correct':0,'declined_ok':0,'asked_ok':0,'incomplete':1,'declined_wrong':2,'asked_wrong':2,'wrong':3}
res=defaultdict(lambda: defaultdict(list)); verd=defaultdict(Counter); serious=Counter(); both_serious=Counter(); noise=Counter(); agree=Counter()
for hid,ls in labels.items():
    k=key[hid]; vs=list(ls.values())
    worst=max(vs,key=lambda v:RANK.get(v['verdict'],3))
    ok=worst['verdict'] in GOOD
    res[k['writer']][k['qid']].append(ok)
    verd[(k['writer'],q[k['qid']])][worst['verdict']]+=1
    if any(v.get('severity')=='serious' for v in vs): serious[k['writer']]+=1
    if len(vs)==2 and all(v.get('severity')=='serious' and v['verdict']=='wrong' for v in vs): both_serious[k['writer']]+=1
    if any(v.get('unasked_noise') for v in vs): noise[k['writer']]+=1
    if len(vs)==2: agree[(k['writer'],vs[0]['verdict'] in GOOD)==(k['writer'],vs[1]['verdict'] in GOOD)]+=1
for w in ('today','sections','whole'):
    for g in ('missed','good'):
        ids=[i for i in res[w] if q[i]==g]
        tries=sum(sum(res[w][i]) for i in ids); n=sum(len(res[w][i]) for i in ids)
        first=sum(res[w][i][0] for i in ids) if g=='good' else None
        all5=sum(all(res[w][i]) for i in ids)
        print(f"{w} {g}: good tries {tries}/{n}; questions good on every try {all5}/{len(ids)}")
    print(f"  {w} verdicts missed: {dict(verd[(w,'missed')])}; good-set: {dict(verd[(w,'good')])}")
    print(f"  serious by either grader {serious[w]}, wrong+serious by both {both_serious[w]}, noise {noise[w]}")
print('grader agreement (good/not good):', dict(agree))
for i in sorted({i for w in res for i in res[w]}):
    print(i, q[i], *[''.join('Y' if v else '.' for v in res[w].get(i,[])) for w in ('today','sections','whole')])
