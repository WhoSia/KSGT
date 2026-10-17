"""Reuse original P53 text and exact-flat alias closure before new inference."""
import pathlib,sys,json
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path[:0]=[str(PRIOR/'code'),str(PRIOR/'baseline_code')]
old=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013/PRIOR_GRAPH_COVERAGE.json'
(OUT/'PRIOR_GRAPH_COVERAGE.json').write_bytes(old.read_bytes())
source=(PRIOR/'code/r4_r3_final_custody.py').read_text()
source=source.replace('from r4_r3_inventory import ROOT,RUN,OUT,ro,write',"import pathlib\nfrom r4_r3_inventory import ro\nROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'\ndef write(n,x):(OUT/n).write_text(json.dumps(x,indent=2),encoding='utf-8')")
source=source.replace('p=RUN/name;h=sha(p)','p=PRIOR/name;h=sha(p)')
source=source.replace('all R4-R2 source shards','all R4-R2 source shards and all ten R4-R3 selected source shards (reserved-late used for exclusions only, no inference)')
p=RUN/'r4_r4_final_custody_executed.py'
if p.exists() and p.read_text()!=source:raise ValueError('Auditor changed on continuation')
p.write_text(source,encoding='utf-8');exec(compile(source,str(p),'exec'),{'__name__':'__main__'})
