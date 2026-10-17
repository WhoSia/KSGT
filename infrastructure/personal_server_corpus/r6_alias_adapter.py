"""Reparse indexed aliases from their original raw ZIP members."""
import pathlib,sys
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_event_role_20261017';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R6_EVENT_ROLE_20261017'
sys.path[:0]=[str(PRIOR/'code'),str(PRIOR/'baseline_code')]
source=(PRIOR/'code/r4_r3_raw_witness.py').read_text()
source=source.replace('from r4_r3_inventory import ROOT,RUN,OUT,ro,write',"import pathlib\nfrom r4_r3_inventory import ro\nROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_event_role_20261017';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R6_EVENT_ROLE_20261017'\ndef write(n,x):(OUT/n).write_text(json.dumps(x,indent=2),encoding='utf-8')")
source=source.replace("str(RUN/'baseline_code')","str(PRIOR/'baseline_code')")
p=RUN/'r6_raw_witness_executed.py'
if p.exists() and p.read_text()!=source:raise ValueError('Raw witness auditor changed')
p.write_text(source,encoding='utf-8')
exec(compile(source,str(p),'exec'),{'__name__':'__main__'})

