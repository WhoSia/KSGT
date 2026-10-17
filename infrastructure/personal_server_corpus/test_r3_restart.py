"""Original synthetic checkpoint/restart and tamper fixtures, never corpus gold."""
import tempfile,pathlib,sqlite3,gzip,json,unittest
from types import SimpleNamespace
from unittest.mock import patch
import p62_r3_full_court as court
class RestartTests(unittest.TestCase):
 def setUp(self):
  self.disk=patch.object(court.shutil,'disk_usage',return_value=SimpleNamespace(free=100*1024**3))
  self.disk_mock=self.disk.start();self.addCleanup(self.disk.stop)
 def setup_root(self,root):
  src=root/'70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite';src.parent.mkdir(parents=True)
  private=root/'80_EXPORT/p62_referential_grounding_20261011/P62_PRIVATE.sqlite';private.parent.mkdir(parents=True)
  db=sqlite3.connect(src);db.execute('create table shards(path text,kind text)')
  lookup=sqlite3.connect(private);lookup.executescript('create table documents(strict text,lineage text,family text,year int);create table work_keys(lineage text,work text);')
  for i in range(2):
   path=root/f'shard{i}.gz'
   with gzip.open(path,'wt',encoding='utf8') as f:
    f.write(json.dumps({'document_variant':f's{i}','form':'아침이 밝았다.'},ensure_ascii=False)+'\n')
   db.execute('insert into shards values(?,?)',(str(path),'paragraphs'))
   lookup.execute('insert into documents values(?,?,?,?)',(f's{i}',f'l{i}','TEST',2026));lookup.execute('insert into work_keys values(?,?)',(f'l{i}',f'w{i}'))
  db.commit();lookup.commit();db.close();lookup.close()
 def test_bounded_commit_resume_and_clean_equivalence(self):
  with tempfile.TemporaryDirectory() as t:
   root=pathlib.Path(t);self.setup_root(root)
   with patch.object(court,'CENSUS',(2,2,0)):
    a=court.run(root,root/'resumed',max_new_shards=1);self.assertEqual(a['completed_shards'],1)
    b=court.run(root,root/'resumed',resume=True);c=court.run(root,root/'clean')
    self.assertEqual(b['zero_target_structures'],2);self.assertEqual(b['metrics'],c['metrics'])
    db=sqlite3.connect(root/'resumed/R3_CHECKPOINT.private.sqlite');self.assertEqual(db.execute('select count(*) from document_means').fetchone()[0],2);db.close()
 def test_changed_committed_shard_rejected(self):
  with tempfile.TemporaryDirectory() as t:
   root=pathlib.Path(t);self.setup_root(root);court.run(root,root/'out',max_new_shards=1)
   with (root/'shard0.gz').open('ab') as f:f.write(b'changed')
   with self.assertRaisesRegex(RuntimeError,'Committed shard changed'):court.run(root,root/'out',resume=True)
 def test_modified_source_seal_rejected(self):
  with tempfile.TemporaryDirectory() as t:
   root=pathlib.Path(t);self.setup_root(root);court.run(root,root/'out',max_new_shards=1)
   db=sqlite3.connect(root/'70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite');db.execute('create table alteration(x)');db.commit();db.close()
   with self.assertRaisesRegex(RuntimeError,'seal changed'):court.run(root,root/'out',resume=True)
 def test_disk_reserve_rejects_before_output(self):
  with tempfile.TemporaryDirectory() as t:
   root=pathlib.Path(t);self.disk_mock.return_value.free=59*1024**3
   with self.assertRaisesRegex(RuntimeError,'DISK_RESERVE'):court.run(root,root/'out')
   self.assertFalse((root/'out').exists())
if __name__=='__main__':unittest.main()
