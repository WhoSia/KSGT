"""Synthetic parser and negative-control regression tests; no licensed examples."""
import csv
import io
import json
import unittest
import pipeline as p

def wrapper(forms, doc_id="document-1"):
    return {"id":"file-1","metadata":{"category":"synthetic"},
            "document":[{"id":doc_id,"metadata":{"date":"20070000"},
                         "paragraph":[{"id":str(i),"form":t} for i,t in enumerate(forms)]}]}

class Chunked(io.StringIO):
    def read(self, n=-1):
        return super().read(min(n, 3) if n >= 0 else 3)

class Tests(unittest.TestCase):
    def test_json_real_identity(self):
        rows=list(p.json_docs(io.StringIO(json.dumps(wrapper(["synthetic"])))))
        self.assertEqual(rows[0][0],"file-1")
        self.assertEqual(rows[0][2]["id"],"document-1")
    def test_incremental_escaped_string(self):
        s=json.dumps(wrapper(['escaped " quote \\ slash and braces } [']),ensure_ascii=False)
        rows=list(p.json_docs(Chunked(s)))
        self.assertEqual(rows[0][2]["paragraph"][0]["form"],'escaped " quote \\ slash and braces } [')
    def test_truncated_json_rejected(self):
        with self.assertRaises((ValueError,json.JSONDecodeError)):
            list(p.json_docs(io.StringIO(json.dumps(wrapper(["x"]))[:-2])))
    def test_trailing_bytes_rejected(self):
        with self.assertRaises(ValueError):
            list(p.json_docs(io.StringIO(json.dumps(wrapper(["x"]))+" false")))
    def test_duplicate_root_key_rejected(self):
        with self.assertRaises(ValueError):
            list(p.json_docs(io.StringIO('{"id":"x","id":"y"}')))
    def test_file_id_not_document_id(self):
        with self.assertRaises(ValueError):
            p.validate({"metadata":{},"paragraph":[{"id":"p","form":"x"}]},"json")
    def test_csv_doc_grouping(self):
        s=io.StringIO()
        fields=sorted(p.EXPECTED)
        w=csv.DictWriter(s,fieldnames=fields)
        w.writeheader()
        for d,sid in [("d1","s1"),("d1","s2"),("d2","s3")]:
            row=dict.fromkeys(fields,"")
            row.update(file_id="f",doc_id=d,sentence_id=sid,sentence="synthetic",date="20010000")
            w.writerow(row)
        rows=list(p.csv_docs(io.StringIO(s.getvalue())))
        self.assertEqual([len(r[2]["sentence"]) for r in rows],[2,1])
    def test_csv_missing_header(self):
        with self.assertRaises(ValueError):
            list(p.csv_docs(io.StringIO("doc_id,sentence\na,b\n")))
    def test_csv_blank_identity(self):
        fields=sorted(p.EXPECTED)
        s=io.StringIO()
        w=csv.DictWriter(s,fieldnames=fields)
        w.writeheader()
        w.writerow(dict.fromkeys(fields,""))
        with self.assertRaises(ValueError):
            list(p.csv_docs(io.StringIO(s.getvalue())))
    def test_boundary_variants_retained(self):
        a=p.fingerprints(["ab","cd"])
        b=p.fingerprints(["abcd"])
        self.assertNotEqual(a[0],b[0])
        self.assertEqual(a[1],b[1])
    def test_whitespace_diagnostic(self):
        a=p.fingerprints(["a b"])
        b=p.fingerprints(["ab"])
        self.assertNotEqual(a[0],b[0])
        self.assertEqual(a[1],b[1])
    def test_changed_text_negative_control(self):
        self.assertNotEqual(p.fingerprints(["quantity 2"])[1],p.fingerprints(["quantity 3"])[1])
    def test_html_not_equivalent(self):
        self.assertNotEqual(p.fingerprints(["<p>ab</p>"])[1],p.fingerprints(["ab"])[1])
        self.assertEqual(p.visible("<p>ab</p>"),"ab")
    def test_unicode_span_custody(self):
        t="First. Second!"
        self.assertEqual("".join(t[a:b] for a,b in p.spans(t)),t)
    def test_source_form_unchanged(self):
        row=list(p.json_docs(io.StringIO(json.dumps(wrapper([" a\n b "])))))[0]
        self.assertEqual(row[2]["paragraph"][0]["form"]," a\n b ")
    def test_invalid_unit_rejected(self):
        with self.assertRaises(ValueError):
            p.validate({"id":"x","metadata":{},"paragraph":[{"id":"p","form":1}]},"json")


