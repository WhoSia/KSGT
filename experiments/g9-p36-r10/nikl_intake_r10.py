import sys,os,json,hashlib,zipfile,tarfile
p=sys.argv[1] if len(sys.argv)>1 else ""
out=sys.argv[2] if len(sys.argv)>2 else "experiments/g9-p36-r10/final/nikl_intake_status.json"
r={"phase":"G9-P36-R10","source":"NIKL Zero Anaphora Corpus 2020/2025","state":"WAITING_FOR_OFFICIAL_BYTES","bytes_present":False,"scoring_authorized":False}
if p and os.path.isfile(p):
    b=open(p,"rb").read()
    r.update({"state":"BYTES_PRESENT_INTAKE_ONLY","bytes_present":True,"sha256":hashlib.sha256(b).hexdigest(),"size":len(b),"filename":os.path.basename(p),"scoring_authorized":False})
    inv=[]
    try:
        if zipfile.is_zipfile(p):
            with zipfile.ZipFile(p) as z: inv=[{"name":x.filename,"size":x.file_size} for x in z.infolist()[:5000]]
        elif tarfile.is_tarfile(p):
            with tarfile.open(p) as t: inv=[{"name":x.name,"size":x.size} for x in t.getmembers()[:5000] if x.isfile()]
    except Exception as e:
        r["inventory_error"]=type(e).__name__
    r["archive_inventory_preview"]=inv
    r["next"]="SCHEMA_CENSUS_AND_ANNOTATION_VERSION_DETECTION_BEFORE_ANY_ROW_SCORING"
os.makedirs(os.path.dirname(out),exist_ok=True)
open(out,"w",encoding="utf-8").write(json.dumps(r,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(r,ensure_ascii=False,indent=2))
