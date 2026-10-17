"""Read-only canonical reservoir metadata census; counts are lexical proxies only."""
import collections, datetime, hashlib, json, pathlib, shutil, sqlite3, time
ROOT=pathlib.Path('C:/KSGT_SERVER')
RUN=ROOT/'70_RUNS/p62_r4_r3_20261013'
OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013'
def ro(p):
    c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);c.execute('pragma cache_size=-131072');return c
def write(name,x):
    (OUT/name).write_text(json.dumps(x,ensure_ascii=True,indent=2),encoding='utf-8')
def main():
    start=time.time();c=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite')
    # Indexed occurrence lookups retain canonical identity; dates come from original document metadata.
    q='select c.strict,c.first_member,c.ordinal,c.paragraphs,o.file_id,o.metadata,o.feature,m.archive from canonical c join occurrences o on o.member=c.first_member and o.ordinal=c.ordinal join members m on m.key=c.first_member'
    groups=collections.defaultdict(collections.Counter);n=0
    for strict,member,ordinal,units,container,meta,feature,archive in c.execute(q):
        md=json.loads(meta).get('document',{});date=str(md.get('date',''));year=int(date[:4]) if len(date)==8 and date.isdigit() else None
        feat=json.loads(feature);g=groups[archive,container,year]
        g['structures']+=1;g['paragraphs']+=units;g['literal_proxy_targets']+=feat.get('geujung',0);g['proxy_target_positive']+=int(feat.get('geujung',0)>0)
        n+=1
        if n%250000==0:print(json.dumps({'phase':'reservoir_metadata_inventory','structures':n,'elapsed_seconds':time.time()-start}),flush=True)
    rows=[{'release':a,'container_private':b,'publication_year':y,'publication_year_authority':'DOCUMENT_METADATA' if y else 'UNKNOWN',**v} for (a,b,y),v in sorted(groups.items(),key=lambda x:str(x[0]))]
    write('RESERVOIR_INVENTORY.private.json',{'status':'EXECUTED','rows':rows,'canonical_structures':n,'elapsed_seconds':time.time()-start,'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'target_definition':'Existing ingestion geujung literal proxy, narrower than full P62 target regex; original-unit full regex census must precede freezing','free_bytes':shutil.disk_usage(ROOT).free,'semantic_independence':'HOLD'})
    print(json.dumps({'status':'EXECUTED','structures':n,'strata':len(rows),'target_positive_containers':len({b for (a,b,y),v in groups.items() if v['proxy_target_positive']}),'verified_positive_years':sorted({y for (a,b,y),v in groups.items() if y and v['proxy_target_positive']}),'elapsed_seconds':time.time()-start}),flush=True)
if __name__=='__main__':main()
