import argparse,json,os,tempfile
from pathlib import Path
from nikl_schema_r10 import materialize,json_files,load_docs,sentences,classify,norm_slot

def anchor(a):
    sid=a.get("sentence_id")
    if sid is None:return None
    b=a.get("begin");e=a.get("end")
    return f"NIKL:{sid}:{b if b is not None else 'NA'}-{e if e is not None else 'NA'}"

def pred_obj(z):
    p=z.get("predicate") or {}
    return {"predicate":str(p.get("form") or "").strip(),"sense":None}

def graph(slot,referent,witness,predicate,recovery,restored_form=None,discourse=None):
    return {"version":"KSGT-ARG-v1","event":predicate,"roles":[{
        "syntactic_slot":slot,"semantic_role":None,"referent":referent,"frame_status":"UNKNOWN",
        "recovery":recovery,"witness":witness,"particle":None,"role_source":"NIKL_ZA_GOLD_SLOT"
    }],"scope":{},"discourse":discourse or {},"realization":{"restored_form":restored_form}}

def records(src,census_path):
    c=json.load(open(census_path,encoding="utf-8"))
    if c.get("state")!="READY":raise RuntimeError("SCHEMA_NOT_READY")
    with tempfile.TemporaryDirectory(prefix="ksgt-r10-adapt-") as tmp:
        root,_=materialize(src,tmp)
        for p in json_files(root):
            for obj in load_docs(p):
                ss=list(sentences(obj));pos={x.get("id"):i for i,x in enumerate(ss) if x.get("id") is not None}
                for s in ss:
                    sid=s.get("id")
                    for zi,z in enumerate(s.get("ZA",[])):
                        fam=classify(z);pred=pred_obj(z)
                        if not pred["predicate"]:raise RuntimeError("EMPTY_PREDICATE")
                        if fam=="NIKL_ZA_LEGACY_2020_2024":
                            for ai,a in enumerate(z.get("antecedent",[])):
                                w=anchor(a);rec="ZERO_ANAPHORIC" if w else "ZERO_GENERIC_OR_EXOPHORIC"
                                rid=f"{sid}|ZA{zi}|A{ai}";asid=a.get("sentence_id")
                                d=(pos.get(asid)-pos.get(sid)) if asid in pos and sid in pos else None
                                disc={"predicate_sentence_id":sid,"antecedent_sentence_id":asid,"antecedent_sentence_distance":d}
                                yield rid,fam,graph(norm_slot(a.get("type")),w,w,pred,rec,a.get("form"),disc)
                        elif fam=="NIKL_ZA_ELLIPSIS_2025":
                            for ei,e in enumerate(z.get("ellipsis",[])):
                                r=e.get("restored") or {};a=e.get("antecedent") or {}
                                w=anchor(a);rec="ZERO_ANAPHORIC" if w else "ZERO_GENERIC_OR_EXOPHORIC"
                                rid=f"{sid}|ZA{zi}|E{ei}";asid=a.get("sentence_id")
                                d=(pos.get(asid)-pos.get(sid)) if asid in pos and sid in pos else None
                                disc={"predicate_sentence_id":sid,"antecedent_sentence_id":asid,"antecedent_sentence_distance":d}
                                yield rid,fam,graph(norm_slot(r.get("type")),w,w,pred,rec,r.get("form"),disc)
                        elif fam=="NIKL_ZA_TRANSITIONAL_RESTORED":
                            rs=z.get("restored",[]);ants=z.get("antecedent",[])
                            if len(rs)!=len(ants):raise RuntimeError("TRANSITIONAL_LENGTH_MISMATCH")
                            for ei,(r,a) in enumerate(zip(rs,ants)):
                                w=anchor(a);rec="ZERO_ANAPHORIC" if w else "ZERO_GENERIC_OR_EXOPHORIC"
                                rid=f"{sid}|ZA{zi}|T{ei}";asid=a.get("sentence_id")
                                d=(pos.get(asid)-pos.get(sid)) if asid in pos and sid in pos else None
                                disc={"predicate_sentence_id":sid,"antecedent_sentence_id":asid,"antecedent_sentence_distance":d}
                                yield rid,fam,graph(norm_slot(r.get("type")),w,w,pred,rec,r.get("form"),disc)

def run(src,census,out_dir):
    os.makedirs(out_dir,exist_ok=True);n=0;families={};slots={};req=os.path.join(out_dir,"arg_validate_requests.jsonl")
    with open(req,"w",encoding="utf-8") as w,open(os.path.join(out_dir,"arg_gold_graphs.jsonl"),"w",encoding="utf-8") as g:
        for rid,fam,gr in records(src,census):
            n+=1;families[fam]=families.get(fam,0)+1;sl=gr["roles"][0]["syntactic_slot"];slots[sl]=slots.get(sl,0)+1
            g.write(json.dumps({"id":rid,"schema_family":fam,"graph":gr},ensure_ascii=False)+"\n")
            w.write(json.dumps({"id":rid,"op":"validate","left":gr},ensure_ascii=False)+"\n")
    r={"state":"ADAPTED","records":n,"schema_family_counts":families,"syntactic_slot_counts":slots,"requests":req}
    if n==0:r["state"]="FAIL_ZERO_ADAPTED_RECORDS"
    json.dump(r,open(os.path.join(out_dir,"adapter_summary.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    return r

if __name__=="__main__":
    ap=argparse.ArgumentParser();ap.add_argument("source");ap.add_argument("schema_census");ap.add_argument("out_dir")
    a=ap.parse_args();print(json.dumps(run(a.source,a.schema_census,a.out_dir),ensure_ascii=False,indent=2))
