"""Synthetic actor-provenance regressions; no repository mutations."""
import unittest
from p62_actor_audit import audit
class ActorTests(unittest.TestCase):
    def commit(self,a="Human",c="Human"):
        return {"sha":"fixture","commit":{"author":{"name":a,"email":"human@example.invalid"},"committer":{"name":c,"email":"human@example.invalid"}}}
    def test_author_bot(self):self.assertEqual(audit([self.commit("github-actions[bot]")],True)["status"],"HOLD")
    def test_committer_bot(self):self.assertEqual(audit([self.commit(c="github-actions[bot]")],True)["status"],"HOLD")
    def test_bot_login(self):
        x=self.commit();x["committer"]={"login":"github-actions[bot]"};self.assertEqual(audit([x],True)["status"],"HOLD")
    def test_partial_history_hold(self):self.assertEqual(audit([self.commit()])["status"],"HOLD")
    def test_human_preserved(self):
        x=self.commit();r=audit([x],True);self.assertEqual(r["status"],"VERIFIED");self.assertFalse(r["history_rewritten"])
if __name__=="__main__":unittest.main()
