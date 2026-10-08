#!/usr/bin/env python3
"""KSGT G9-P53: private rights-preserving NIKL zero-anaphora 2025 census.
Run against an authorized locally obtained NIKL_ZA_2025_v1.0.zip only.
Emits aggregate metadata and SHA hashes; never exports individual sentences.
This data is not a gold dataset for Korean partitives such as '그중'.
"""
import collections, hashlib, json, pathlib, sys, zipfile

EXPECTED_SHA256="c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d"
MEMBERS=("NXZA2502512313.json","SXZA2502512312.json")

def file_sha(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(4*1024*1024),b""):
            h.update(chunk)
    return h.hexdigest()

def audit_documents(documents):
    counts=collections.Counter()
    roles=collections.Counter()
    for doc in documents:
        counts["documents"]+=1
        for s in doc.get("sentence",[]) or []:
            counts["sentences"]+=1
            hit="그중" in (s.get("form","") or "")
            if hit:
                counts["sentences_with_geujung"]+=1
            for za in s.get("ZA",[]) or []:
                for slot in za.get("ellipsis",[]) or []:
                    counts["ellipsis_slots"]+=1
                    restored=slot.get("restored",{}) or {}
                    role=restored.get("type","")
                    roles[str(role)]+=1
                    antecedents=slot.get("antecedent",[]) or []
                    if len(antecedents)>1:
                        counts["multi_antecedent_slots"]+=1
                    if hit:
                        counts["slots_in_geujung_sentences"]+=1
    return {"counts":dict(sorted(counts.items())),"restored_roles":dict(sorted(roles.items()))}

def run(archive):
    observed=file_sha(archive)
    if observed!=EXPECTED_SHA256:
        raise ValueError("RAW_ZIP_SHA256_MISMATCH")
    results=[]
    with zipfile.ZipFile(archive) as z:
        for member in MEMBERS:
            if member not in z.namelist():
                raise ValueError("EXPECTED_MEMBER_MISSING")
            with z.open(member) as f:
                root=json.load(f)
            results.append({"member":member,**audit_documents(root["document"])})
    return {
        "schema":"ksgt.g9.p53.krc.v06.nikl2025-safe-census.v1",
        "archive_sha256":observed,
        "corpus":"NIKL Zero Anaphora Corpus 2025",
        "results":results,
        "partitive_coreference_gold":"NOT_ANNOTATED_AS_SUCH",
        "scope":"SLOT COUNTS, SOURCE-RAW TRANSCRIPT NEVER OUTPUT",
        "conclusion":"Surface frequency of 그중 is not an antecedent-linking label; cannot train or certify a partitive resolver from this alone."
    }

if __name__=="__main__":
    if len(sys.argv)!=3:
        raise SystemExit("Usage: python audit_nikl_2025.py source.zip aggregate.json")
    result=run(sys.argv[1])
    pathlib.Path(sys.argv[2]).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"source_hash":result["archive_sha256"],"counts":[{
        "member":z["member"],**z["counts"]} for z in result["results"]],"raw_text":"NOT_EMITTED"},ensure_ascii=False))
