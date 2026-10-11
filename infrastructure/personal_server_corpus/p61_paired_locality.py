"""Paired exploratory locality sensitivity; extension is not confirmatory."""
import argparse,collections,gzip,hashlib,json,time
from pathlib import Path
import numpy as np
from p61_directional import ro,TARGET,CUE,lexical,jaccard,summarize,digest
from distant_window_control import starts
def paired(forms):
    hits=[len(list(TARGET.finditer(t))) for t in forms];cues=[bool(CUE.search(t)) for t in forms]
    prefix=np.r_[0,np.cumsum(cues)];lex=[lexical(t) for t in forms];n=len(forms)
    totals=collections.defaultdict(lambda:[0.,0.]);excluded=collections.Counter();windows=collections.Counter()
    for w in (2,5):
        cache={}
        def context_lex(s):
            if s not in cache:cache[s]=set().union(*lex[s:s+w])
            return cache[s]
        def has(s):return int(prefix[s+w]>prefix[s])
        for i,count in enumerate(hits):
            if not count or i<w or i+w>=n:continue
            distant=starts(n,i,w)
            if not distant:continue
            past=has(i-w);future=has(i+1);expected=sum(has(s) for s in distant)/len(distant)
            sampled=distant if len(distant)<=64 else [distant[j] for j in np.linspace(0,len(distant)-1,64,dtype=int)]
            base=jaccard(lex[i],context_lex(i-w))
            matched=[s for s in sampled if abs(jaccard(lex[i],context_lex(s))-base)<=.02]
            values={"PAST_MINUS_FUTURE":past-future,"PAST_MINUS_DISTANT":past-expected}
            if matched:values["PAST_MINUS_TOPIC_MATCHED_DISTANT"]=past-sum(has(s) for s in matched)/len(matched)
            else:excluded[str(w)+"/NO_TOPIC_MATCHED_WINDOW"]+=count
            if .25<=i/(n-1)<=.75:
                values.update({"CENTRAL/"+k:v for k,v in list(values.items())})
            for name,value in values.items():totals[str(w)+"/"+name][0]+=count;totals[str(w)+"/"+name][1]+=count*value
            windows[str(w)+"/all_admissible"]+=len(distant);windows[str(w)+"/lexical_sampled"]+=len(sampled);windows[str(w)+"/lexical_matched"]+=len(matched)
    return {"metrics":{k:{"eligible_targets":int(n),"mean_difference":v/n} for k,(n,v) in totals.items()},"exclusions":dict(excluded),"control_windows":dict(windows)}
def run(args):
    db=ro(args.out/"P61_PRIVATE.sqlite");source=ro(args.source)
    selected=sorted([(hashlib.sha256(s.encode()).hexdigest(),s,g) for s,g in db.execute("SELECT strict,lineage FROM documents WHERE known_new=1 AND json_extract(metrics,'$.targets')>0")])[:2000]
    wanted={s:g for h,s,g in selected};paths=set()
    for s in wanted:
        member=source.execute("SELECT first_member FROM canonical WHERE strict=?",(s,)).fetchone()[0]
        paths.add(source.execute("SELECT path FROM shards WHERE member=? AND kind='paragraphs'",(member,)).fetchone()[0])
    groups=collections.defaultdict(list);excluded=collections.Counter();windows=collections.Counter();seen=set();start=time.perf_counter()
    for path in sorted(paths):
        current=None;forms=[]
        def flush():
            if current not in wanted:return
            seen.add(current);result=paired(forms)
            for k,v in result["metrics"].items():groups[k].append((wanted[current],v["eligible_targets"],v["mean_difference"]))
            excluded.update(result["exclusions"]);windows.update(result["control_windows"])
        with gzip.open(path,"rt",encoding="utf-8") as f:
            for line in f:
                row=json.loads(line)
                if row["document_variant"]!=current:flush();current=row["document_variant"];forms=[]
                if current in wanted:forms.append(row["form"])
        flush()
    assert len(seen)==len(wanted)
    result={"status":"EXECUTED","scope":"POST_PRIMARY_EXPLORATORY_PAIRED_EXTENSION","selected_documents":len(wanted),
            "groups":{k:summarize(v,6102) for k,v in groups.items()},"topic_match_exclusions":dict(excluded),"control_windows":dict(windows),
            "sampled_control_note":"All admissible distant starts for exact distant contrast; at most 64 evenly spaced starts for lexical matching",
            "wall_seconds":time.perf_counter()-start,"code_sha256":digest(__file__)}
    (args.out/"P61_PAIRED_LOCALITY_RESULTS.json").write_text(json.dumps(result,indent=2),encoding="utf-8");print(json.dumps(result))
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--source",type=Path,required=True);p.add_argument("--out",type=Path,required=True);run(p.parse_args())
