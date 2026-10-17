"""Independently census a completed frozen event-role machine checkpoint."""
import collections
import json
import pathlib
import random
import sqlite3
import statistics

ROOT = pathlib.Path("C:/KSGT_SERVER")
RUN = ROOT / "70_RUNS/p62_event_role_20261017"
OUT = ROOT / "80_EXPORT/p62_referential_grounding_20261011/R6_EVENT_ROLE_20261017"
ARMS = ("A_R5_DESCRIPTOR", "B_NEAREST_ELIGIBLE", "C_R5_PARTICLE_GROUP",
        "D_NP_EVENT_SURFACE", "V3_GUARDED_REFERENCE")
COMPONENT_KINDS = {"EXACT_STRUCTURE", "EXACT_CONTIGUOUS_UNIT_SUBSET", "EXACT_CODEPOINT_RESEGMENTATION",
                   "VERIFIED_SHARED_LONG_UNIT", "VERIFIED_SHARED_LONG_PASSAGE", "VERIFIED_CROSS_ID_ALIAS"}


def interval(values, seed, repetitions=2000):
    if not values:
        return None
    observed = statistics.mean(values)
    rng = random.Random(seed)
    sims = sorted(statistics.mean(rng.choices(values, k=len(values))) for _ in range(repetitions))
    return {"estimate_pp": 100*observed, "cluster_bootstrap_95_pp":
            [100*sims[int(.025*repetitions)], 100*sims[int(.975*repetitions)-1]],
            "clusters": len(values), "repetitions": repetitions}


