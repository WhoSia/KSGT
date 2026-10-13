"""P62-R4-R3: auditable, privacy-preserving prospective transfer split gate.

Input is a *precomputed private candidate manifest*, NOT the raw 9-million
structure corpus. Hard edges are independently witnessed text-dependence
relations; uncertainty edges quarantine, metadata resemblance never proves
shared intellectual work. No semantic work identity or Korean gold is claimed.
"""
import collections
import hashlib
import json
import re

VERSION = "P62-R4-R3-transfer-gate-v2"
SHA = re.compile(r"^[0-9a-f]{64}$")
HARD = frozenset((
    "EXACT_STRUCTURE",
    "EXACT_CONTIGUOUS_UNIT_SUBSET",
    "EXACT_CODEPOINT_RESEGMENTATION",
    "VERIFIED_SHARED_LONG_UNIT",
    "VERIFIED_SHARED_LONG_PASSAGE",
    "VERIFIED_CROSS_ID_ALIAS",
))
UNCERTAIN = frozenset((
    "NORMALIZED_ONLY",
    "CROSS_ID_VERSION_UNRESOLVED",
    "UNVERIFIED_SOURCE_WORK_LINK",
    "POTENTIAL_REVISED_WORK_WITHOUT_TEXT_PROOF",
))
DIAGNOSTIC = frozenset(("METADATA_SIMILARITY_ONLY",))
SPLITS = ("machine_development", "frozen_transfer", "reserved_late")
POLICY = {"machine_development": 70, "frozen_transfer": 20,
          "reserved_late": 10}


def digest(value):
    return hashlib.sha256(
        json.dumps(value,sort_keys=True,separators=(",",":"),
                   ensure_ascii=False).encode("utf-8")).hexdigest()


def _sha(value):
    return type(value) is str and SHA.fullmatch(value) is not None


def _parse_records(records):
    by_id={}
    for r in records:
        if not isinstance(r,dict) or not _sha(r.get("id")):
            raise ValueError("Opaque 64-digit SHA-256 record ID required")
        token=r["id"]
        if token in by_id:
            raise ValueError("Duplicate strict candidate record ID")
        if type(r.get("exposed")) is not bool:
            raise ValueError("Exposure flag must be explicitly boolean")
        if type(r.get("lineage_complete")) is not bool:
            raise ValueError("Pre-outcome lineage audit must explicitly be complete/incomplete")
        if r.get("human_ground_truth") is not None or r.get("human_judgments") is not None:
            raise ValueError("Machine-only split may not ingest human answers")
        container=r.get("container_sha256")
        if container is not None and not _sha(container):
            raise ValueError("Container is an opaque SHA-256, not a bare private source ID")
        year=r.get("publication_year")
        if year is not None and (type(year) is not int or not 1800<=year<=2100):
            raise ValueError("Only explicit publication-year integers or None")
        authority=r.get("publication_year_authority")
        if authority not in ("DOCUMENT_METADATA", "UNKNOWN"):
            raise ValueError("Never substitute release filenames for publication metadata")
        if authority=="UNKNOWN" and year is not None:
            raise ValueError("Unknown publication provenance cannot carry a confirmed year")
        by_id[token]={
            "id":token,"container_sha256":container,
            "publication_year":year,
            "publication_year_authority":authority,
            "exposed":r["exposed"],
            "lineage_complete":r["lineage_complete"],
        }
    return by_id


