"""Exact within-document distant-window control for paragraph surface co-occurrence."""
import argparse, collections, gzip, hashlib, json, unittest
from pathlib import Path
from context_surfaces_bounded import TARGET, CUE
def starts(n,i,w):
    return [s for s in range(n-w+1) if s+w<=max(0,i-w) or s>=i+1]
def measure_flags(cues,hits):
    result={}
    n=len(cues)
    prefix=[0]
    for cue in cues: prefix.append(prefix[-1]+int(cue))
    for w in (2,5):
        c=collections.Counter()
        for i,k in enumerate(hits):
            if not k or i<w: continue
            eligible=starts(n,i,w)
            if not eligible: continue
            true=prefix[i]-prefix[i-w]>0
            distant=sum(prefix[s+w]-prefix[s]>0 for s in eligible)
            c["eligible_targets"]+=k
            c["true_prior_window_hits"]+=int(true)*k
            c["distant_window_expected_hits"]+=k*distant/len(eligible)
            c["distinct_control_windows_evaluated"]+=len(eligible)
        result[str(w)]=dict(c)
    return result
def analyze(run,root):
    total={"2":collections.Counter(),"5":collections.Counter()}
    docs=0;paragraphs=0;targets=0; current=None;forms=[]
    def flush():
        nonlocal docs,paragraphs,targets
        if not forms:return
        cues=[bool(CUE.search(t)) for t in forms]
        hits=[len(list(TARGET.finditer(t))) for t in forms]
        for w,c in measure_flags(cues,hits).items():total[w].update(c)
        docs+=1;paragraphs+=len(forms);targets+=sum(hits)
    for path in sorted((root/"40_CORPUS/paragraphs"/run.name).glob("*.gz")):
        with gzip.open(path,"rt",encoding="utf-8") as f:
            for line in f:
                row=json.loads(line)
                if row["document_variant"]!=current:
                    flush();forms=[];current=row["document_variant"]
                forms.append(row["form"])
    flush()
    result={"status":"EXECUTED","experiment":"EXACT_DISTANT_WITHIN_DOCUMENT_WINDOW_CONTROL",
        "documents":docs,"paragraphs":paragraphs,"all_declared_surface_targets":targets,"windows":{},
        "control_rule":"Same-document full windows of equal length, excluding target paragraph and its preceding true window; later windows allowed. Every admissible distant window evaluated.",
        "target_weighting":"Equal weight per literal surface occurrence; distant expected hits average admissible windows for each target.",
        "source_scope":"Completed nonrandom strict JSON structure cohort; raw source forms retained",
        "scientific_ceiling":"Local numeric-cue clustering around declared surface targets; no antecedent or recoverability gold, human preference, causal effect, or population estimate",
        "limitations":["Future windows are descriptive controls, not antecedent candidates","Targets without full preceding and admissible distant windows excluded from paired comparison","Within-document topic and section differences can remain","Multiple targets within a paragraph share context; no independent-observation significance claim","Markup and source-unit segmentation may affect regex detection"],
        "code_sha256":hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
    for w,c in total.items():
        d=dict(c);n=d.get("eligible_targets",0)
        d["true_prior_window_rate"]=d.get("true_prior_window_hits",0)/n if n else None
        d["distant_window_expected_rate"]=d.get("distant_window_expected_hits",0)/n if n else None
        d["difference_percentage_points"]=100*(d["true_prior_window_rate"]-d["distant_window_expected_rate"]) if n else None
        result["windows"][w]=d
    (run/"DISTANT_WINDOW_CONTROL_EXPERIMENT.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    text="# Within-document distant-window control\n\nStatus: EXECUTED.\n\n"
    text+="Every admissible distant full window is evaluated within the same preserved document. It excludes the target and preceding true context. This is an exact descriptive control for numeric surface clustering, not a referent-resolution or human-preference experiment.\n\n"
    text+="| Window | Eligible targets | Prior cue rate | Distant expected cue rate | Difference, percentage points |\n|---|---:|---:|---:|---:|\n"
    for w,c in result["windows"].items():
        if c["eligible_targets"]:text+=f"| {w} | {c['eligible_targets']} | {c['true_prior_window_rate']:.6f} | {c['distant_window_expected_rate']:.6f} | {c['difference_percentage_points']:.3f} |\n"
    text+="\nThe targets in this paired comparison differ from the all-target denominator. Later windows are not antecedents. Missing numeric cues do not imply unrecoverable references. The cohort is nonrandom; no independent-observation significance or population effect is claimed.\n"
    (run/"DISTANT_WINDOW_CONTROL_EXPERIMENT.md").write_text(text,encoding="utf-8")
    print(json.dumps(result))
class Tests(unittest.TestCase):
    def test_controls_exclude_true_context_and_target(self):
        self.assertEqual(starts(10,4,2),[0,5,6,7,8])
        for s in starts(12,6,5):
            self.assertTrue(set(range(s,s+5)).isdisjoint(range(1,7)))
    def test_insufficient_context_excluded(self):
        self.assertEqual(measure_flags([True,False],[1,0])["2"],{})
    def test_exact_weighted_control(self):
        r=measure_flags([True,False,False,False,True,False],[0,0,1,0,0,0])["2"]
        self.assertEqual(r["eligible_targets"],1)
        self.assertEqual(r["true_prior_window_hits"],1)
        self.assertEqual(r["distant_window_expected_hits"],1)
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--test",action="store_true")
    p.add_argument("--run",type=Path);p.add_argument("--root",type=Path)
    a=p.parse_args()
    if a.test: unittest.main(argv=["surface-control-tests"],verbosity=2)
    else: analyze(a.run,a.root)
