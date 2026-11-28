import unittest
from r6f_claims import claim_candidates
from r6f_targets import rank, HEADER
CASES=[
('교실을 조사했다. 따라서 환기 방식을 개선해야 한다. 실제로 창문은 한 개뿐이었다.',[1],[2],[]),
('예를 들어 작은 창문도 있다. 결론적으로 환기 방식을 개선해야 한다. 따라서 측정도 반복해야 한다.',[1,2],[0],[]),
('“따라서 환기 방식을 개선해야 한다.”라고 말했다. 조사 결과 창문은 두 개였다.',[],[1],[0]),
('온도가 상승한다면 측정이 필요하다. 결론적으로 다시 측정할 필요가 있다.',[1],[],[]),
('실험 결과 따라서 센서가 필요하다고 주장했다.',[],[],[0]),
('교실을 정리했다. 창문을 닫았다.',[],[],[]),
]
class Test(unittest.TestCase):
 def test_roles(self):
    for s,c,e,r in CASES:
        s=HEADER+s;t=rank(s,'근거를 추가해야 합니다.','문단');out=claim_candidates(s,['REQUEST_EVIDENCE'],t)
        self.assertEqual((out['claims'],out['support'],out['scope_review']),(c,e,r))
 def test_no_override(self):
    s=HEADER+'따라서 환기를 개선해야 한다.';t=rank(s,'‘환기’를 설명해야 합니다.','문단');self.assertEqual(claim_candidates(s,['REQUEST_EVIDENCE'],t)['claims'],[])
 def test_no_factual_authority(self):
    s=HEADER+'실험 결과 센서의 정확도는 높았다.';t=rank(s,'근거를 추가해야 합니다.','문단');self.assertEqual(claim_candidates(s,['REQUEST_EVIDENCE'],t)['authority'],'CANDIDATE_ONLY')
if __name__=='__main__':unittest.main()
