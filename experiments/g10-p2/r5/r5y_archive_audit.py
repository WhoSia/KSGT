"""Read-only exposed development archive analysis. No raw prose in outputs."""
import hashlib,json,zipfile,sys,difflib
from pathlib import Path
from collections import Counter

def sha(b):return hashlib.sha256(b).hexdigest()
def ts(s):return sha(s.encode())
def js(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'))
def check(ok,msg):
    if not ok:raise ValueError(msg)
def read(p,tag):
    with zipfile.ZipFile(p) as z:
        ns=z.namelist();check(len(ns)==len(set(ns)) and z.testzip() is None,'ARCHIVE_CRC_OR_DUPLICATE')
        data={n:z.read(n) for n in ns}
    score=json.loads(data[f'r5{tag.lower()}-live/final-score.json']);rs=[json.loads(b) for n,b in data.items() if n.endswith('.result.json')];idx={r['id']:r for r in rs}
    check(len(rs)==len(idx),'DUPLICATE_RESPONSE')
    for r in rs:
        check(r['status']=='GENERATED' and r['finishReason']=='stop','INCOMPLETE')
        check(ts(r['text'])==r.get('textSha256',r.get('textSHA256')),'RESPONSE_HASH')
        check(type(r['usage']['total_tokens']) is int and r['usage']['total_tokens']>=0,'TOKEN_COUNT')
        if 'finalSha256' in r:check(ts(r['final']['text'])==r['finalSha256'],'FINAL_HASH')
    return score,idx,data,{'bytes':Path(p).stat().st_size,'sha256':sha(Path(p).read_bytes()),'members':len(ns),'response_records':len(rs)}

def audit_a(j,rs):
    counts=Counter();cost=Counter();conditions=Counter();pairs=[]
    for r in j['rows']:
        w=r['id'];p=r['sharedPrefix']['text'];c=r['completions'];x=r['extractedState']['observations'];plan=r['planState']
        check(ts(p)==r['sharedPrefix']['sha256'] and ts(r['direct']['text'])==r['direct']['sha256'],'A_WRITER_HASH')
        check(rs[w+'_direct']['final']['text']==r['direct']['text'] and rs[w+'_prefix']['final']['text']==p,'A_WRITER_LINK')
        for a in ('direct','prefix','extract','observed','plan'):conditions[a]+=rs[w+'_'+a]['usage']['total_tokens']
        for o in x:
            counts['extract_'+o['status']]+=1
            if o['status']=='STATED':check(o['quote'] and o['quote'] in p,'A_UNANCHORED_QUOTE')
        check([o['index'] for o in x]==[o['index'] for o in plan],'A_STATE_INDEX')
        changed=sum(o['status']!=q['status'] for o,q in zip(x,plan));counts['status_changed_slots']+=changed;counts['works_status_changed']+=bool(changed)
        for a,v in c.items():
            t=v['continuation'];full=v['fullText'];check(ts(t)==v['continuationTextSha256'] and ts(full)==v['fullTextSha256'],'A_CONTINUATION_HASH')
            check(rs[w+'_'+a]['final']['text']==t and full==p+'\n'+t,'A_CONTINUATION_LINK')
            rep=t.startswith(p);check(rep==v['startsByRepeatingPrefix'],'A_REPEAT_FLAG');counts[a+'_exact_prefix_repeat']+=rep
            counts[a+'_full_chars']+=len(full)
        d=rs[w+'_direct']['usage']['total_tokens'];prefix=rs[w+'_prefix']['usage']['total_tokens'];e=rs[w+'_extract']['usage']['total_tokens'];obs=rs[w+'_observed']['usage']['total_tokens'];pl=rs[w+'_plan']['usage']['total_tokens'];check(r['costs']=={'direct':d,'planOnly':prefix+pl,'observedState':prefix+e+obs},'A_ALLOCATED_COST')
        cost.update(r['costs']);pairs.append({'work':w,'status_changed_slots':changed,'direct_tokens':d,'planned_tokens':prefix+pl,'observed_tokens':prefix+e+obs,'exact_repeat_both':all(v['continuation'].startswith(p) for v in c.values())})
    check(len(rs)==5*len(j['rows']),'A_CALL_COVERAGE')
    check(sum(conditions.values())==j['providerTokens']['fullResearchAllCalls'],'A_TOTAL_COST')
    return {'works':len(pairs),'counts':dict(counts),'allocated_cost':dict(cost),'actual_cost_by_condition':dict(conditions),'works_detail':pairs}

def audit_f(j,rs,data):
    raw=data['SmileStyle_original_CC-BY-NC-4.0.tsv'];check(sha(raw)==j['pinnedUpstreamSHA256'],'F_SOURCE_HASH')
    plan=json.loads(data['r5f-live/source-and-plan.json'])
    blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest();check(blob==plan['upstream']['blobSHA1'],'F_GIT_BLOB')
    lines=raw.decode().splitlines();header=lines[0].split('\t');rows=[dict(zip(header,l.split('\t'))) for l in lines[1:]];families=[];family=0
    for r in rows:
        if not any(v.strip() for v in r.values()):families.append(None);family+=1
        else:families.append(family)
    calls={c['id']:c for c in plan['calls']};check(len(calls)==len(plan['calls'])==len(rs),'F_PLAN_COVERAGE')
    tests={r['sourceFamily'] for r in j['rows']};demos=set();stats=Counter();direction=Counter();wins=Counter()
    for r in j['rows']:
        w=r['id'];matches={}
        for arm,o in r['outputs'].items():
            c=calls[w+'_'+arm];p=rs[w+'_'+arm];i=c['sourceIndex'];f=r['sourceFamily']
            check(all(families[t]==f for t in range(i,i+5)),'F_FAMILY_OR_BOUNDARY')
            for field,col in [('originalTurns',r['from']),('humanReferenceStyleTurns',r['to'])]:check([rows[t][col] for t in range(i,i+5)]==r[field],'F_TSV_LINK')
            check(ts(js(r['originalTurns']))==r['sourceSHA256'] and ts(js(r['humanReferenceStyleTurns']))==r['humanReferenceSHA256'],'F_TURN_HASH')
            for di in c['exampleIndices']:
                check(type(di) is int and 0<=di<len(rows) and families[di] is not None,'F_DEMO_INDEX');check(families[di] not in tests,'F_TEST_FAMILY_LEAK');demos.add(families[di])
            check(o['rawModelOutput']==p['text'] and o['textSHA256']==p['textSHA256'] and json.loads(p['text'])['turns']==o['turns'],'F_MODEL_LINK')
            check(len(o['turns'])==5,'F_TURN_COUNT');n=sum(a==b for a,b in zip(o['turns'],r['humanReferenceStyleTurns']));check(n==o['exactHumanStringMatches'],'F_MATCH_COUNT');check(o['newTotalTokens']==p['usage']['total_tokens'],'F_COST')
            matches[arm]=n;stats[arm+'_tokens']+=o['newTotalTokens'];stats[arm+'_exact_turn_matches']+=n;direction[r['from']+'_'+arm+'_matches']+=n
        wins['retrieved_gt' if matches['RETRIEVED']>matches['DIRECT'] else 'direct_gt' if matches['DIRECT']>matches['RETRIEVED'] else 'tie']+=1
    return {'blocks':family+1,'separators':families.count(None),'test_families':len(tests),'demo_families':len(demos),'declared_demo_families':plan['corpusStats']['distinctDemoFamilies'],'family_overlap':len(tests&demos),'counts':dict(stats),'by_direction':dict(direction),'work_match_comparison':dict(wins),'rights':'Archived CC BY-NC 4.0 attribution; descriptive noncommercial analysis only','native_quality_gold':False}

def audit_edits(c,cr,d,dr):
    by={r['sourceWork']:r for r in c['rows']};counts=Counter();cost=Counter();details=[]
    for w,r in by.items():
        o=r['original']['text'];q=r['target']['quote'];e=r['exactSpanEdit'];rw=r['entireRewrite'];p=cr[w+'_PATCH'];s=cr[w+'_REWRITE'];reply=json.loads(p['text'])
        check(ts(o)==r['original']['sha256'] and ts(e['text'])==e['sha256'] and ts(rw['text'])==rw['sha256'],'C_TEXT_HASH');check(reply['quote']==q and o.count(q)==1 and reply['decision']=='REPLACE','C_ANCHOR');check(o.replace(q,reply['replacement'],1)==e['text'],'C_EDIT_REPLAY');check(e['modelRawReply']==p['text'] and rw['text']==s['text'],'C_RESPONSE_LINK');check(e['newCallTokens']==p['usage']['total_tokens'] and rw['newCallTokens']==s['usage']['total_tokens'],'C_COST')
        check((q in e['text'])==e['targetPhraseStillPresent'] and (q in rw['text'])==rw['targetPhraseStillPresent'],'C_TARGET_FLAG');counts['strict_removed']+=q not in e['text'];counts['rewrite_removed']+=q not in rw['text'];cost['patch']+=e['newCallTokens'];cost['rewrite']+=rw['newCallTokens'];details.append({'work':w,'kind':r['target']['kind'],'patch_changed_chars':sum(max(i2-i1,j2-j1) for op,i1,i2,j1,j2 in difflib.SequenceMatcher(None,o,e['text'],autojunk=False).get_opcodes() if op!='equal'),'rewrite_changed_chars':sum(max(i2-i1,j2-j1) for op,i1,i2,j1,j2 in difflib.SequenceMatcher(None,o,rw['text'],autojunk=False).get_opcodes() if op!='equal')})
    for r in d['rows']:
        w=r['id'];parent=by[w];seam=r['seamEdit'];o=r['previousB120']['text'];region=r['continuitySpan'];p=dr[w+'_SEAM'];check(o==parent['original']['text'] and r['previousSingleSpan']['text']==parent['exactSpanEdit']['text'] and r['previousFullRewrite']['text']==parent['entireRewrite']['text'],'D_PARENT_TEXT');check(ts(seam['text'])==seam['sha256'] and ts(region)==p['regionSha256'],'D_HASH');check(o.count(region)==1,'D_REGION');check(seam['newCallTokens']==p['usage']['total_tokens'],'D_COST');counts['seam_'+seam['status']]+=1;counts['seam_unchanged']+=seam['text']==o;cost['seam']+=seam['newCallTokens']
        reply=json.loads(p['text']);check(reply['quote']==region,'D_REPLY_REGION');counts['seam_original_target_remains']+=r['originalDefectQuote'] in seam['text']
        if reply['decision']=='NO_OP':check(seam['status']=='NO_OP' and seam['text']==o,'D_NO_OP_CHANGED');counts['seam_explicit_no_op']+=1
        elif reply['decision']=='REPLACE':
            expected=o.replace(region,reply['replacement'],1);check(seam['text']==expected,'D_EDIT_REPLAY');check(seam['status']==('NO_OP' if expected==o else 'APPLIED'),'D_EDIT_STATUS');counts['seam_identical_replacement']+=expected==o
        else:raise ValueError('D_BAD_DECISION')
    return {'counts':dict(counts),'cost':dict(cost),'works_detail':details,'seam_reused_works':len(d['rows']),'independent_semantic_gold':False}

def run(root):
    a,f,c,d=[read(next(Path(root).glob(f'*R5{tag}_'+('16*zip' if tag=='F' else '*zip'))),tag) for tag in 'AFCD'];return {'status':'EXPOSED_DEVELOPMENT_ONLY','archives':{tag:v[3] for tag,v in zip('AFCD',(a,f,c,d))},'prefix':audit_a(*a[:2]),'retrieval':audit_f(*f[:3]),'edits':audit_edits(*c[:2],*d[:2]),'new_provider_calls':0,'human_ratings':0,'quality_promotion':False}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),ensure_ascii=False,indent=2))