def analyze():
    frozen = json.loads((OUT / "FROZEN_EVENT_ROLE_COMPONENTS.private.json").read_text())
    manifest = frozen["manifest"]
    ids = set(manifest["by_split"]["frozen_transfer"]["tokens"])
    db = sqlite3.connect((RUN / "EVENT_ROLE_FROZEN.private.sqlite").as_uri()+"?mode=ro", uri=True)
    if db.execute("pragma quick_check").fetchone()[0] != "ok":
        raise ValueError("Frozen checkpoint integrity failure")
    rows = db.execute("select strict,member,container,year,targets,payload from results").fetchall()
    if {r[0] for r in rows} != ids:
        raise ValueError("Frozen denominator incomplete or unexpected")
    parent = {record["id"]: record["id"] for record in frozen["records"]}
    def root(key):
        while parent[key] != key:
            parent[key] = parent[parent[key]]
            key = parent[key]
        return key
    for link in frozen["links"]:
        if link["kind"] not in COMPONENT_KINDS:
            continue
        left, right = root(link["left"]), root(link["right"])
        if left != right:
            parent[max(left, right)] = min(left, right)
    proposals = collections.Counter()
    statuses = collections.defaultdict(collections.Counter)
    reason_target = collections.Counter()
    reason_witness = collections.Counter()
    evidence_counts = collections.Counter()
    paired_choices = collections.defaultdict(collections.Counter)
    by_year = collections.defaultdict(lambda: collections.Counter())
    by_container = collections.defaultdict(lambda: collections.Counter())
    doc_rates = []
    component_values = collections.defaultdict(list)
    targets = 0
    for strict, member, container, year, expected, payload in rows:
        decisions = json.loads(payload)
        if len(decisions) != expected:
            raise ValueError("Document target count mismatch")
        targets += expected
        local = collections.Counter()
        for decision in decisions:
            source = decision["new"]
            if source["status"] not in ("EXECUTED_MACHINE_ONLY", "HOLD_SOURCE_ADMISSION"):
                raise ValueError("Unexpected source admission state")
            if source["status"] == "HOLD_SOURCE_ADMISSION":
                arms = {name: {"status": "HOLD_SOURCE_ADMISSION", "selected": None}
                        for name in ARMS if name != "V3_GUARDED_REFERENCE"}
            else:
                arms = {"A_R5_DESCRIPTOR": decision["r5_a"],
                        "B_NEAREST_ELIGIBLE": source["arms"]["B_PROXIMITY"],
                        "C_R5_PARTICLE_GROUP": decision["r5_c"],
                        "D_NP_EVENT_SURFACE": source["arms"]["D_NP_EVENT_SURFACE"]}
            for name, arm in arms.items():
                statuses[name][arm["status"]] += 1
                hit = arm["selected"] is not None
                proposals[name] += hit
                local[name] += hit
            v3_hit = source["status"] == "EXECUTED_MACHINE_ONLY" and decision["v3_selected"] is not None
            statuses["V3_GUARDED_REFERENCE"][decision["v3_status"]] += 1
            proposals["V3_GUARDED_REFERENCE"] += v3_hit
            local["V3_GUARDED_REFERENCE"] += v3_hit
            d_choice = arms["D_NP_EVENT_SURFACE"]["selected"]
            for baseline in ("A_R5_DESCRIPTOR", "B_NEAREST_ELIGIBLE", "C_R5_PARTICLE_GROUP"):
                b_choice = arms[baseline]["selected"]
                relation = ("BOTH_SAME" if d_choice is not None and d_choice == b_choice else
                            "BOTH_DIFFERENT" if d_choice is not None and b_choice is not None else
                            "D_ONLY" if d_choice is not None else "BASELINE_ONLY" if b_choice is not None else
                            "NEITHER")
                paired_choices[baseline][relation] += 1
            relation = ("BOTH_SAME" if d_choice is not None and d_choice == decision["v3_selected"] else
                        "BOTH_DIFFERENT" if d_choice is not None and v3_hit else
                        "D_ONLY" if d_choice is not None else "BASELINE_ONLY" if v3_hit else "NEITHER")
            paired_choices["V3_GUARDED_REFERENCE"][relation] += 1
            witness_reasons = set()
            evidence_counts["eligible_source_nodes"] += len(source["evidence"])
            for evidence in source["evidence"]:
                evidence_counts["visible_np"] += evidence["noun_phrase_surface"] is not None
                evidence_counts["visible_predicate"] += evidence["predicate_surface"] is not None
                evidence_counts["visible_particle"] += evidence["particle_surface"] is not None
                for reason in evidence["reasons"]:
                    reason_witness[reason] += 1
                    witness_reasons.add(reason)
            for reason in witness_reasons:
                reason_target[reason] += 1
        rates = {name: local[name] / expected for name in ARMS}
        doc_rates.append(rates)
        component_values[root(strict)].append(rates)
        by_year[year]["structures"] += 1
        by_year[year]["targets"] += expected
        by_container[container]["structures"] += 1
        by_container[container]["targets"] += expected
        for name in ARMS:
            by_year[year][name] += local[name]
            by_container[container][name] += local[name]
    differences = {}
    component_differences = {}
    for index, baseline in enumerate(ARMS):
        if baseline == "D_NP_EVENT_SURFACE":
            continue
        differences[baseline] = interval(
            [r["D_NP_EVENT_SURFACE"]-r[baseline] for r in doc_rates], 620171+index)
        component_differences[baseline] = interval([
            statistics.mean(r["D_NP_EVENT_SURFACE"]-r[baseline] for r in group)
            for group in component_values.values()], 620271+index)
    result = {"status": "EXECUTED_MACHINE_ONLY", "structures": len(rows), "targets": targets,
              "source_dependency_components": len(component_values), "source_containers": len(by_container),
              "publication_years": sorted(by_year), "proposal_counts": dict(proposals),
              "status_counts": {k: dict(v) for k, v in statuses.items()},
              "document_equal_proposal_percent": {name: 100*statistics.mean(r[name] for r in doc_rates)
                                                   for name in ARMS},
              "D_minus_baseline_document_clustered": differences,
              "D_minus_baseline_component_clustered": component_differences,
              "source_evidence_counts": dict(evidence_counts),
              "rejection_reasons_witness_occurrences": dict(reason_witness),
              "rejection_reasons_target_presence": dict(reason_target),
              "paired_choice_relation": {k: dict(v) for k, v in paired_choices.items()},
              "by_publication_year": {str(k): dict(v) for k, v in sorted(by_year.items())},
              "by_source_container_private": {k: dict(v) for k, v in by_container.items()},
              "prior_R4_R5_corrected_reference": {"structures": 273, "targets": 281,
                 "R3_TYPED": 101, "R4": 73, "V3": 82, "M1_DESCRIPTOR": 0,
                 "M2_PARTICLE": 14, "M3_BOTH": 0, "M4_STAGED": 82},
              "reserved_late_inference": 0, "human_ground_truth": None,
              "semantic_accuracy": None, "global_semantic_work_independence": "HOLD"}
    (OUT / "EVENT_ROLE_MACHINE_RESULTS.private.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=True), encoding="utf-8")
    public = {k: v for k, v in result.items() if k != "by_source_container_private"}
    public["by_source_container_counts"] = sorted(by_container.values(), key=lambda x: x["structures"])
    (OUT / "EVENT_ROLE_MACHINE_RESULTS.json").write_text(json.dumps(public, indent=2), encoding="utf-8")
    return public


if __name__ == "__main__":
    print(json.dumps(analyze()), flush=True)
