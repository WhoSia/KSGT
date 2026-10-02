import argparse,json,os,subprocess,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE)
from nikl_schema_r10 import census
from nikl_adapter_r10 import run as adapt
from summarize_gold_r10 import summarize

def sh(cmd):
    print("+"," ".join(cmd),flush=True);subprocess.run(cmd,check=True)

def main(source,out):
    os.makedirs(out,exist_ok=True)
    c=census(source,out)
    if c["state"]!="READY":
        print(json.dumps({"state":c["state"],"next":"INSPECT_SCHEMA_CENSUS_NO_ROW_SCORING"},ensure_ascii=False,indent=2));return 4
    a=adapt(source,os.path.join(out,"schema_census.json"),out)
    if a["records"]<=0:return 5
    manifest=os.path.join(HERE,"arg-core-rs","Cargo.toml")
    sh(["cargo","build","--release","--manifest-path",manifest])
    binary=os.path.join(HERE,"arg-core-rs","target","release","ksgt_arg_r10")
    receipts=os.path.join(out,"arg_validation_receipts.jsonl")
    sh([binary,"batch",os.path.join(out,"arg_validate_requests.jsonl"),receipts])
    summary=summarize(out,os.path.join(out,"gold_aggregate_receipt.json"))
    return 0 if summary["state"]=="READY_FOR_SCIENTIFIC_ADJUDICATION" else 6

if __name__=="__main__":
    ap=argparse.ArgumentParser(description="KSGT R10 NIKL gold runner; keeps row-level derivatives local.")
    ap.add_argument("source",help="Official NIKL archive, JSON file, or extracted directory")
    ap.add_argument("--out",default="r10_gold_work")
    a=ap.parse_args();raise SystemExit(main(a.source,a.out))
