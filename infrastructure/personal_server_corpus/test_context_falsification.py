"""Synthetic scientific-invariant tests; no licensed source examples."""
import re, unittest
from unittest.mock import patch
import numpy as np
import context_falsification as f
import distant_window_control as original
class FalsificationTests(unittest.TestCase):
    def test_primary_definition_unchanged(self):
        forms=["C","x","T","x","C","x","x","TT","x","x","C","x","x","x"]
        with patch.object(f,"TARGET",re.compile("T")),patch.object(f,"CUE",re.compile("C")):
            hits=[len(re.findall("T",t)) for t in forms];cues=["C" in t for t in forms]
            _,metrics,_=f.measures(forms)
            old=original.measure_flags(cues,hits)
            for w in (2,5):
                self.assertEqual(metrics[(w,"PRIMARY")][0],old[str(w)]["eligible_targets"])
                self.assertAlmostEqual(metrics[(w,"PRIMARY")][1],old[str(w)]["true_prior_window_hits"])
                self.assertAlmostEqual(metrics[(w,"PRIMARY")][2],old[str(w)]["distant_window_expected_hits"])
    def test_zero_target_documents_retained(self):
        with patch.object(f,"TARGET",re.compile("T")),patch.object(f,"CUE",re.compile("C")):
            feat=f.document_features(["C","x"])
        group=f.Group();group.add({"cluster":"zero"},feat)
        result=group.finish("synthetic-zero")
        self.assertEqual(result["document_components"],1)
        self.assertEqual(result["zero_target_rows"],1)
        self.assertEqual(result["metrics"]["SOURCE/2/PRIMARY"]["eligible_targets"],0)
    def test_aliases_are_one_uncertainty_cluster(self):
        vec=[0.]*(len(f.METRICS)*3);vec[:3]=[1.,1.,0.]
        feat={"targets":1,"vector":vec,"exclusions":{}}
        g=f.Group();g.add({"cluster":"same"},feat);g.add({"cluster":"same"},feat)
        r=g.finish("alias")
        self.assertEqual(r["representation_rows"],2)
        self.assertEqual(r["document_components"],1)
        self.assertEqual(r["metrics"]["SOURCE/2/PRIMARY"]["cluster_bootstrap"]["percentile_95_pp"],[100.,100.])
    def test_transitive_identity_components(self):
        u=f.Union();u.join("a","b");u.join("b","c")
        self.assertEqual(u.find("a"),u.find("c"))
    def test_missing_metadata_is_not_identity(self):
        self.assertIsNone(f.weak({"title":"x","publisher":None,"date":"20000000"}))
    def test_window_direction_denominators_are_explicit(self):
        with patch.object(f,"TARGET",re.compile("T")),patch.object(f,"CUE",re.compile("C")):
            _,m,e=f.measures(["x","C","T","x","x","x"])
        self.assertEqual(m[(2,"PAST_ONLY")][0],0)
        self.assertEqual(e[(2,"PAST_ONLY")]["no_admissible_control_window"],1)
        self.assertEqual(m[(2,"FUTURE_ONLY")][0],1)
    def test_uncovered_CSV_conflict_blocks_document(self):
        import tempfile,sqlite3,json
        from pathlib import Path
        from types import SimpleNamespace
        with tempfile.TemporaryDirectory(dir=".") as directory:
            root=Path(directory);source=root/"source.sqlite"
            db=sqlite3.connect(source)
            db.executescript("CREATE TABLE occurrences(strict,doc_id,flat,year,format,metadata,member); CREATE TABLE members(key,archive);")
            meta=json.dumps({"file":{},"document":{"title":"Synthetic","publisher":"Fixture","date":"20000000"}})
            db.executemany("INSERT INTO members VALUES(?,?)",[("j","JSON"),("c","CSV")])
            db.executemany("INSERT INTO occurrences VALUES(?,?,?,?,?,?,?)",[("a","id","flat_a","2000","json",meta,"j"),("b","id","flat_b","2000","csv",meta,"c")]);db.commit();db.close()
            analysis=sqlite3.connect(root/"features.sqlite",uri=True)
            analysis.executescript("CREATE TABLE variants(id INTEGER PRIMARY KEY,strict); INSERT INTO variants VALUES(1,'a'); CREATE TABLE receipts(key PRIMARY KEY,value);")
            result=f.build_metadata(analysis,SimpleNamespace(db=source,label="fixture"),None)
            self.assertEqual(result["coverage"]["no_JSON_text_structure"],1)
            self.assertEqual(result["identity_graph"]["conflicting_IDs"],1)
            self.assertIn((1,"ID_TEXT_CONFLICT"),analysis.execute("SELECT * FROM exclusions").fetchall())
            analysis.close()
    def test_composition_weights_remain_fixed_by_cell(self):
        from composition_sensitivity import standardize
        v1=np.array([4.,2.,0.,0.,0.,0.]);v2=np.array([4.,0.,2.,0.,0.,0.])
        data={"clusters":3,"cells":{"a":{"total":v1},"b":{"total":v2}},"vectors":{1:{"a":v1,"b":v2}}}
        r=standardize(data,["a","b"],np.array([.25,.75]),0,11,100)
        self.assertEqual(r["difference_pp"],-25.)
        self.assertEqual(r["cluster_bootstrap_95_pp"],[-25.,-25.])
        self.assertLess(r["valid_draws"],100)
    def test_source_key_companion_preserves_weak_collision_only(self):
        import tempfile,sqlite3,json
        from pathlib import Path
        from types import SimpleNamespace
        from source_key_sensitivity import analyze
        with tempfile.TemporaryDirectory(dir=".") as directory:
            root=Path(directory);p=root/"fixture.sqlite";db=sqlite3.connect(p)
            db.executescript("CREATE TABLE variants(id,units,characters,targets,features); CREATE TABLE components(variant,cluster); CREATE TABLE rows(rid,variant,release,year,format,topic,category,collection,development_overlap); CREATE TABLE exclusions(variant,reason);")
            for i in (1,2,3):
                db.execute("INSERT INTO variants VALUES(?,5,10,0,NULL)",(i,));db.execute("INSERT INTO components VALUES(?,?)",(i,i))
                db.execute("INSERT INTO rows VALUES(?,?,'Fixture','2000','json','Fixture','Fixture','NEWSPAPER',0)",(i,i))
            db.executemany("INSERT INTO exclusions VALUES(?,?)",[(1,"WEAK_METADATA_DIFFERENT_STRUCTURES"),(2,"DEVELOPMENT_KEY_OVERLAP"),(3,"ID_TEXT_CONFLICT")]);db.commit();db.close()
            out=root/"result.json";analyze(SimpleNamespace(db=p,out=out));r=json.loads(out.read_text())
            self.assertEqual(r["groups"]["ALL"]["representation_rows"],1)
            self.assertEqual(r["groups"]["ALL"]["zero_target_rows"],1)
            self.assertEqual(r["globally_independent_work_identity"],"HOLD")
    def test_cluster_bootstrap_is_deterministic(self):
        v=np.zeros(len(f.METRICS)*3);v[:3]=[2,1,.5]
        self.assertEqual(f.interval({"a":v},3,42,50),f.interval({"a":v},3,42,50))
if __name__=="__main__":unittest.main(verbosity=2)

