#!/usr/bin/env python3
import csv,io,json,tempfile,zipfile
from pathlib import Path
import importlib.util

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("kfc",HERE/"klicke_feature_compiler.py")
m=importlib.util.module_from_spec(spec);assert spec.loader;spec.loader.exec_module(m)

with tempfile.TemporaryDirectory() as td:
    td=Path(td)
    hol=td/"holistic.csv"; demo=td/"demo.csv"; tz=td/"typing.zip"; vz=td/"vocab.zip"; out=td/"out.jsonl"
    hol.write_text('ID,Prompt,Text,Score\n12345678,P,"hello world",4.5\n',encoding="utf-8")
    demo.write_text(',ID,Gender\n1,12345678,X\n',encoding="utf-8")
    with zipfile.ZipFile(tz,"w") as z:
        z.writestr("TypingTests/csv/12345678_TYPING1.csv",
          '","DownEventID","UpEventID","DownTime","UpTime","ActionTime","DownEvent","UpEvent","CursorPosition","PauseTime","WordCount","TextChange","Activity"\n'
          '"1",1,1,100,120,20,"a","a",1,0,1,"a","Input"\n'
          '"2",2,2,2200,2220,20,"Backspace","Backspace",0,2100,0,"a","Remove/Cut"\n')
    with zipfile.ZipFile(vz,"w") as z:
        z.writestr("VocabularyKnowledgeTest/12345678_Vocab.csv",
          ',Word,Response,Key\n1,alpha,1,1\n2,beta,1,0\n')

    h=m.read_holistic(hol); d=m.read_demographic_ids(demo); t=m.typing_features(tz); v=m.vocab_features(vz)
    rows=list(m.compile_rows(h,d,t,v))
    assert len(rows)==1
    r=rows[0]
    assert r["participant_id"]=="12345678"
    assert r["holistic_score"]==4.5
    assert r["final_text_length"]==11
    assert r["typing_task_count"]==1
    assert r["typing_event_count"]==2
    assert r["typing_revision_event_rate"]==0.5
    assert r["typing_long_pause_ge_2000ms_rate"]==0.5
    assert r["vocab_items"]==2 and r["vocab_accuracy"]==0.5
    assert r["has_demographic"] is True
    assert "Gender" not in r
    assert r["authority"]=="AUXILIARY_PROCESS_COVARIATE_ONLY"
print("PASS KLiCKe feature-only compiler")
