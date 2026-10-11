"""Audit Git commit authors and committers; never rewrite or mutate history."""
import argparse,json,pathlib,re
BOT=re.compile(r"github-actions\[bot\]",re.I)
def audit(commits,complete=False):
    failures=[];unknown=[]
    for x in commits:
        data=x.get("commit",x);a=data.get("author");c=data.get("committer")
        if not isinstance(a,dict) or not isinstance(c,dict):unknown.append(x.get("sha"));continue
        fields=[a.get("name"),a.get("email"),c.get("name"),c.get("email"),
                (x.get("author") or {}).get("login"),(x.get("committer") or {}).get("login")]
        if any(BOT.search(str(v)) for v in fields):
            failures.append({"sha":x.get("sha"),"author":a,"committer":c})
    return {"status":"HOLD" if failures or unknown or not complete else "VERIFIED",
            "commits":len(commits),"pagination_complete":complete,"bot_authored_or_committed":failures,
            "missing_identity_records":unknown,"history_rewritten":False,
            "rule":"Actions may compute CI only; never author, commit, push, tag or merge. Preserve legitimate human commits; report bot history without automatic rewrite."}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--commits",required=True);p.add_argument("--out",required=True);p.add_argument("--complete",action="store_true")
    a=p.parse_args();out=pathlib.Path(a.out)
    if out.exists():raise FileExistsError("Preserve prior governance audits")
    out.write_text(json.dumps(audit(json.loads(pathlib.Path(a.commits).read_text()),a.complete),indent=2),encoding="utf8")
