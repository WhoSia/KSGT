import unittest
from r6e_obligations import candidates, baseline

# Authored development fixtures, not a blinded Korean evaluation.
CASES=[
('근거를 추가해야 합니다.',{'REQUEST_EVIDENCE'}),
('자료를 제시해야 합니다.',{'REQUEST_EVIDENCE'}),
('문단을 둘로 나누어야 합니다.',{'SPLIT'}),
('문단을 통합해야 합니다.',{'MERGE'}),
('순서를 조정해야 합니다.',{'REORDER'}),
('문장을 삭제해야 합니다.',{'REMOVE'}),
('논리적 연결을 명확히 해야 합니다.',{'CLARIFY_RELATION'}),
('근거를 추가하였습니다.',set()),
('근거를 추가하지 않아도 됩니다.',set()),
('문단을 분리할 필요가 없습니다.',set()),
('문장을 삭제하는 것이 적절한지 고민해야 합니다.',set()),
('“근거를 추가해야 합니다.”라는 의견을 인용했습니다.',set()),
('근거를 추가한다면 좋겠습니다.',set()),
('근거를 추가해야 하지만 문장을 삭제해야 합니다.',set()),
('근거를 추가해야 합니다. 문단을 통합해야 합니다.',{'REQUEST_EVIDENCE','MERGE'}),
('문장 삭제가 아니라 문단을 분리해야 합니다.',set()),
('문장 삭제를 제안하지 않습니다.',set()),
('근거를 제시한 문장을 유지해야 합니다.',set()),
('문단을 통합하는 대신 원래 순서를 유지해야 합니다.',set()),
('근거를 제시하면 좋겠습니다.',{'REQUEST_EVIDENCE'}),
('관계를 명확히 해야 합니다.',{'CLARIFY_RELATION'}),
('근거를 추가하라고 권합니다.',set()),
]
class TestObligations(unittest.TestCase):
    def test_cases(self):
        for text,expected in CASES:
            with self.subTest(text=text):
                got={k for x in candidates('',text) if x['status']=='PROPOSED' for k in x['kinds']}
                self.assertEqual(got,expected)
    def test_unique_anchor(self):
        source='센서의 반응이 느렸다.'
        x=candidates(source,'“센서의 반응”을 설명할 근거를 추가해야 합니다.')[0]
        self.assertEqual(x['source_spans'],[(0,6)])
        self.assertEqual(x['authority'],'CANDIDATE_ONLY')
        self.assertTrue(x['missing_evidence'])
    def test_ambiguous_anchor(self):
        self.assertEqual(candidates('센서와 센서','“센서”의 근거를 추가해야 합니다.')[0]['source_spans'],[])
    def test_offsets(self):
        s='“예시. 인용”을 보면 근거를 추가해야 합니다.'
        x=candidates('',s)[0]
        self.assertEqual(x['feedback_span'],(0,len(s)))

class TestOrdinal(unittest.TestCase):
    def test_ordinal(self):
        from r6e_obligations import ordinal_anchor
        s='#[input data]\n센서를 점검했다. 측정값을 기록했다.'
        a,b=ordinal_anchor(s,'마지막 문장을 삭제해야 합니다.','문단')
        self.assertEqual(s[a:b],'측정값을 기록했다.')
        for t,f,l in [(s,'세 번째 문장','문단'),(s,'첫 번째 문장과 마지막 문장','문단'),(s,'마지막 문장','문서'),('#[input data]\n값은 3.5이다. 기록했다.','마지막 문장','문단'),('#[input data]\n“왔다.”고 말했다. 기록했다.','마지막 문장','문단')]:
            self.assertIsNone(ordinal_anchor(t,f,l))

if __name__=="__main__": unittest.main()
