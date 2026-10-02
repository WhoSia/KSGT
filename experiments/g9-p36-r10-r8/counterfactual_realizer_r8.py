import hashlib, re, unicodedata
from collections import Counter

POSITION_CLASSES={
    "CLAUSE_INITIAL",
    "BEFORE_SUBJECT_OR_TOPIC",
    "AFTER_SUBJECT_BEFORE_PREDICATE",
    "BEFORE_PREDICATE",
    "OTHER",
}

def normalize_surface(s):
    return re.sub(r"\\s+"," ",unicodedata.normalize("NFKC",s)).strip()

def position_authority(counts, min_donors=3, dominant=0.85, second_max=0.10):
    n=sum(counts.values())
    if n<min_donors:
        return None
    ranked=sorted(counts.items(),key=lambda kv:(-kv[1],kv[0]))
    top,topn=ranked[0]
    second=(ranked[1][1]/n) if len(ranked)>1 else 0.0
    if topn/n>=dominant and second<=second_max:
        return top
    return None

def certify_local_roundtrip(original,counterfactual,edit_span,segment,direction):
    b,e=edit_span
    if direction=="OVERT_TO_NULL":
        return counterfactual[:b]+segment+counterfactual[b:]==original
    if direction=="NULL_TO_OVERT":
        return counterfactual[:b]+counterfactual[e:]==original
    return False

def blind_order_seed(pair_id):
    return hashlib.sha256(("KSGT-R8|"+pair_id).encode()).hexdigest()[:16]

def packet_gate(packet, r7_pair_indices, near_duplicate_pairs=0):
    cells=Counter((x["source_lane"],x["slot"]) for x in packet)
    dirs=Counter(x["direction"] for x in packet)
    overlap=sum(1 for x in packet if x["pair_index"] in r7_pair_indices)
    surfaces=[normalize_surface(x["counterfactual_surface"]) for x in packet]
    exact=sum(v-1 for v in Counter(surfaces).values() if v>1)
    return {
        "minimum_total_pass_120":len(packet)>=120,
        "each_source_slot_min_20":bool(cells) and min(cells.values())>=20,
        "both_directions_required":set(dirs)=={"OVERT_TO_NULL","NULL_TO_OVERT"},
        "null_to_overt_min_30":dirs["NULL_TO_OVERT"]>=30,
        "duplicate_count_0":exact==0,
        "near_duplicate_cluster_max_1":near_duplicate_pairs==0,
        "no_R7_development_overlap":overlap==0,
    }
