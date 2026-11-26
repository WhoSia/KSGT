import unittest
from r6f_targets import rank, units, lexical_top1, HEADER
# Authored development cases, not independent annotations.
CASES=[
('서쪽 유리창은 닫혀 있었다. 동쪽 유리창은 열려 있었다.', "‘유리창’에 대한 설명을 보완해야 합니다.", [0,1], 'COMPETING_ANCHORS'),
('서쪽 유리창은 닫혀 있었다. 동쪽 유리창은 열려 있었다.', "‘동쪽 유리창’에 대한 설명을 보완해야 합니다.", [1], 'SURFACE_ANCHOR'),
('토양 수분을 측정했다. 측정기는 빌렸다. 발아율을 비교했다.', "‘토양 수분’과 ‘발아율’의 관계를 명확히 해야 합니다.", [0,2], 'MULTI_TARGET'),
('센서의 온도를 기록했다. 실험은 오전에 진행했다.', '근거를 추가해야 합니다.', [], 'UNRESOLVED'),
('교실을 정리했다. 도서관에 책을 돌려주었다.', '두 번째 문장을 삭제해야 합니다.', [1], 'ORDINAL_ANCHOR'),
('교실을 정리했다. 도서관에 책을 돌려주었다.', '첫 번째 문장인 ‘도서관’의 내용을 보완해야 합니다.', [1], 'CONFLICT'),
('압력 센서의 응답을 기록했다. 배터리의 전압을 기록했다.', '압력 센서 응답의 근거를 추가해야 합니다.', [0], 'LEXICAL_REVIEW'),
('설문을 실시했다. 설문 결과를 정리했다.', '설문에 관한 근거를 추가해야 합니다.', [0,1], 'LEXICAL_REVIEW'),
('측정값은 3.14였다. 오차를 별도로 기록했다.', '‘오차’를 설명해야 합니다.', [1], 'SURFACE_ANCHOR'),
('기록은 보존했다. 파일은 복사했다.', '‘기록 보존’의 근거를 추가해야 합니다.', [0], 'LEXICAL_REVIEW'),
('책을 정리했다. 창문을 닫았다.', '‘열차 운행’의 근거를 추가해야 합니다.', [], 'UNRESOLVED'),
('분석은 끝나지 않았다. 자료는 정리했다.', '‘분석은 끝나지 않았다’의 설명을 보완해야 합니다.', [0], 'SURFACE_ANCHOR'),
]
class Test(unittest.TestCase):
 def test_partial_quote(self):
    r=rank(HEADER+'발아율을 측정했다. 온도를 기록했다.', '‘발아율’과 ‘습도’의 관계를 설명해야 합니다.', '문단');self.assertEqual(r['status'],'PARTIAL_QUOTE_REVIEW');self.assertEqual(r['candidates'],[0]);self.assertEqual(r['pair_candidates'],[])
 def test_cases(self):
    for src,fb,expected,status in CASES:
      with self.subTest(fb=fb):
        r=rank(HEADER+src,fb,'문단');self.assertEqual(r['candidates'],expected);self.assertEqual(r['status'],status);self.assertEqual(r['authority'],'CANDIDATE_ONLY')
 def test_pair(self):
    src,fb,_,_=CASES[2];self.assertEqual(rank(HEADER+src,fb,'문단')['pair_candidates'],[(0,2)])
 def test_offsets(self):
    s=HEADER+'😀 센서 3.14를 기록했다.\n  "정말?"이라고 물었다.'
    self.assertEqual([s[a:b] for a,b in units(s)],['😀 센서 3.14를 기록했다.','"정말?"이라고 물었다.'])
 def test_no_document_ordinal(self):
    self.assertEqual(rank(HEADER+'첫 문장이다. 다른 문장이다.','두 번째 문장을 삭제해야 합니다.','글')['status'],'UNRESOLVED')
if __name__=='__main__':unittest.main()
