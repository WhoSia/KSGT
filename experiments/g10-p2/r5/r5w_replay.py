"""Read-only replay of historical R5g/h/i archives; no source prose exported."""
import argparse, hashlib, json, zipfile
from pathlib import Path
from collections import Counter

def sha(b): return hashlib.sha256(b).hexdigest()
def textsha(s): return sha(s.encode('utf-8'))
def require(ok, reason):
    if not ok: raise ValueError(reason)
def read(path, score):
    with zipfile.ZipFile(path) as z:
        require(z.testzip() is None,'CRC_FAILURE')
        require(len(z.namelist())==len(set(z.namelist())),'DUPLICATE_MEMBER')
        b=z.read(score); j=json.loads(b)
        r=[json.loads(z.read(n)) for n in z.namelist() if n.endswith('.result.json')]
    return j,r,{'zip_sha256':sha(Path(path).read_bytes()),'score_sha256':sha(b),'bytes':Path(path).stat().st_size,'members':len(z.namelist())}
def indexed(rows,key):
    d={r[key]:r for r in rows}; require(len(d)==len(rows),'DUPLICATE_ID');return d

def replay(g,h,i,gr,hr,gm,hm,im):
    G=indexed(g['rows'],'sourceWork'); H=indexed(h['rows'],'sourceWork'); I=indexed(i['rows'],'sourceWork')
    require(set(H)==set(I),'PARENT_WORK_MISMATCH')
    require(not set(G)&set(H),'CROSS_RUN_ID_OVERLAP')
    require(i['sourceOriginalSHA256']==hm['score_sha256'],'PARENT_SCORE_HASH_MISMATCH')
    result={'stage':'DEVELOPMENT_REPLAY_ONLY','archives':{'R5g':gm,'R5h':hm,'R5i':im},'new_provider_calls':0,'independent_reader_outcomes':0,'quality_promotion':False}
    calls={}; hist={}; cross={}; counts={}
    for tag,rows in [('R5g',gr),('R5h',hr)]:
        indexed(rows,'id'); require(all(r['status']=='GENERATED' and r['finishReason']=='stop' for r in rows),'INCOMPLETE_RESPONSE')
        require(all(textsha(r['text'])==r['textSHA256'] for r in rows),'RESPONSE_TEXT_HASH_MISMATCH')
        for r in rows:
            require(type(r['usage']['total_tokens']) is int and r['usage']['total_tokens']>=0,'INVALID_TOKEN_COUNT')
            require(r['id']==r['sourceWork']+'_'+r['arm'],'RESPONSE_ID_MISMATCH')
        calls[tag]=len(rows); hist[tag]={a:{'calls':len(rs),'tokens':sum(r['usage']['total_tokens'] for r in rs),'latency_ms_sum':sum(r['latencyMs'] for r in rs)} for a in sorted({r['arm'] for r in rows}) for rs in [[r for r in rows if r['arm']==a]]}
    gi=indexed(gr,'id');hi=indexed(hr,'id')
    require(set(gi)=={w+'_'+a for w in G for a in ('DIRECT','LATTICE')},'G_CALL_COVERAGE')
    require(set(hi)=={w+'_'+a for w in H for a in ('DIRECT','SELECTOR')},'H_CALL_COVERAGE')
    for w,r in G.items():
        for a,o in r['outputs'].items():
            p=gi[w+'_'+a];require(o['text']==p['text'] and o['textSHA256']==p['textSHA256'] and o['providerTokens']==p['usage']['total_tokens'],'G_SCORE_RESPONSE_MISMATCH')
    selected_changes=[]; length_delta=[]; coverage=[]; same_agg=0; original_match=0
    for w,r in H.items():
        t=I[w];d=hi[w+'_DIRECT'];s=hi[w+'_SELECTOR']
        require(r['direct']['text']==d['text'] and r['direct']['outputSHA256']==d['textSHA256'] and r['direct']['modelTokens']==d['usage']['total_tokens'],'H_DIRECT_MISMATCH')
        require(r['selector']['rawModelText']==s['text'] and r['selector']['responseSHA256']==s['textSHA256'] and r['selector']['modelTokens']==s['usage']['total_tokens'],'H_SELECTOR_MISMATCH')
        for old,new in [('compiledSelected','originalR5hSelected'),('compiledDefault','originalR5hDefault')]:
            require(textsha(r[old]['text'])==r[old]['outputSHA256'] and r[old]['text']==t[new],'H_I_PARENT_TEXT_MISMATCH')
            original_match+=1
        require(t['actualDirect120B']==r['direct']['text'],'I_DIRECT_MISMATCH')
        selected_changes.append(r['selectionsChangedFromDefault'])
        for arm,old in [('aggregatedSelected','compiledSelected'),('aggregatedDefault','compiledDefault')]:
            a=t[arm]; require(textsha(a['text'])==a['outputSHA256'],'I_OUTPUT_HASH_MISMATCH')
            f=[str(x['frameID']) for x in r[old]['trace']]; f2=[str(fid) for x in a['segments'] for fid in x['sourceFrameIDs']]
            require(f==f2,'I_TRACE_FRAME_ORDER_MISMATCH'); require(len(a['segments'])==a['aggregatedSentenceCount'],'I_SEGMENT_COUNT_MISMATCH')
            coverage.append(len(f2));length_delta.append(len(a['text'])-len(r[old]['text']))
        same_agg+=int(t['aggregatedSelected']['text']==t['aggregatedDefault']['text'])
    result.update(historical_response_rows=calls,recorded_cost_by_arm=hist,distinct_source_ids=len(set(G)|set(H)),source_independence_certified=False,parent_compiled_text_matches=original_match,parent_direct_text_matches=len(H),aggregate_frame_trace_counts=coverage,aggregation_char_delta={'min':min(length_delta),'max':max(length_delta),'sum':sum(length_delta)},selected_vs_default_same_aggregated=same_agg,selector_changes=sum(selected_changes),selector_changed_work_count=sum(x>0 for x in selected_changes),warning='Archived provider records, not newly authenticated API calls. Frame trace agreement is not semantic gold. Different work IDs do not establish independence.')
    return result

def run(paths):
    g,gr,gm=read(paths[0],'r5g-live/final-score.json');h,hr,hm=read(paths[1],'r5h-live/final-score.json');i,ir,im=read(paths[2],'r5i-zero-call/compiled-aggregate-score.json');return replay(g,h,i,gr,hr,gm,hm,im)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('archives',nargs=3);a=p.parse_args();print(json.dumps(run(a.archives),ensure_ascii=False,indent=2))
