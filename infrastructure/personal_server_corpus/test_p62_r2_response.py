"""Synthetic response admission regressions; these fixtures are never human evidence."""
import gzip,hashlib,json,pathlib,tempfile,unittest
from p62_r2_response import import_responses
from p62_reference import digest
import test_p62_r2 as fixtures
class ResponseTests(unittest.TestCase):
    def fixture(self,p):
        x=fixtures.R2Tests().item();x.update(r2_split="SEALED_EVALUATION",r2_identity_admission="FROZEN_JSON_GRAPH_ONLY")
        packet=p/"synthetic.gz"
        with gzip.open(packet,"wt",encoding="utf8") as f:f.write(json.dumps(x,ensure_ascii=False)+"\n")
        seal=p/"seal.json";seal.write_text(json.dumps({"reviewer_registry_sha256":None}))
        binding=p/"binding.json";binding.write_text(json.dumps({"declaration_sha256":digest(seal),"allowed_packet_sha256":[digest(packet)]}))
        response=p/"response.json";response.write_text("[]")
        return x,packet,seal,binding,response
    def test_unbound_packet_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=pathlib.Path(tmp);_,packet,seal,binding,response=self.fixture(p)
            with self.assertRaises(ValueError):import_responses(packet,response,seal,p/"out.json")
    def test_empty_labels_hold(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=pathlib.Path(tmp);_,packet,seal,binding,response=self.fixture(p)
            r=import_responses(packet,response,seal,p/"out.json",binding_path=binding)
            self.assertEqual(r["status"],"HOLD");self.assertIsNone(r["primary"]);self.assertIsNone(r["no_post_target_counter_ablation"])
    def test_two_self_attestations_not_gold(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=pathlib.Path(tmp);x,packet,seal,binding,response=self.fixture(p)
            a=fixtures.R2Tests().judgment(x);a["item_id"]=x["item_id"]
            b={**a,"adjudicator_id":"other-synthetic"}
            response.write_text(json.dumps([a,b]))
            r=import_responses(packet,response,seal,p/"out.json",binding_path=binding)
            self.assertEqual(r["verified_responses"],0);self.assertEqual(r["primary_scored_targets"],0);self.assertIsNone(r["reliability"]["kappa"])
    def test_mutated_packet_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=pathlib.Path(tmp);x,packet,seal,binding,response=self.fixture(p)
            with gzip.open(packet,"at",encoding="utf8") as f:f.write(json.dumps(x)+"\n")
            with self.assertRaises(ValueError):import_responses(packet,response,seal,p/"out.json",binding_path=binding)
    def test_no_ledger_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=pathlib.Path(tmp);_,packet,seal,binding,response=self.fixture(p);out=p/"out.json";out.write_text("preserve")
            with self.assertRaises(FileExistsError):import_responses(packet,response,seal,out,binding_path=binding)
            self.assertEqual(out.read_text(),"preserve")
if __name__=="__main__":unittest.main()
