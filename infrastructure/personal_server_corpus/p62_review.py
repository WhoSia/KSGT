"""Unicode-safe private prediction-blind P62 review rendering.

This display-only correction changes no frozen P62 candidate or outcome.
"""
import argparse,gzip,json,pathlib
from p62_reference import review_html,key
import collections
def render(items,slot):
    shown=[];inventory={}
    for item in items:
        inventory[item["item_id"]]=len(item["candidates"])
        groups=collections.defaultdict(list)
        for c in item["candidates"]:groups[c["relation"]].append(c)
        selected=[]
        for group in groups.values():
            group.sort(key=lambda c:(abs(c["unit"]-item["target"]["unit"]),abs(c["end"]-item["target"]["start"]),c["candidate_id"]))
            selected.extend(group[:6])
        shown.append({**item,"candidates":selected})
    result=review_html(shown,slot).replace("p.text.slice(c.start,c.end)","Array.from(p.text).slice(c.start,c.end).join('')")
    result=result.replace("let pos=0;const responses={};","let pos=0;const responses={};const inventoryCounts="+json.dumps(inventory)+";")
    result=result.replace("v.append(el('p','Target Unicode span: '+JSON.stringify(x.target)));",
        "v.append(el('p','Target Unicode span: '+JSON.stringify(x.target)));v.append(el('p','Displaying '+x.candidates.length+' of '+inventoryCounts[x.item_id]+' rule proposals. Full inventory is preserved privately; add manual spans when needed.'));")
    return result
def build(packet,out):
    out=pathlib.Path(out)
    if out.exists():raise FileExistsError("Preserve previous review material")
    out.mkdir(parents=True)
    with gzip.open(packet,"rt",encoding="utf-8") as f:items=list(map(json.loads,f))
    for slot in ["A","B"]:
        ordered=sorted(items,key=lambda x:key([x["item_id"],slot],"P62-item-order"))
        for b in range(0,len(ordered),100):
            (out/("review_"+slot+"_"+str(b//100+1).zfill(2)+".private.html")).write_text(render(ordered[b:b+100],slot),encoding="utf-8")
    (out/"README.md").write_text("# Private review v2\n\nOpen the A or B batches locally. Unicode code-point offsets are displayed correctly, including astral characters. Machine predictions and release labels are hidden; chronology is visible. This is not certified double-blind validation. Export ledgers frequently into the private P62 directory. All existing ground truth remains null.\n",encoding="utf-8")
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--packet",required=True);p.add_argument("--out",required=True);a=p.parse_args();build(a.packet,a.out)

