import pathlib, sys, unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from audit_nikl_2025 import audit_documents

class NIKLSafeCensusTests(unittest.TestCase):
    def test_structural_roles_and_surface_occurrence_not_mislabeled_gold(self):
        docs=[
            {"sentence":[
                {"form":"그중 한 권을 골랐다.","ZA":[{"ellipsis":[
                    {"restored":{"type":"subject","form":"그 사람"},"antecedent":[{"id":1},{"id":2}]},
                    {"restored":{"type":"object","form":"책"},"antecedent":[{"id":1}]}]}]},
                {"form":"빈 문장","ZA":[]}]},
            {"sentence":[
                {"form":"다른 사람이 왔다.","ZA":[{"ellipsis":[
                    {"restored":{"type":"adjunct","form":"거기"},"antecedent":[]}]}]}]}
        ]
        a=audit_documents(docs)
        self.assertEqual(a["counts"]["documents"],2)
        self.assertEqual(a["counts"]["sentences"],3)
        self.assertEqual(a["counts"]["sentences_with_geujung"],1)
        self.assertEqual(a["counts"]["slots_in_geujung_sentences"],2)
        self.assertEqual(a["counts"]["multi_antecedent_slots"],1)
        self.assertEqual(a["counts"]["ellipsis_slots"],3)
        self.assertEqual(a["restored_roles"],{"adjunct":1,"object":1,"subject":1})
    def test_empty_docs_do_not_create_spurious_stats(self):
        self.assertEqual(audit_documents([]),{"counts":{},"restored_roles":{}})

if __name__=="__main__":unittest.main()