def audit_transfer_split(records,links,*,seed="P62-R4-R3-preoutcome-v1",
                         min_eval_containers=3,min_eval_years=2):
    """Conservative reference court, not an exhaustive cross-corpus join.

    Input records and independently verified exact-text links MUST be
    prospectively sealed by caller. A semantic original-work claim remains
    HOLD even if this deterministic surface-custody court passes.
    """
    if not isinstance(seed,str) or not seed or len(seed)>150:
        raise ValueError("Nonempty compact predeclared seed required")
    if (type(min_eval_containers) is not int or min_eval_containers<1
            or type(min_eval_years) is not int or min_eval_years<1):
        raise ValueError("Positive predeclared coverage thresholds required")
    rs=_parse_records(records)
    if not rs:
        raise ValueError("No records; do not fabricate transfer evaluation")
    parent={x:x for x in rs}
    def root(x):
        while parent[x]!=x:
            parent[x]=parent[parent[x]]
            x=parent[x]
        return x
    def join(a,b):
        a,b=root(a),root(b)
        if a!=b:
            parent[max(a,b)]=min(a,b)

    witnesses=[]
    uncertain=[]
    diagnostics=[]
    duplicate_edges=set()
    for l in links:
        if not isinstance(l,dict):
            raise ValueError("Evidence link must be a record")
        a,b,k=l.get("left"),l.get("right"),l.get("kind")
        if a not in rs or b not in rs or a==b:
            raise ValueError("Evidence links require two distinct known endpoints")
        if k not in HARD|UNCERTAIN|DIAGNOSTIC:
            raise ValueError("Unknown source-link authority")
        canonical=(min(a,b),max(a,b),k)
        if canonical in duplicate_edges:
            raise ValueError("Duplicate evidence event; do not inflate relation counts")
        duplicate_edges.add(canonical)
        if k in HARD:
            if l.get("witness_verified") is not True:
                # Do not convert a self-attested exact relation into hard identity.
                uncertain.append((a,b,"UNVERIFIED_HARD_LINK"))
            else:
                join(a,b)
                witnesses.append((min(a,b),max(a,b),k))
        elif k in UNCERTAIN:
            uncertain.append((min(a,b),max(a,b),k))
        else:
            diagnostics.append((min(a,b),max(a,b),k))
    components=collections.defaultdict(list)
    for token in sorted(rs):
        components[root(token)].append(token)
    by_id_component={token:root(token) for token in rs}

    taints=collections.defaultdict(set)
    for token,r in rs.items():
        key=root(token)
        if r["exposed"]:
            taints[key].add("PRIOR_MACHINE_EXPOSURE")
        if not r["lineage_complete"]:
            taints[key].add("INCOMPLETE_SOURCE_LINEAGE")
        if r["container_sha256"] is None:
            taints[key].add("UNKNOWN_SOURCE_CONTAINER")
        if r["publication_year_authority"]!="DOCUMENT_METADATA" or r["publication_year"] is None:
            taints[key].add("UNVERIFIED_PUBLICATION_YEAR")
    for a,b,k in uncertain:
        for token in (a,b):
            taints[root(token)].add("UNCERTAIN_LINK_"+k)

    assignment={}
    excluded=collections.Counter()
    for key, members in sorted(components.items()):
        reasons=sorted(taints[key])
        if reasons:
            for token in members:
                assignment[token]="quarantine"
            for reason in reasons:
                excluded[reason]+=len(members)
            continue
        # Assign an entire exact-surface-dependency component to one split.
        bucket=int(digest({"seed":seed,"component":members})[:16],16)%100
        split=("machine_development" if bucket<POLICY["machine_development"]
               else "frozen_transfer" if bucket<sum((
                   POLICY["machine_development"],POLICY["frozen_transfer"]))
               else "reserved_late")
        for token in members:
            assignment[token]=split

    by_split={}
    for split in ("machine_development","frozen_transfer","reserved_late","quarantine"):
        ids=sorted(t for t in rs if assignment[t]==split)
        containers=sorted({rs[t]["container_sha256"] for t in ids
                           if rs[t]["container_sha256"] is not None})
        years=sorted({rs[t]["publication_year"] for t in ids
                      if rs[t]["publication_year"] is not None})
        by_split[split]={
            "records":len(ids),
            "dependency_components":len({by_id_component[t] for t in ids}),
            "observed_containers":len(containers),
            "observed_document_metadata_years":years,
            "tokens":ids,
        }
    eval_stats=by_split["frozen_transfer"]
    coverage_ok=(eval_stats["observed_containers"]>=min_eval_containers and
                 len(eval_stats["observed_document_metadata_years"])>=min_eval_years and
                 eval_stats["dependency_components"]>=min_eval_containers)
    coverage_status=("MACHINE_TRANSFER_COVERAGE_GATE_PASSED"
                     if coverage_ok else "HOLD_INSUFFICIENT_SOURCE_CONTAINER_OR_YEAR_COVERAGE")
    # Explicit counts and verified provenance relations are not labels.
    manifest={
        "version":VERSION,
        "seed":seed,
        "partition_policy_percent":POLICY,
        "predeclared_coverage_thresholds":{
            "frozen_transfer_min_observed_containers":min_eval_containers,
            "frozen_transfer_min_document_metadata_years":min_eval_years},
        "records":len(rs),
        "exact_surface_dependency_edges":len(witnesses),
        "uncertain_edges":len(uncertain),
        "metadata_diagnostic_edges":len(diagnostics),
        "components":len(components),
        "exclusion_reason_counts_overlapping":dict(sorted(excluded.items())),
        "by_split":by_split,
        "coverage_status":coverage_status,
        "global_semantic_source_work_independence":"HOLD",
        "all_work_identity_edges_semantic_gold":False,
        "human_ground_truth":None,
        "reference_accuracy":None,
        "claim_ceiling":"Prospective observed surface-custody exclusion only; no semantic same-work proof.",
    }
    manifest["manifest_sha256"]=digest(manifest)
    return manifest


def verify_manifest(manifest):
    """Ensure a saved manifest body has not changed after selection."""
    if not isinstance(manifest,dict):
        return False
    expected=manifest.get("manifest_sha256")
    return _sha(expected) and digest({k:v for k,v in manifest.items()
                                     if k!="manifest_sha256"})==expected

