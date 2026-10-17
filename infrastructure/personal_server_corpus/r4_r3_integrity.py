"""Fresh immutable archive and sealed historical delivery verification."""
import datetime,hashlib,json,pathlib,time
from r4_r3_inventory import ROOT,OUT,write
from r4_r3_custody import sha
def main():
    start=time.time();config=json.loads((ROOT/'70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json').read_text())
    rows=[]
    for name,expected in config['archive_sha256'].items():
        p=ROOT/'10_INBOX/nikl_legacy_14zip'/name;actual=sha(p)
        rows.append({'name':name,'bytes':p.stat().st_size,'sha256':actual,'match':actual==expected})
        if actual!=expected:raise ValueError('Raw source archive changed')
        print(json.dumps({'archives_verified':len(rows)}),flush=True)
    write('FRESH_ARCHIVE_INTEGRITY.private.json',{'status':'VERIFIED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'archives':rows,'elapsed_seconds':time.time()-start})
if __name__=='__main__':main()
