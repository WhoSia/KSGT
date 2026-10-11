"""Collision-resistant provisional source-document fragment identity, not semantic gold."""
import hashlib,json,re
def source_key(release,file_id,document_id,publisher,date):
    if not file_id or not document_id:raise ValueError("Missing source identity")
    framed=json.dumps(["P61_SOURCE_DOCUMENT_V1",release,file_id,document_id,publisher,date],ensure_ascii=True,separators=(",",":")).encode()
    return hashlib.sha256(framed).hexdigest()
def fragment_ranges(fragments):
    ordinals=[];prefixes=set();ranges=[]
    for identifiers in fragments:
        nums=[]
        for identifier in identifiers:
            m=re.fullmatch(r"(.*?)(\d+)",identifier)
            if not m:raise ValueError("Unverified source-unit ordinal schema")
            prefixes.add(m.group(1));nums.append(int(m.group(2)))
        if not nums:raise ValueError("Empty fragment")
        if nums!=list(range(min(nums),max(nums)+1)):raise ValueError("Fragment is not source-ordered and contiguous")
        ranges.append([min(nums),max(nums)]);ordinals+=nums
    if len(prefixes)!=1:raise ValueError("Different source-unit namespaces")
    if len(set(ordinals))!=len(ordinals):raise ValueError("Overlapping ordinals require text/provenance conflict review")
    observed=sorted(ordinals)
    return {"ranges":ranges,"observed_units":len(observed),
            "covers_one_through_observed_max":observed==list(range(1,max(observed)+1)),
            "full_original_document_certified":False,
            "authority":"Ordered observed fragment continuity; preserve each source representation"}

def lineage_signature(strict_signatures):
    # Snapshot-scoped identity changes when a graph component gains a new variant.
    values=sorted(set(strict_signatures))
    if not values:raise ValueError("Empty lineage component")
    frame=json.dumps(["P61_LINEAGE_GRAPH_V1",values],separators=(",",":")).encode()
    return hashlib.sha256(frame).hexdigest()