class SourcePolicyTests(unittest.TestCase):
    def test_conflicting_id_and_weak_metadata_are_not_merge_authority(self):
        import pathlib
        import sqlite3
        import tempfile
        import contextlib
        import source_dependence
        scratch=pathlib.Path(__file__).parent/"synthetic_scratch"
        scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            run=pathlib.Path(temp)
            db=sqlite3.connect(run/"corpus.sqlite")
            p.init_db(db)
            for key,archive,fmt in [("a","release-a","csv"),("b","release-b","json")]:
                db.execute("INSERT INTO members VALUES(?,?,?,?,?,?,?,?,?)",(key,archive,key,fmt,1,1,1,2,"hash"))
            metadata=json.dumps({"document":{"title":"synthetic","publisher":"synthetic","date":"20010000"}})
            feature=json.dumps({"geujung":1,"characters":100,"orthographic_sentences":1,"ending_yo":0})
            records=[("a",0,"id-1","file","structure-a","flat-a","2001","csv",feature,metadata),
                     ("b",0,"id-1","file","structure-b","flat-a","2001","json",feature,metadata),
                     ("b",1,"id-2","file","structure-b","flat-a","2001","json",feature,metadata),
                     ("a",1,"id-1","file","structure-c","flat-b","2001","csv",feature,metadata)]
            db.executemany("INSERT INTO occurrences VALUES(?,?,?,?,?,?,?,?,?,?)",records)
            db.commit()
            db.close()
            with contextlib.redirect_stdout(io.StringIO()):
                source_dependence.analyze(run)
            r=json.loads((run/"SOURCE_DEPENDENCE_EXPERIMENT.json").read_text())
            self.assertEqual(r["same_id_text_conflict_groups"],1)
            self.assertEqual(r["weak_title_publisher_date_groups_with_different_ids_and_text"],1)
            self.assertEqual(sum(x["documents"] for x in r["policies"]["ALL_REPRESENTATION_OCCURRENCES"]),4)
            self.assertEqual(sum(x["documents"] for x in r["policies"]["GLOBAL_JSON_STRICT_TEXT_DEDUP"]),1)
            self.assertEqual(sum(x["documents"] for x in r["policies"]["WITHIN_RELEASE_SOURCE_ID_NONCONFLICT"]),1)
            pair=r["cross_release_same_id_pairs"][0]
            self.assertEqual(pair["same_id_occurrence_pairs"],2)
            self.assertEqual(pair["flat_text_equal_pairs"],1)


class ContextTests(unittest.TestCase):
    def test_future_cue_and_document_boundary_do_not_leak(self):
        import pathlib
        import sqlite3
        import tempfile
        import contextlib
        import gzip
        import context_surfaces
        scratch=pathlib.Path(__file__).parent/"synthetic_scratch"
        scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            root=pathlib.Path(temp)
            run=root/"run"
            run.mkdir()
            db=sqlite3.connect(run/"corpus.sqlite")
            p.init_db(db)
            m=json.dumps({"file":{"category":"synthetic"},"document":{}})
            for n in [1,2,3]:
                db.execute("INSERT INTO occurrences VALUES(?,?,?,?,?,?,?,?,?,?)",("member",n,"id"+str(n),"file","variant"+str(n),"flat"+str(n),"2001","json","{}",m))
                db.execute("INSERT INTO canonical VALUES(?,?,?,?)",("variant"+str(n),"member",n,2))
            db.commit()
            db.close()
            folder=root/"40_CORPUS/paragraphs"/run.name
            folder.mkdir(parents=True)
            data=[("variant1","그중"),("variant1","3명"),
                  ("variant2","3명"),("variant2","그중"),
                  ("variant3","그중")]
            with gzip.open(folder/"synthetic.jsonl.gz","wt",encoding="utf-8") as f:
                for i,(v,t) in enumerate(data):
                    f.write(json.dumps({"document_variant":v,"paragraph_key":str(i),"form":t},ensure_ascii=False)+"\n")
            with contextlib.redirect_stdout(io.StringIO()):
                context_surfaces.measure(run,root)
            r=json.loads((run/"CONTEXT_SURFACE_EXPERIMENT.json").read_text())
            self.assertEqual(r["counts"]["targets"],3)
            self.assertEqual(r["counts"]["targets_with_prior2_cue"],1)
            self.assertEqual(r["counts"]["targets_with_prior5_cue"],1)

class ReceiptTests(unittest.TestCase):
    def test_final_checkpoint_matches_receipt_hash(self):
        import tempfile
        import sqlite3
        from pathlib import Path
        with tempfile.TemporaryDirectory(dir=".") as directory:
            out=Path(directory)
            db=sqlite3.connect(out/"corpus.sqlite")
            try:
                p.init_db(db)
                p.atomic(out/"CHECKPOINT.json", {"status":"RUNNING"})
                p.summarize(db,out,[],p.now(),0,0,.01)
                receipt=json.loads((out/"RUN_RECEIPT.json").read_text())
                self.assertEqual(receipt["output_hashes"]["CHECKPOINT.json"]["sha256"],p.file_sha(out/"CHECKPOINT.json"))
                self.assertEqual(json.loads((out/"CHECKPOINT.json").read_text())["status"],"EXECUTED")
            finally:
                db.close()

if __name__=="__main__":
    unittest.main(verbosity=2)


