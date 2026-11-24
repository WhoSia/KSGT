"""Read-only archive audit: R4a -> R4b -> R4b1. No original text exported."""
import hashlib,json,zipfile,sys
from pathlib import Path
from collections import Counter

def sha(x):return hashlib.sha256(x).hexdigest()
def ts(x):return sha(x.encode('utf-8'))
def check(ok,msg):
    if not ok:raise ValueError(msg)
def archive(p):
    with zipfile.ZipFile(p) as z:
        check(z.testzip() is None,'CRC');check(len(z.namelist())==len(set(z.namelist())),'DUPLICATE_MEMBER')
        data={n:z.read(n) for n in z.namelist()}
    return data,{'sha256':sha(Path(p).read_bytes()),'bytes':Path(p).stat().st_size,'members':len(data)}
def responses(d):
    rs=[json.loads(b) for n,b in d.items() if n.endswith('.result.json')];out={r['id']:r for r in rs};check(len(rs)==len(out),'DUPLICATE_RESPONSE_ID')
    for r in rs:
        check(r['status']=='GENERATED' and r['finishReason']=='stop','RESPONSE_NOT_COMPLETE')
        check(ts(r['text'])==r['textSha256'],'RESPONSE_HASH')
        check(type(r['usage']['total_tokens']) is int and r['usage']['total_tokens']>=0,'BAD_TOKEN_COUNT')
    return out

def replay(a,b,c):
    # Nested copy identity, not independent experiments.
    ap='r4b-original/r4a-original/';bp='r4b-old/'
    check(all(b.get(ap+n)==v for n,v in a.items()),'R4A_NESTED_MISMATCH')
    check(all(c.get(bp+n)==v for n,v in b.items()),'R4B_NESTED_MISMATCH')
    ar,br,cr=map(responses,(a,b,c));check(set(ar)<=set(br) and set(br)==set(cr),'CALL_LINEAGE')
    check(all(br[k]==v for k,v in ar.items()) and br==cr,'RESPONSE_LINEAGE')
    score=json.loads(a['r4a-live/final-score.json']); rec=json.loads(b['r4b-verified-recovery.json']);post=json.loads(c['r4b1-replay.json'])
    token=Counter(); choices=Counter(); agree=0
    for r in score['rows']:
        w=r['sourceWork']; suffix={'direct':'direct','rich':'rich','auditDirect':'audit_direct','auditRich':'audit_rich','chooser':'state_text_choice'}
        for k,s in suffix.items():
            p=ar[w+'_'+s];check(p['usage']['total_tokens']==r['callTokens'][k],'R4A_COST_MISMATCH');token[k]+=p['usage']['total_tokens']
            if k in ('direct','rich'):check(p['finalSha256']==r['candidateSha256'][k] and ts(p['final']['text'])==p['finalSha256'],'R4A_CANDIDATE_HASH')
        ch1=r['executable']['choice'];ch2=r['stateAsText']['choice'];choices[(str(ch1),str(ch2))]+=1
        agree+=int(r['exactSelectedSha256']['controller']==r['exactSelectedSha256']['stateAsText'])
    check(sum(token.values())==score['totalTokens'] and dict(token)==score['byArmTokens'],'R4A_TOTAL_COST')
    check(agree==score['selectionsAgree'],'R4A_AGREEMENT')
    bcost=Counter();strict=Counter();rewrite=Counter();rescues=0;post_removed=0;no_target=0;target_total=0
    pidx={r['id']:r for r in post['rows']};check(len(pidx)==len(post['rows'])==len(rec['rows']),'REPLAY_ROW_COUNT')
    for r in rec['rows']:
        old=ar[r['work']+'_'+r['arm']];check(old['finalSha256']==r['originalTextSha256'],'R4B_PARENT_HASH');q=pidx[r['id']]
        check(r['goldStatus']==q['expectedFlag'] and r['patch']['status']==q['baseline'],'R4B1_LABEL_LINK')
        for arm in ('patch','rewrite'):
            p=br[r['id']+'_'+arm];v=r[arm];check(p['textSha256']==v['modelResponseSha256'],'R4B_RESPONSE_LINK');check(p['usage']['total_tokens']==v['usage']['total_tokens'],'R4B_COST');bcost[arm]+=p['usage']['total_tokens'];check(ts(v['output'])==v['resultSha256'],'R4B_OUTPUT_HASH')
        if r['goldStatus']=='ISSUE':
            start,end=r['target']['originalSpan']; parent=old['final']['text'];check(0<=start<end<=len(parent),'TARGET_SPAN_RANGE'); span=parent[start:end]
            check((span in r['patch']['output'])==r['target']['remainedInModelPatch'],'PATCH_SPAN_REPLAY');check((span in r['rewrite']['output'])==r['target']['remainedInFullRewrite'],'REWRITE_SPAN_REPLAY');check((span not in q['outputText'])==q['removedOriginalTarget'],'POSTHOC_SPAN_REPLAY')
            target_total+=1;strict[r['patch']['status']]+=1;rewrite[r['rewrite']['status']]+=1
            check(ts(q['outputText'])==q['outputSha256'],'R4B1_OUTPUT_HASH');rescues+=int(q['adapter']=='EDGE_WHITESPACE_ALIGNED_UNVERIFIED');post_removed+=int(q['removedOriginalTarget'])
        else:
            check(not q['changed'] and not r['patch']['changed'] and not r['rewrite']['changed'],'NO_TARGET_CHANGE');no_target+=1
    check(sum(bcost.values())==rec['totalTokens'],'R4B_COST_TOTAL')
    return {'status':'EXPOSED_DEVELOPMENT_ONLY','r4a_nested_members_equal':len(a),'r4b_nested_members_equal':len(b),'r4a_archived_calls':len(ar),'r4b_incremental_archived_calls':len(br)-len(ar),'r4b1_incremental_archived_calls':len(cr)-len(br),'r4a_tokens':dict(token),'r4a_selection_agreement':agree,'r4a_choice_pairs':{k[0]+' / '+k[1]:v for k,v in sorted(choices.items())},'r4b_tokens':dict(bcost),'r4b_target_cases':target_total,'r4b_strict_status':dict(strict),'r4b_rewrite_status':dict(rewrite),'r4b1_edge_whitespace_rescues':rescues,'r4b1_recorded_target_removal':post_removed,'no_target_unchanged_all':no_target,'new_provider_calls':0,'independent_reader_ratings':0,'quality_promotion':False,'limitations':'Posthoc investigator-selected targets and archived flags only; exact-string disappearance and byte equality do not establish semantic correctness or human preference.'}
def run(paths):
    a,am=archive(paths[0]);b,bm=archive(paths[1]);c,cm=archive(paths[2]);r=replay(a,b,c);r['archives']={'R4a':am,'R4b':bm,'R4b1':cm};return r
if __name__=='__main__':print(json.dumps(run(sys.argv[1:]),ensure_ascii=False,indent=2))
