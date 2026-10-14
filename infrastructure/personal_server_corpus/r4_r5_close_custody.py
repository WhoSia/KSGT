"""Close original historical text custody without changing frozen source selection."""
import json
import pathlib
import sys

ROOT = pathlib.Path('C:/KSGT_SERVER')
PRIOR = ROOT / '70_RUNS/p62_r4_r3_20261013'
RUN = ROOT / '70_RUNS/p62_r4_r5_20261014'
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
sys.path[:0] = [str(PRIOR / 'code'), str(PRIOR / 'baseline_code')]
old = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013/PRIOR_GRAPH_COVERAGE.json'
copy = OUT / 'PRIOR_GRAPH_COVERAGE.json'
if copy.exists() and copy.read_bytes() != old.read_bytes():
    raise ValueError('Historical coverage changed')
copy.write_bytes(old.read_bytes())
source = (PRIOR / 'code/r4_r3_final_custody.py').read_text(encoding='utf-8')
source = source.replace(
    'from r4_r3_inventory import ROOT,RUN,OUT,ro,write',
    "import pathlib\nfrom r4_r3_inventory import ro\n"
    "ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';"
    "RUN=ROOT/'70_RUNS/p62_r4_r5_20261014';"
    "OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'\n"
    "def write(n,x):(OUT/n).write_text(json.dumps(x,indent=2),encoding='utf-8')")
source = source.replace('p=RUN/name;h=sha(p)', 'p=PRIOR/name;h=sha(p)')
source = source.replace(
    'all R4-R2 source shards',
    'all R4-R2 source shards, all ten R4-R3 selected source shards and all three R4-R4 selected source shards')
destination = RUN / 'r4_r5_final_custody_executed.py'
if destination.exists() and destination.read_text(encoding='utf-8') != source:
    raise ValueError('Generated auditor changed on continuation')
destination.write_text(source, encoding='utf-8')
exec(compile(source, str(destination), 'exec'), {'__name__': '__main__'})

