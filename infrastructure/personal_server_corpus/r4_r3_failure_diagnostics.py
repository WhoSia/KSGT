"""Post-frozen mechanistic diagnostics; no label of true referential correctness."""
import collections,json
from r4_r3_inventory import RUN,OUT,ro,write
import p62_r4_guarded_v3 as v3
def main():
    results=ro(RUN/'R4_TRANSFER.private.sqlite');source=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');categories=collections.Counter();cases=[];segmentation=[];admission=collections.Counter()
    config=json.loads((RUN.parent/'corpus_sprint_20261011_main/FROZEN_CONFIG.json').read_text());main=ro(RUN.parent/'corpus_sprint_20261011_main/corpus.sqlite')
    for s,member,payload in results.execute('select strict,member,payload from results'):
        ordinal,raw=source.execute('select ordinal,forms from docs where strict=?',(s,)).fetchone();forms=json.loads(raw)
        release=main.execute('select archive from members where key=?',(member,)).fetchone()[0];identity={'strict_structure':s,'member_key':member,'archive_sha256':config['archive_sha256'][release],'document_ordinal':ordinal}
        for row in json.loads(payload):
            r=row['r4'];g=row['v3'];t=row['target'];before=r['proposed'];after=g['admitted']
            if before and not after:
                label=g['result']['status'];categories['LOSS:'+label]+=1;cases.append({'strict_private':s,'target':t,'kind':'LOSS','r4':r['result'],'v3':g['result']})
            if after and not before:categories['GAIN:'+r['result']['status']]+=1;cases.append({'strict_private':s,'target':t,'kind':'GAIN','r4':r['result'],'v3':g['result']})
            if before and not r['admitted']:
                admission[r['source_admission']['status']]+=1
                if after:admission['V3_RETAINED_PROPOSAL_AFTER_ORIGINAL_GRAPH_GATE_HOLD']+=1
            if row['joined_source_status_changed']:
                offset=sum(map(len,forms[:t['unit']]));jt=dict(t,unit=0,start=offset+t['start'],end=offset+t['end']);joined=v3.infer([''.join(forms)],jt,identity)
                x={'strict_private':s,'target':t,'original_status':g['result']['status'],'joined_status':joined['status'],'original_target_constraint':g['result'].get('target_local_constraint'),'joined_target_constraint':joined.get('target_local_constraint'),'original_group_count':len(g['result']['nodes']),'joined_group_count':len(joined['nodes']),'original_unit_remaining_chars':len(forms[t['unit']])-t['end'],'counterfactual_source_admission':'NOT_AN_ORIGINAL_SOURCE_VIEW'};segmentation.append(x)
    write('POST_FROZEN_FAILURE_TAXONOMY.private.json',{'status':'EXECUTED','authority':'MACHINE_PROVISIONAL_POST_FROZEN_CODE_DIAGNOSTICS','loss_gain_surface_categories':dict(categories),'original_R4_graph_admission_holds':dict(admission),'segmentation_cases':segmentation,'gain_loss_cases':cases,'human_ground_truth':None,'semantic_accuracy':None})
    print(json.dumps({'categories':dict(categories),'admission':dict(admission),'segmentation_cases':segmentation},indent=2),flush=True)
if __name__=='__main__':main()
