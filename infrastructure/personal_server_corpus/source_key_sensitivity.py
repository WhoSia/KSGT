"""Post-diagnostic exploratory known-source-key sensitivity; retain stricter exclusions."""
import argparse,json,sqlite3,time
from pathlib import Path
from context_falsification import Group,length_bin,char_bin
RULES=("ID_TEXT_CONFLICT","MULTIPLE_STRUCTURES_IN_SOURCE_COMPONENT","DEVELOPMENT_KEY_OVERLAP")
def analyze(args):
    db=sqlite3.connect("file:"+str(args.db).replace("\\","/")+"?mode=ro&immutable=1",uri=True)
    groups={};start=time.perf_counter();overlap=0
    query="""SELECT c.cluster,r.release,r.year,r.format,r.topic,r.category,r.collection,r.development_overlap,
        v.units,v.characters,v.targets,v.features FROM rows r JOIN variants v ON r.variant=v.id JOIN components c ON c.variant=v.id
        WHERE r.rid IN (SELECT MIN(rid) FROM rows WHERE format='json' AND variant NOT IN
        (SELECT variant FROM exclusions WHERE reason IN ('ID_TEXT_CONFLICT','MULTIPLE_STRUCTURES_IN_SOURCE_COMPONENT','DEVELOPMENT_KEY_OVERLAP')) GROUP BY variant)"""
    for cluster,release,year,fmt,topic,category,collection,dev,units,chars,targets,payload in db.execute(query):
        overlap+=dev
        feat=json.loads(payload) if payload else {"targets":0,"vector":[],"exclusions":{}}
        row={"cluster":cluster}
        for lane in ["ALL","RELEASE/"+release,"YEAR/"+year,"FORMAT/"+fmt,"TOPIC/"+topic,
                     "CATEGORY/"+category,"COLLECTION/"+collection,"LENGTH/"+length_bin(units),"CHARACTERS/"+char_bin(chars)]:
            groups.setdefault(lane,Group()).add(row,feat)
    assert overlap==0
    result={"status":"EXECUTED","scope":"POST_DIAGNOSTIC_EXPLORATORY_SENSITIVITY_NOT_CONFIRMATORY",
        "reason":"Repeated newspaper title metadata cannot establish article identity; original stricter policy remains preserved",
        "excluded_rules":list(RULES),"retained_weak_metadata_rejections":"Not applied in this companion view; no claim that weak collisions are independent works",
        "known_development_overlap_rows":overlap,"globally_independent_work_identity":"HOLD",
        "groups":{k:v.finish("KNOWN_SOURCE_KEY_DISJOINT/"+k) for k,v in groups.items()},"wall_seconds":time.perf_counter()-start}
    args.out.write_text(json.dumps(result,indent=2),encoding="utf-8");db.close()
    print(json.dumps({"status":"EXECUTED","rows":result["groups"]["ALL"]["representation_rows"],"components":result["groups"]["ALL"]["document_components"],"known_overlap_rows":overlap}))
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--db",type=Path,required=True);p.add_argument("--out",type=Path,required=True);analyze(p.parse_args())

