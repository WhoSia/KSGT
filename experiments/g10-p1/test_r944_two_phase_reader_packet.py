"""Hermetic contract tests. No Groq calls, no human ratings and no private ZIP in Git."""
import hashlib
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from r944_two_phase_packet import cards_for_form, generate, read_evidence

COHORT = Path(__file__).parent / 'fixtures' / 'r934_reader_cohort_v01.json'
ARMS = ('direct', 'rich', 'guided')
ORDERS = (('guided','direct'),('direct','guided'),('guided','rich'),('rich','guided'))

def sha(t):
    return hashlib.sha256(t.encode()).hexdigest()

def build_synthetic(path):
    works = json.loads(COHORT.read_text())
    plan_hash = sha('synthetic-plan')
    cells = []
    inner_buffer = io.BytesIO()
    with zipfile.ZipFile(inner_buffer, 'w', zipfile.ZIP_DEFLATED) as inner:
        for work in works:
            for arm in ARMS:
                ident = f'R934_{work["id"]}_{arm}'
                prompt_hash = sha(ident)
                text = f'합성 모의 문장 {work["id"]} {arm}.'
                cells.append({'id':ident,'sourceWork':work['id'],'condition':arm,'promptSha256':prompt_hash})
                attempt = {'id':ident,'planHash':plan_hash,'promptSha256':prompt_hash}
                result = {'id':ident,'sourceWork':work['id'],'condition':arm,
                          'promptSha256':prompt_hash,'outcome':'GENERATED',
                          'finishReason':'stop','text':text,'textSha256':sha(text)}
                inner.writestr(f'r934-run/{ident}.attempt.json', json.dumps(attempt))
                inner.writestr(f'r934-run/{ident}.result.json', json.dumps(result,ensure_ascii=False))
        inner.writestr('r934-run/summary.json',json.dumps({'planHash':plan_hash}))
    key = {}
    for form in range(1,5):
        rows=[]
        for ix,work in enumerate(works,1):
            a,b = ORDERS[(ix-1+form-1)%4]
            rows.append({'number':ix,'work':work['id'],
                         'A':f'R934_{work["id"]}_{a}', 'B':f'R934_{work["id"]}_{b}',
                         'answer':work['key']})
        key[str(form)] = rows
    with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as outer:
        outer.writestr('r934-plan.json',json.dumps({'planHash':plan_hash,'cells':cells}))
        outer.writestr('R934-provider.zip',inner_buffer.getvalue())
        outer.writestr('R934-reader-packet/investigator-key.json',json.dumps(key,ensure_ascii=False))
    return key

class TwoPhaseTests(unittest.TestCase):
    def test_all_receipts_and_four_forms_without_leak(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); archive=root/'source.zip'; build_synthetic(archive)
            p, k, outputs = read_evidence(archive)
            self.assertEqual(len(p['cells']),36)
            self.assertEqual(len(outputs),36)
            works={w['id']:w for w in json.loads(COHORT.read_text())}
            self.assertEqual(len(cards_for_form(k,outputs,works,1)),12)
            out=generate(archive,COHORT,root/'out')
            for ix in range(1,5):
                a=(out/'reader-stage-A'/f'form-{ix}.md').read_text()
                b=(out/'source-auditor-stage-B'/f'form-{ix}.md').read_text()
                self.assertEqual(a.count('## 문항 '),12)
                self.assertEqual(b.count('## 문항 '),12)
                self.assertNotIn('작성자가 제공한 원천 사실',a)
                self.assertNotIn('R934_',a)
                self.assertNotIn('R934_',b)
                self.assertIn('작성자가 제공한 원천 사실',b)
            meta=json.loads((out/'researcher-private'/'run-manifest.json').read_text())
            self.assertEqual(meta['independentReaderRatings'],0)
            with self.assertRaises(FileExistsError):
                generate(archive,COHORT,out)

    def test_cross_work_key_and_missing_or_extra_receipts_are_blocked(self):
        with tempfile.TemporaryDirectory() as directory:
            archive=Path(directory)/'source.zip';build_synthetic(archive)
            _,key,results=read_evidence(archive)
            works={w['id']:w for w in json.loads(COHORT.read_text())}
            key['1'][0]['A']='R934_CHAT_REPLY_direct'
            with self.assertRaisesRegex(ValueError,'bad A/B references'):
                cards_for_form(key,results,works,1)

if __name__=='__main__':
    unittest.main()
