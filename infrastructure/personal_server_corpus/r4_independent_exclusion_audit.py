"""Independent private long-unit exclusion ledger, without reproducing prose."""
import collections,gzip,hashlib,itertools,json,pathlib,sqlite3,unicodedata
ROOT=pathlib.Path('C:/KSGT_SERVER')
RUN=ROOT/'70_RUNS/p62_r4_r2_20261013'
OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R2_20261013'
def connect(path):return sqlite3.connect(path.as_uri()+'?mode=ro',uri=True)
def normalized(forms):return ''.join(ch for ch in unicodedata.normalize('NFC',''.join(forms)) if not ch.isspace())
def contains(big,small):
    return any(big[i:i+len(small)]==small for i in range(len(big)-len(small)+1))
c=connect(RUN/'COHORT.private.sqlite')
docs={key:json.loads(forms) for key,forms in c.execute("select strict,forms from candidate where excluded='SHARED_EXPOSED_LONG_UNIT'")}
index=collections.defaultdict(set)
for key,forms in docs.items():
    for form in forms:
        if len(form)>=80:index[hashlib.sha256(form.encode()).digest()].add(key)
old=connect(ROOT/'70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite')
linked=set();relations=collections.Counter();unit_hits=0;details=0;shards=0
with gzip.open(OUT/'SOURCE_OVERLAP_LINKS.private.jsonl.gz','wt',encoding='utf-8') as ledger:
    for path, in old.execute("select path from shards where kind='paragraphs' order by path"):
        with gzip.open(path,'rt',encoding='utf-8') as f:
            for old_key,iterator in itertools.groupby((json.loads(x) for x in f),lambda x:x['document_variant']):
                rows=list(iterator);old_forms=[x['form'] for x in rows];matches={}
                for row in rows:
                    form=row['form']
                    if len(form)<80:continue
                    digest=hashlib.sha256(form.encode()).digest()
                    for key in index.get(digest,()):
                        if form not in docs[key]:raise ValueError('Fingerprint collision or source mismatch')
                        unit_hits+=1;matches.setdefault(key,(row,digest.hex()))
                for key,(row,digest) in matches.items():
                    new=docs[key]
                    if old_forms==new:relation='EXACT_STRUCTURE'
                    elif contains(old_forms,new):relation='NEW_EXACT_CONTIGUOUS_SUBSET_OF_EXPOSED'
                    elif contains(new,old_forms):relation='EXPOSED_EXACT_CONTIGUOUS_SUBSET_OF_NEW'
                    elif normalized(new) in normalized(old_forms):relation='NEW_NORMALIZED_SUBSTRING_OF_EXPOSED'
                    elif normalized(old_forms) in normalized(new):relation='EXPOSED_NORMALIZED_SUBSTRING_OF_NEW'
                    else:relation='SHARED_LONG_UNIT_ONLY_WORK_IDENTITY_UNRESOLVED'
                    relations[relation]+=1
                    if key not in linked or details<10000:
                        ledger.write(json.dumps({'candidate':key,'exposed_structure':old_key,'relation':relation,'source_member':row['source_member'],'source_unit_ordinal':row['source_ordinal'],'unit_utf8_sha256':digest},ensure_ascii=True)+'\n');details+=1
                    linked.add(key)
        shards+=1
        if shards%500==0:print(json.dumps({'audit_shards':shards,'independently_linked_quarantines':len(linked)}),flush=True)
assert linked==set(docs), 'Independent exclusion ledger mismatch'
out={'status':'VERIFIED','independently_linked_quarantined_structures':len(linked),'exposed_shards':shards,'exact_unit_hit_occurrences':unit_hits,'candidate_exposed_structure_pair_relations':dict(relations),'stored_link_details':details,'detail_policy':'First 10000 pair details plus first proof for every quarantined structure; pair counts exhaustive','claim_ceiling':'Shared passages do not establish same article identity. Revised cross-ID works without a matched long unit remain unresolved.'}
(OUT/'INDEPENDENT_EXCLUSION_RELATION_AUDIT.json').write_text(json.dumps(out,indent=2),encoding='utf-8');print(json.dumps(out),flush=True)
