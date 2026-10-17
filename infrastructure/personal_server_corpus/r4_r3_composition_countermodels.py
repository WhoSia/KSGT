"""New authored countermodels; conditional finite-set premises, not Korean gold."""
import json
from r4_r3_inventory import OUT,write
import p62_reference as ref
import p62_r4_guarded_v3 as v3
from p62_r4_group_algebra import bounded_join
def main():
    frames=['세 명과 두 명과 네 명이 모였다. 그중 여덟 명이 움직였다.','세 명과 두 명과 네 명이 모였다. 그중 열 명이 움직였다.']
    results=[]
    identity={'strict_structure':'1'*64,'member_key':'2'*64,'archive_sha256':'3'*64,'document_ordinal':0}
    for f in frames:
        m=ref.TARGET.search(f);t={'unit':0,'start':m.start(),'end':m.end(),'observed':True};r=v3.infer([f],t,identity)
        results.append({'fixture_origin':'AUTHOR_SYNTHETIC','source':f,'status':r['status'],'component_cardinalities':[n['cardinality'] for n in r['nodes']],'pair_bounds':[u['conditional_set_bounds'] for u in r['unions']],'union_diagnostics':r['union_diagnostics'],'target_constraint':r['target_local_constraint'],'human_ground_truth':None,'semantic_reference_accuracy':None})
    repeated=bounded_join({'lower':3,'upper':5},{'lower':4,'upper':6})
    write('AUTHORED_COMPOSITION_COUNTERMODELS.json',{'status':'EXECUTED','frames':results,'shared_component_join':{'declared_components':{'A':3,'B':2,'C':4},'operand_components':[['A','B'],['B','C']],'naive_interval_join':repeated,'elementary_unique_component_bound':{'lower':4,'upper':9},'claim_ceiling':'The naive upper 11 is valid but loose; unique witnessed-symbol closure gives 9 under declared finite-set premises, not semantic entity deduplication.'}})
    print(json.dumps({'frames':[{'status':r['status'],'components':r['component_cardinalities'],'pair_union_count':len(r['pair_bounds'])} for r in results],'naive_upper':repeated['upper'],'unique_symbol_upper':9}),flush=True)
if __name__=='__main__':main()
