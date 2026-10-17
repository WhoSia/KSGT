"""P62-R3 development-only machine court for the existing private R2 unique packet.

Read-only input, output outside original export, no corpus prose in receipts.
No new human data, no semantic recovery claim, no corpus prevalence estimand.
"""
import argparse
import collections
import copy
import datetime
import gzip
import hashlib
import json
from pathlib import Path

from p62_reference import digest, rank_candidate
from p62_r2 import canonical_target
from p62_r3_inference import policy_court, rank

SUFFIX_ATTACKS = (
    " 두 명, 후행 통제.",
    " 세 마리, 후행 통제.",
    " 열 가지, 후행 통제.",
    " 여러 건, 후행 통제.",
    " 아무것도 언급하지 않았다.",
    " 그들은 여기에서 기다렸다.",
    " 이름 없는 언어적 기술.",
    " 두 명, 두 마리, 세 건.",
)
VERSION = "P62-R3-machine-court-v1"


def _choice(c):
    return None if c is None else c["candidate_id"]


def evaluate_item(item):
    if item["human_ground_truth"] is not None or item["independent_adjudications"]:
        raise ValueError("Development-only run refuses labels or judgments")
    canonical_target(item)
    if not item["target"]["observed"]:
        return None
    court = policy_court(item)
    forms = {z["unit"]: z["text"] for z in item["context"]}
    t = item["target"]
    structural = rank_candidate(forms, t, item["candidates"], "STRUCTURAL")
    lexical = rank_candidate(forms, t, item["candidates"], "LEXICAL")
    controls = collections.Counter()
    for suffix in SUFFIX_ATTACKS:
        edited = copy.deepcopy(item)
        unit = t["unit"]
        for ctx in edited["context"]:
            if ctx["unit"] == unit:
                ctx["text"] = ctx["text"][:t["end"]] + suffix
            elif ctx["unit"] > unit:
                ctx["text"] = "후행 통제 문단."
        check = policy_court(edited)
        if check["prefix_signature"] != court["prefix_signature"]:
            raise AssertionError("Identical prefix produced a different signature")
        if check["selected_ids"] != court["selected_ids"]:
            raise AssertionError("After-target edit changed prefix-only ranking")
        hypothetical = {z["unit"]: z["text"] for z in edited["context"]}
        candidate = rank_candidate(hypothetical, t, item["candidates"], "STRUCTURAL")
        controls["legacy_structural_changed"] += _choice(candidate) != _choice(structural)
        candidate = rank_candidate(hypothetical, t, item["candidates"], "LEXICAL")
        controls["legacy_lexical_changed"] += _choice(candidate) != _choice(lexical)
    # No candidate snippets, private IDs, source text, or packet hashes in receipt.
    return {"family": str(item.get("family", "UNKNOWN")),
            "year": str(item.get("year", "UNKNOWN")),
            "structural_lexical_disagree": _choice(structural) != _choice(lexical),
            "prefix_accessibility_vs_structural": court["selected_ids"]["PREFIX_ACCESSIBILITY"] != _choice(structural),
            "prefix_accessibility_vs_lexical": court["selected_ids"]["PREFIX_ACCESSIBILITY"] != _choice(lexical),
            "prefix_accessibility_vs_recency": court["accessibility_recency_disagree"],
            "prefix_accessibility_vs_repetition": court["accessibility_repetition_disagree"],
            "no_prefix_candidate": court["all_abstain"],
            "legacy_structural_suffix_attack_changes": controls["legacy_structural_changed"],
            "legacy_lexical_suffix_attack_changes": controls["legacy_lexical_changed"],
            "suffix_attacks": len(SUFFIX_ATTACKS)}


def aggregate(items):
    rows = [x for x in (evaluate_item(item) for item in items) if x is not None]
    fields = [name for name in rows[0] if name not in {"family", "year"}] if rows else []
    def tally(group):
        return {"observed_targets":len(group), **{
            name:sum(row[name] for row in group) for name in fields}}
    families = collections.defaultdict(list)
    years = collections.defaultdict(list)
    for row in rows:
        families[row["family"]].append(row)
        years[row["year"]].append(row)
    return {"status":"EXECUTED_MACHINE_PROVISIONAL",
            "authority":"DEVELOPMENT_EXPOSED_PACKET_NOT_FINAL_HOLDOUT",
            "overall":tally(rows),
            "by_family":{name:tally(group) for name,group in sorted(families.items())},
            "by_year":{name:tally(group) for name,group in sorted(years.items())},
            "note":"Suffix edits are synthetic adversarial probes on original item prefixes, not real corpus examples or human judgments.",
            "semantic_accuracy":None,"human_ground_truth":None}


def run(packet, out, expected_sha256, expected_items=2254):
    packet=Path(packet);out=Path(out)
    if out.exists():
        raise FileExistsError("Refuse to overwrite any existing R3 output")
    if len(expected_sha256)!=64 or digest(packet)!=expected_sha256:
        raise ValueError("Explicit frozen R2 packet SHA-256 mismatch")
    with gzip.open(packet,"rt",encoding="utf-8") as f:
        items = [json.loads(line) for line in f if line.strip()]
    if len(items)!=expected_items:
        raise ValueError("Unexpected R2 packet census")
    observed = sum(x["target"]["observed"] for x in items)
    if observed!=1845 and expected_items==2254:
        raise ValueError("R2 unique target census mismatch")
    result=aggregate(items)
    result.update(version=VERSION, item_count=len(items), observed_target_count=observed,
                  source_sha256=expected_sha256,
                  utc=datetime.datetime.now(datetime.timezone.utc).isoformat())
    out.mkdir(parents=True)
    target=out/"R3_MACHINE_PREFIX_FALSIFICATION.json"
    payload=(json.dumps(result,indent=2,ensure_ascii=False)+"\n").encode("utf-8")
    target.write_bytes(payload)
    manifest={"schema":VERSION,"files":[{"name":target.name,
               "sha256":hashlib.sha256(payload).hexdigest(),"bytes":len(payload)}],
              "human_labels":0,"private_corpus_prose_exported":False,
              "original_R2_files_modified":False}
    (out/"R3_SHA256_MANIFEST.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    return result


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--packet",required=True)
    p.add_argument("--out",required=True)
    p.add_argument("--expected-sha256",required=True)
    p.add_argument("--expected-items",type=int,default=2254)
    args=p.parse_args()
    report=run(args.packet,args.out,args.expected_sha256,args.expected_items)
    print(json.dumps({"status":report["status"],
                      "observed_targets":report["observed_target_count"],
                      "overall":report["overall"]},ensure_ascii=False))
