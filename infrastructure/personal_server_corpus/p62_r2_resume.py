"""Single-worker bounded ingestion continuation after verified committed-shard custody."""
import argparse,datetime,json,os,pathlib,platform,shutil,subprocess,time

def main(a):
    root=pathlib.Path(a.root);out=pathlib.Path(a.out);run=root/"70_RUNS/corpus_sprint_20261011_main"
    if platform.node().upper()!="BOOK-DCFR8U3IME":raise RuntimeError("Unauthorized host")
    root.resolve().relative_to(pathlib.Path("C:/KSGT_SERVER").resolve())
    proof=json.loads((out/"INGESTION_RECOVERY_PREFLIGHT.json").read_text())
    if proof["status"]!="VERIFIED":raise RuntimeError("Recovery custody HOLD")
    # Exclusive guard prevents competing invocations of this continuation wrapper.
    fd=os.open(out/"INGESTION_CONTINUATION.lock",os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    os.write(fd,str(os.getpid()).encode());os.close(fd)
    for name in ("CHECKPOINT.json","RUN_RECEIPT.json","FROZEN_CONFIG.json"):
        shutil.copy2(run/name,out/("INGESTION_BEFORE_"+name))
    env=dict(os.environ,PYTHONDONTWRITEBYTECODE="1",PYTHONIOENCODING="utf-8",
        TMP=str(root/"90_SCRATCH"),TEMP=str(root/"90_SCRATCH"),SQLITE_TMPDIR=str(root/"90_SCRATCH"))
    cmd=[os.sys.executable,str(root/"70_RUNS/corpus_sprint_20261011_code/pipeline_v5.py"),
        "--root",str(root),"--out",str(run),"--fraction","1"]
    start=time.monotonic()
    def emit(status,**extra):
        x={"status":status,"utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
           "controller_pid":os.getpid(),"command":cmd,"disk_free_bytes":shutil.disk_usage(root).free,**extra}
        path=out/"INGESTION_CONTINUATION_STATUS.json";temp=path.with_suffix(".pending")
        temp.write_text(json.dumps(x,indent=2));os.replace(temp,path)
        with (out/"INGESTION_CONTINUATION_EVENTS.jsonl").open("a") as f:f.write(json.dumps(x)+"\n")
    with (out/"INGESTION_WORKER_LOG.txt").open("w",encoding="utf-8") as f:
        child=subprocess.Popen(cmd,cwd=root/"70_RUNS/corpus_sprint_20261011_code",env=env,stdout=f,stderr=subprocess.STDOUT)
        while child.poll() is None:
            emit("RUNNING",worker_pid=child.pid,checkpoint=json.loads((run/"CHECKPOINT.json").read_text()),wall_seconds=time.monotonic()-start)
            if shutil.disk_usage(root).free<60*1024**3 or time.monotonic()-start>a.seconds:
                child.terminate();child.wait(timeout=60);emit("HOLD",reason="Reserve or bounded duration reached",worker_pid=child.pid);return
            time.sleep(20)
        emit("EXECUTED" if child.returncode==0 else "HOLD",worker_exit=child.returncode,worker_pid=child.pid,
             checkpoint=json.loads((run/"CHECKPOINT.json").read_text()),wall_seconds=time.monotonic()-start,
             independent_full_census="PLANNED_AFTER_COMPLETION" if child.returncode==0 else "NOT_COMPLETED")
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True);p.add_argument("--seconds",type=int,default=43200)
    main(p.parse_args())
