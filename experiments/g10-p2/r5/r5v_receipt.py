import hashlib,json,re
from pathlib import Path
from r5v_lock_audit import canonical_lock,fidelity_bounds
P=Path(__file__).parent
text=(P/'r5v_lira_lines.md').read_text()
lines=text.splitlines()
source_ids={'R1','R2','R3','R4'}
rows=[]
for i,line in enumerate(lines,1):
    m=re.fullmatch(r'L(\d{3}) \| E=(0\.\d\d|1\.00) \| P=(0\.\d\d|1\.00) \| (FACT|INFER|PLAN|HOLD) \| \[([^]]+)\] \| (.+)',line)
    if not m or int(m[1])!=i:raise ValueError(f'UNSCORED:{i}')
    if set(m[5].split(','))-source_ids:raise ValueError('UNREGISTERED_SOURCE')
    rows.append({'line':i,'e':float(m[2]),'p':float(m[3]),'sha256':hashlib.sha256(line.encode()).hexdigest()})
M={w:{f'X{i}':a for i,a in enumerate(('STRONG_DIRECT','RICH_PROMPT','STATE_AS_TEXT','EXECUTABLE_STATE','EQUAL_COST_ITERATIVE','NO_OP_KEEP','SHAM_STATE'),1)} for w in ('a','b','c','d')}
X=[]
for w in M:
    for i in range(1,8):
        X.append({'work_token':w,'blind_label':f'X{i}','role':'READER','assessor_token':'r'+w,'usefulness':4,'naturalness':3})
        X.append({'work_token':w,'blind_label':f'X{i}','role':'SOURCE_AUDITOR','assessor_token':'s'+w,'fidelity_error':'NO'})
policy={'synthetic_only':True,'study_status':'UNFROZEN','verified_human_outcomes':0}
locked=canonical_lock(X,policy)
y=json.loads(json.dumps(X))
for r in y:
    if r['work_token']=='a' and r['blind_label']=='X4' and r['role']=='SOURCE_AUDITOR':r['fidelity_error']='UNCERTAIN'
receipt={'schema':'ksgt.g10p2.r5v.receipt.v1','scores':rows,'synthetic_lock':locked,'missingness_example':fidelity_bounds(y,M),'new_tests_pass':19,'previous_tests_pass':28,'independent_human_outcomes':0,'quality_promotion':False}
(P/'r5v_execution_receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
