"""Synthetic P61 checks; no licensed corpus fixtures."""
import re, unittest
from unittest.mock import patch
import p61_directional as p
class P61Tests(unittest.TestCase):
    def test_fingerprint_preserves_numbers(self):
        self.assertEqual(p.fingerprint(["A  B"]),p.fingerprint(["A","B"]))
        self.assertNotEqual(p.fingerprint(["two"]),p.fingerprint(["three"]))
    def test_unicode_normalization(self):
        self.assertEqual(p.fingerprint(["\u00e9"]),p.fingerprint(["e\u0301"]))
    def test_family(self):
        self.assertEqual(p.family("NIKL_NEWSPAPER_2025_v1.1.zip"),"ANNUAL")
        self.assertEqual(p.family("NIKL_NEWSPAPER_v2.0_JSON.zip"),"AGGREGATE")
        self.assertEqual(p.family("NIKL_WRITTEN_v1.2_JSON.zip"),"WRITTEN")
    def test_document_equal_not_target_equal(self):
        r=p.summarize([(1,100,1),(2,1,-1)],1)
        self.assertEqual(r["difference_pp"],0)
        self.assertEqual(r["eligible_targets"],101)
    def test_alias_cluster_preserves_all_documents(self):
        r=p.summarize([(1,1,1),(1,1,-1)],1)
        self.assertEqual(r["lineage_components"],1)
        self.assertEqual(r["interval_95_pp"],[0,0])
    def test_symmetric_edges_excluded(self):
        m=p.document_measure(["그중 하나","문장","문장"])[0]
        self.assertEqual(m["excluded"],{"2":1,"5":1})
        self.assertEqual(m["metrics"],{})
    def test_positive_and_reversed_surface_controls(self):
        forms=["문장","두 명","그중 한 명","문장","문장"]
        a=p.document_measure(forms)[0]["metrics"]["2/NUMERIC_CUE"]["mean_difference"]
        b=p.document_measure(list(reversed(forms)))[0]["metrics"]["2/NUMERIC_CUE"]["mean_difference"]
        self.assertEqual(a,1)
        self.assertEqual(b,-1)
    def test_numeric_control_is_not_gold(self):
        forms=["문장","두 명","그중 한 명","문장","문장"]
        item=p.document_measure(forms)[1][0]
        self.assertIsNone(item["ground_truth"])
        self.assertEqual(item["candidate_authority"],"PROVISIONAL_RULE_GENERATED")
    def test_lexical_removes_numeric_and_target_surfaces(self):
        self.assertEqual(p.lexical("그중 두 명"),set())
    def test_unresolved_no_candidates(self):
        forms=["문장","문장","그중 하나","문장","문장"]
        item=p.document_measure(forms)[1][0]
        self.assertEqual(item["rule_category"],"NO_GROUP_CUE")
    def test_singletons_are_difficult_negative_candidates(self):
        forms=["문장","한 명","그중 하나","문장","문장"]
        item=p.document_measure(forms)[1][0]
        self.assertEqual(item["rule_category"],"SINGLETON_GROUP_NEGATIVE")
    def test_union_transitive(self):
        u=p.Union(4);u.join(1,2);u.join(2,3)
        self.assertEqual(u.find(1),u.find(3))
    def test_checkpoint_resume_equals_clean_synthetic_run(self):
        import tempfile,gzip,json,sqlite3
        from pathlib import Path
        from types import SimpleNamespace
        with tempfile.TemporaryDirectory(dir=".") as temp:
            root=Path(temp);source=root/"source.sqlite";feat=root/"features.sqlite"
            s=sqlite3.connect(source);s.executescript("CREATE TABLE shards(kind,path);CREATE TABLE canonical(strict,paragraphs);")
            f=sqlite3.connect(feat);f.executescript("CREATE TABLE variants(id,strict,units);CREATE TABLE components(variant,cluster);CREATE TABLE rows(rid,variant,year,release,format);CREATE TABLE exclusions(variant,reason);")
            for i,form in [(1,"A  B"),(2,"A B")]:
                path=root/(str(i)+".gz")
                with gzip.open(path,"wt",encoding="utf-8") as out:out.write(json.dumps({"document_variant":"v"+str(i),"form":form})+"\n")
                s.execute("INSERT INTO shards VALUES('paragraphs',?)",(str(path),));s.execute("INSERT INTO canonical VALUES(?,1)",("v"+str(i),))
                f.execute("INSERT INTO variants VALUES(?,?,1)",(i,"v"+str(i)));f.execute("INSERT INTO components VALUES(?,?)",(i,i))
                f.execute("INSERT INTO rows VALUES(?,?,'2000','NIKL_NEWSPAPER_2020_JSON.zip','json')",(i,i))
            f.execute("INSERT INTO exclusions VALUES(1,'DEVELOPMENT_KEY_OVERLAP')")
            s.commit();f.commit();s.close();f.close()
            broken=root/"resumed";broken.mkdir();real=p.digest
            def interrupt(path):
                if Path(path).name=="2.gz":raise RuntimeError("Synthetic interruption")
                return real(path)
            with patch.object(p,"digest",interrupt):
                with self.assertRaises(RuntimeError):p.extract(SimpleNamespace(source=source,features=feat,out=broken))
            import gc;gc.collect()
            db,info=p.extract(SimpleNamespace(source=source,features=feat,out=broken))
            self.assertEqual(info["structures"],2);self.assertEqual(info["lineage_components"],1)
            self.assertEqual(info["known_new_structures"],0)
            observed=db.execute("SELECT variant,lineage,known_new FROM documents ORDER BY variant").fetchall();db.close()
            clean=root/"clean";clean.mkdir();db,other=p.extract(SimpleNamespace(source=source,features=feat,out=clean))
            self.assertEqual(observed,db.execute("SELECT variant,lineage,known_new FROM documents ORDER BY variant").fetchall());db.close()
if __name__=="__main__":unittest.main()
