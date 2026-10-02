import argparse,json,os,subprocess,sys,hashlib
HERE=os.path.dirname(os.path.abspath(__file__))

def sh(cmd):
    print("+"," ".join(cmd),flush=True);subprocess.run(cmd,check=True)

def load(p):return json.load(open(p,encoding="utf-8"))
def main(sources,out):
    os.makedirs(out,exist_ok=True)
    receipts=[]
    for i,src in enumerate(sources):
        sub=os.path.join(out,f"source_{i+1}")
        sh([sys.executable,os.path.join(HERE,"run_gold_r10.py"),src,"--out",sub])
        r=load(os.path.join(sub,"gold_aggregate_receipt.json"))
        r["input_source_basename"]=os.path.basename(src)
        receipts.append(r)
    slots={};recovery={};families={};total=valid=za=ell=0
    hashes=[]
    for r in receipts:
        hashes.append(r.get("source_sha256"))
        total+=r["rust_validation"]["total"];valid+=r["rust_validation"]["valid"];za+=r.get("za_predicates",0);ell+=r.get("ellipsis_slots",0)
        for k,v in r.get("syntactic_slot_distribution",{}).items():slots[k]=slots.get(k,0)+v
        for k,v in r.get("recovery_type_distribution",{}).items():recovery[k]=recovery.get(k,0)+v
        for k,v in r.get("schema_family_counts",{}).items():families[k]=families.get(k,0)+v
    state="READY_FOR_FINAL_R10_ADJUDICATION" if receipts and all(r["state"]=="READY_FOR_SCIENTIFIC_ADJUDICATION" for r in receipts) and total==valid else "HOLD_GOLD_BUNDLE"
    h=hashlib.sha256("\n".join(sorted(x for x in hashes if x)).encode()).hexdigest()
    bundle={"contract":"KSGT-R10-NIKL-GOLD-BUNDLE-v1","state":state,"sources":len(receipts),"source_hash_set_sha256":h,
      "za_predicates":za,"ellipsis_slots":ell,"rust_validation":{"total":total,"valid":valid,"rate":valid/total if total else 0},
      "syntactic_slot_distribution":slots,"recovery_type_distribution":recovery,"schema_family_counts":families,
      "core_gold_ready":slots.get("SUBJECT",0)+slots.get("OBJECT",0)>0,
      "expanded_gold_ready":slots.get("COMPLEMENT",0)+slots.get("ADJUNCT",0)>0,
      "source_receipts":receipts}
    json.dump(bundle,open(os.path.join(out,"gold_bundle_receipt.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(json.dumps(bundle,ensure_ascii=False,indent=2));return 0 if state.startswith("READY") else 7
if __name__=="__main__":
    ap=argparse.ArgumentParser();ap.add_argument("sources",nargs="+");ap.add_argument("--out",default="r10_gold_bundle")
    a=ap.parse_args();raise SystemExit(main(a.sources,a.out))
