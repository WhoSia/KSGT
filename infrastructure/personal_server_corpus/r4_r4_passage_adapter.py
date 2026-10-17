"""Versioned replay of the prior exhaustive source auditor for new targets."""
import pathlib,sys
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path[:0]=[str(PRIOR/'code'),str(PRIOR/'baseline_code'),str(PRIOR/'vendor')]
source=(PRIOR/'code/r4_r3_passage_audit.py').read_text()
source=source.replace("from r4_r3_inventory import ROOT,RUN,OUT,ro,write", "from r4_r3_inventory import ro\nROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'\ndef write(n,x):(OUT/n).write_text(json.dumps(x,indent=2),encoding='utf-8')")
source=source.replace("str(RUN/'vendor')", "str(PRIOR/'vendor')").replace("str(RUN/'baseline_code')", "str(PRIOR/'baseline_code')")
source=source.replace("sources=sorted(dict(sources).items());nd=nu=0", "prior_plan=json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013/CUSTODY_SELECTION_PREDECLARATION.private.json').read_text())\n    sources.extend((r['path'],r['sha256']) for r in prior_plan['selected_members'])\n    sources=sorted(dict(sources).items());nd=nu=0")
source=source.replace("za=RUN/", "za=PRIOR/").replace("(RUN/'PRIOR_EXTERNAL_SOURCE_FILES.private.json')", "(PRIOR/'PRIOR_EXTERNAL_SOURCE_FILES.private.json')").replace("p=RUN/descriptor", "p=PRIOR/descriptor")
# A fresh generated script makes the exact executed auditor inspectable and hashable.
generated=RUN/'r4_r4_passage_executed.py'
if generated.exists() and generated.read_text()!=source:raise ValueError('Auditor changed on continuation')
generated.write_text(source,encoding='utf-8')
exec(compile(source,str(generated),'exec'),{'__name__':'__main__'})
