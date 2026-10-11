"""Predeclared bounded paired segmentation diagnostic; no adjudicated sentence gold."""
import argparse,collections,gzip,hashlib,json,sqlite3,time
from pathlib import Path
from p61_directional import ro,document_measure,spans,summarize,digest
def run(args):
    db=ro(args.out/"P61_PRIVATE.sqlite");source=ro(args.source)
    selected=sorted([(hashlib.sha256(strict.encode()).hexdigest(),strict,lineage)
        for strict,lineage in db.execute("SELECT strict,lineage FROM documents WHERE known_new=1 AND json_extract(metrics,'$.targets')>0")])[:2000]
    wanted={s:g for h,s,g in selected};paths=set()
    for strict in wanted:
        member=source.execute("SELECT first_member FROM canonical WHERE strict=?",(strict,)).fetchone()[0]
        paths.add(source.execute("SELECT path FROM shards WHERE member=? AND kind='paragraphs'",(member,)).fetchone()[0])
    results={};start=time.perf_counter()
    for path in sorted(paths):
        current=None;forms=[]
        def flush():
            if current not in wanted:return
            source_measure,_=document_measure(forms)
            ortho=[text[a:b] for text in forms for a,b in spans(text)]
            ortho_measure,_=document_measure(ortho)
            results[current]={"lineage":wanted[current],"SOURCE":source_measure,"ORTHOGRAPHIC":ortho_measure,
                              "source_units":len(forms),"orthographic_units":len(ortho)}
        with gzip.open(path,"rt",encoding="utf-8") as f:
            for line in f:
                row=json.loads(line)
                if row["document_variant"]!=current:
                    flush();current=row["document_variant"];forms=[]
                if current in wanted:forms.append(row["form"])
        flush()
    assert len(results)==len(wanted)
    summary={"status":"EXECUTED","scope":"PAIRED_PROVISIONAL_SEGMENTATION_PROXY","selected_documents":len(wanted),
             "source_members_read":len(paths),"selection":"First 2000 SHA-ordered known-key-new target-bearing structures",
             "source_targets":sum(x["SOURCE"]["targets"] for x in results.values()),
             "orthographic_targets":sum(x["ORTHOGRAPHIC"]["targets"] for x in results.values()),
             "source_units":sum(x["source_units"] for x in results.values()),"orthographic_units":sum(x["orthographic_units"] for x in results.values()),
             "source_unit_change_documents":sum(x["source_units"]!=x["orthographic_units"] for x in results.values()),
             "groups":{},"code_sha256":digest(__file__),"wall_seconds":time.perf_counter()-start,
             "independent_sentence_gold":"NONE"}
    for w in (2,5):
        key=str(w)+"/NUMERIC_CUE"
        for view in ("SOURCE","ORTHOGRAPHIC"):
            values=[(x["lineage"],x[view]["metrics"][key]["eligible_targets"],x[view]["metrics"][key]["mean_difference"])
                    for x in results.values() if key in x[view]["metrics"]]
            summary["groups"][str(w)+"/"+view]=summarize(values,w)
        paired=[x for x in results.values() if key in x["SOURCE"]["metrics"] and key in x["ORTHOGRAPHIC"]["metrics"]]
        summary["groups"][str(w)+"/PAIRED_SEGMENTATION_CHANGE"]=summarize(
            [(x["lineage"],1,x["ORTHOGRAPHIC"]["metrics"][key]["mean_difference"]-x["SOURCE"]["metrics"][key]["mean_difference"]) for x in paired],w+100)
    (args.out/"P61_SEGMENTATION_RESULTS.json").write_text(json.dumps(summary,indent=2),encoding="utf-8")
    with gzip.open(args.out/"SEGMENTATION_DOCUMENTS.private.jsonl.gz","wt",encoding="utf-8") as f:
        for key,value in results.items():f.write(json.dumps({"strict":key,**value})+"\n")
    print(json.dumps(summary))
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--source",type=Path,required=True);p.add_argument("--out",type=Path,required=True);run(p.parse_args())
