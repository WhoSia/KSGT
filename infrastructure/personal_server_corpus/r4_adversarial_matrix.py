"""Authored construction controls, not independently labeled Korean reference data."""
import collections,hashlib,itertools,json,pathlib
import p62_r4_guarded as guarded
from p62_r4_group_algebra import authored_universe_court

def run():
    counts=collections.Counter();frames=0;violations=[]
    particles=['이','도','이나','밖에','조차','마저']
    for n,d,p,kind,intra in itertools.product(range(2,13),range(1,13),particles,range(8),(False,True)):
        prefixes=[f'학생 {n} 명이 도착했다.',f'평균 {n}.5 명이 참여했다.',f'{n}~{n+1} 명이 참여했다.',
                  '학생 스물세 명이 모였다.',f'학생 {n} 명은 없었다.',f'학생 {n} 명이 늦지 않았다.',
                  f'“학생 {n} 명이 도착했다.”',f'만약 학생 {n} 명이 도착했다면.']
        prefix=prefixes[kind];target_text=f'그중 {d} 명{p} 말했다.'
        forms=[prefix+' '+target_text] if intra else [prefix,target_text]
        unit=0 if intra else 1;start=len(prefix)+1 if intra else 0
        target={'unit':unit,'start':start,'end':start+2,'observed':True}
        h=lambda text:hashlib.sha256(text.encode()).hexdigest()
        identity={'strict_structure':h(json.dumps(forms,ensure_ascii=False)),'member_key':h('AUTHORED_SYNTHETIC_MATRIX'),'archive_sha256':h('NO_CORPUS_ARCHIVE'),'document_ordinal':frames}
        result=guarded.infer(forms,target,identity);counts[result['status']]+=1
        selected=result.get('selected')
        if selected is not None:
            if result['target_local_constraint'] is not None and selected['cardinality']<d:violations.append('CONSTRAINT_COMPATIBILITY')
            if selected['witness']['global_end']>sum(map(len,forms[:unit]))+start:violations.append('FORWARD_SOURCE')
        if kind in (1,2,3) and result.get('nodes'):violations.append('CLIPPED_OR_COMPOUND_NUMERAL_NODE')
        altered=list(forms);altered[unit]+=' 후행 다섯 명.';altered.append('미래 세 명.')
        control=guarded.infer(altered,target,identity)
        if result['scoped_prefix_state_sha256']!=control['scoped_prefix_state_sha256']:violations.append('PREFIX_SUFFIX_INTERFERENCE')
        if result.get('human_ground_truth') is not None or result.get('semantic_accuracy') is not None:violations.append('HUMAN_AUTHORITY')
        frames+=1
    return {'status':'VERIFIED' if not violations else 'HOLD','authored_frames':frames,'status_counts':dict(counts),'violations':dict(collections.Counter(violations)),'conditional_finite_universe_court':authored_universe_court(5),'claim_ceiling':'Authored formal construction controls; no independent Korean semantic gold or measured antecedent accuracy.'}

if __name__=='__main__':
    result=run();out=pathlib.Path('C:/KSGT_SERVER/80_EXPORT/p62_referential_grounding_20261011/R4_R2_20261013')
    (out/'ADVERSARIAL_MATRIX_REPORT.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result),flush=True)
