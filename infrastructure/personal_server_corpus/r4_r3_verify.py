"""Independent read-only census and frozen-contract verification."""
import datetime,json,pathlib,sqlite3,time
from r4_r3_inventory import ROOT,RUN,OUT,ro,write
from r4_r3_custody import sha,fingerprints
import p62_r4_r3_transfer_gate as gate
def main():
    start=time.time();d=json.loads((OUT/'FROZEN_TRANSFER_PREDECLARATION.json').read_text());m=json.loads((OUT/'FROZEN_COHORT.private.json').read_text())['manifest'];assert gate.verify_manifest(m)
    inputs={n:sha(RUN/n)==h for n,h in d['source_sha256'].items()};codes={n:sha(RUN/'code'/n)==h for n,h in d['code_sha256'].items()};assert all(inputs.values()) and all(codes.values())
    source=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');expected=set(m['by_split']['frozen_transfer']['tokens']);reserved=set(m['by_split']['reserved_late']['tokens']);censuses={}
    for arm in ['R3','R4']:
        db=ro(RUN/(arm+'_TRANSFER.private.sqlite'));actual=set(s for s, in db.execute('select strict from results'));assert actual==expected and not(actual&reserved)
        census=db.execute('select count(*),sum(targets) from results').fetchone();assert db.execute('pragma quick_check').fetchone()[0]=='ok'
        for s, in db.execute('select strict from results'):
            forms=json.loads(source.execute('select forms from docs where strict=?',(s,)).fetchone()[0]);assert fingerprints(forms)==s
        censuses[arm]={'structures':census[0],'targets':census[1],'checkpoint_sha256':sha(RUN/(arm+'_TRANSFER.private.sqlite')),'quick_check':'ok','source_structure_binding':'VERIFIED'}
    main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite');reservoir={'members':main.execute('select count(*) from members').fetchone()[0],'representations':main.execute('select sum(documents) from members').fetchone()[0],'incomplete_members':main.execute('select count(*) from members where complete!=1 or sha256 is null').fetchone()[0],'canonical_structures':main.execute('select count(*) from canonical').fetchone()[0],'paragraphs':main.execute('select sum(paragraphs) from canonical').fetchone()[0],'shards':main.execute('select count(*) from shards').fetchone()[0],'wal_bytes':(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite-wal').stat().st_size if (ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite-wal').exists() else 0}
    out={'status':'VERIFIED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'censuses':censuses,'frozen_source_hash_checks':inputs,'frozen_code_hash_checks':codes,'reserved_late_inference_records':0,'reservoir_readonly_census':reservoir,'elapsed_seconds':time.time()-start,'claim_ceiling':'Exact output census, source/code seals and retained source structure only; not semantic reference validity or global intellectual-work independence.'};write('INDEPENDENT_EXECUTION_VERIFICATION.json',out);print(json.dumps(out,indent=2),flush=True)
if __name__=='__main__':main()
