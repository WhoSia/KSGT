"""Execute the exact-text prior-exposure auditor for the new target graph."""
import pathlib,sys
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r5_20261014';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
sys.path[:0]=[str(PRIOR/'code'),str(PRIOR/'baseline_code'),str(PRIOR/'vendor')]
source=(PRIOR/'code/r4_r3_passage_audit.py').read_text()
source=source.replace('from r4_r3_inventory import ROOT,RUN,OUT,ro,write',"from r4_r3_inventory import ro\nROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r5_20261014';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'\ndef write(n,x):(OUT/n).write_text(json.dumps(x,indent=2),encoding='utf-8')")
source=source.replace("str(RUN/'vendor')","str(PRIOR/'vendor')").replace("str(RUN/'baseline_code')","str(PRIOR/'baseline_code')")
source=source.replace('sources=sorted(dict(sources).items());nd=nu=0',"r3plan=json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013/CUSTODY_SELECTION_PREDECLARATION.private.json').read_text())\n    r4plan=json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013/PREDECLARATION.private.json').read_text())\n    sources.extend((x['path'],x['sha256']) for x in r3plan['selected_members'])\n    sources.extend((x['path'],x['sha256']) for x in r4plan['plan'])\n    sources=sorted(dict(sources).items());nd=nu=0")
source=source.replace('za=RUN/','za=PRIOR/').replace("(RUN/'PRIOR_EXTERNAL_SOURCE_FILES.private.json')","(PRIOR/'PRIOR_EXTERNAL_SOURCE_FILES.private.json')").replace('p=RUN/descriptor','p=PRIOR/descriptor')
generated=RUN/'r4_r5_passage_executed.py'
if generated.exists() and generated.read_text()!=source:raise ValueError('Passage auditor changed during continuation')
generated.write_text(source,encoding='utf-8')
exec(compile(source,str(generated),'exec'),{'__name__':'__main__'})

