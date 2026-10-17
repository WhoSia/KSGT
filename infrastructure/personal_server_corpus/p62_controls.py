"""Original synthetic mechanism counterexamples; author intentions are not human corpus gold."""
from p62_reference import *
CASES=[
 {"name":"EXPLICIT_INTER","intent":"AUTHOR_INTENTION_REFERENCE","forms":["학생 세 명, 교사 한 명이 강당에 모였다.","행사가 시작되었다.","그 중 한 명, 민수가 먼저 발표했다.","청중은 박수를 보냈다.","행사가 끝났다."],"target_unit":2},
 {"name":"UNRELATED_NUMERIC","intent":"AUTHOR_INTENTION_UNRELATED_NUMERIC_DISTRACTOR","forms":["교사 세 명, 안내원 한 명이 회의를 마쳤다.","학생들이 강당에 모였다.","그 중 한 명, 민수가 먼저 발표했다.","청중은 박수를 보냈다.","행사가 끝났다."],"target_unit":2},
 {"name":"INTRA_PARAGRAPH","intent":"AUTHOR_INTENTION_INTRA_REFERENCE","forms":["아침이 밝았다.","학교가 문을 열었다.","학생 세 명, 교사 한 명이 강당에 모였다. 그 중 한 명, 민수가 먼저 발표했다.","청중은 박수를 보냈다.","행사가 끝났다."],"target_unit":2},
 {"name":"METALINGUISTIC","intent":"AUTHOR_INTENTION_NONREFERENTIAL_MENTION","forms":["학생 세 명, 교사 한 명이 강당에 모였다.","수업이 시작되었다.","교사는 '그 중'이라는 표현을 칠판에 적었다.","종이 울렸다.","수업이 끝났다."],"target_unit":2},
 {"name":"FORWARD_NUMERIC","intent":"AUTHOR_INTENTION_FORWARD_CONTROL_NOT_ANTECEDENT","forms":["아침이 밝았다.","학교가 문을 열었다.","그 중 한 명, 민수가 먼저 발표했다.","교사 세 명, 안내원 한 명이 회의를 시작했다.","종이 울렸다."],"target_unit":2},
 {"name":"ELLIPSIS_PROMPT","intent":"AUTHOR_INTENTION_OMITTED_SUBJECT_NOT_OBSERVED_SPAN","forms":["민수가 강당에 들어왔다.","잠시 기다렸다.","그 중 한 명, 민수가 먼저 발표했다.","청중은 박수를 보냈다.","행사가 끝났다."],"target_unit":2},
 {"name":"TOPIC_WITHOUT_NUMERIC","intent":"AUTHOR_INTENTION_TOPIC_PERSISTENCE_ONLY","forms":["학교는 행사를 준비했다.","학교는 안내문을 붙였다.","그 중 한 명, 민수가 먼저 발표했다.","학교는 교실을 정리했다.","학교는 문을 닫았다."],"target_unit":2},
 {"name":"SOURCE_SEGMENTATION_VARIANT","intent":"AUTHOR_INTENTION_SAME_AUTHORED_TEXT_DIFFERENT_UNITS","forms":["아침이 밝았다.","학교가 문을 열었다.","학생 세 명, 교사 한 명이 강당에 모였다.","그 중 한 명, 민수가 먼저 발표했다.","청중은 박수를 보냈다.","행사가 끝났다."],"target_unit":3}
]
def evaluate():
    rows=[]
    for x in CASES:
        m=TARGET.search(x["forms"][x["target_unit"]])
        t={"unit":x["target_unit"],"start":m.start(),"end":m.end(),"observed":True}
        cs,s=summary(x["forms"],t)
        rows.append({"name":x["name"],"authority":x["intent"],"machine":s,
          "structural_top1_kind":(rank_candidate(x["forms"],t,cs) or {}).get("kind"),
          "human_ground_truth":None,"candidate_kind_counts":dict(collections.Counter(c["kind"] for c in cs))})
    return {"status":"EXECUTED","authority":"ORIGINAL_SYNTHETIC_AUTHOR_INTENTIONS_ONLY","cases":rows,"independent_human_judgments":0,
            "falsifier":"A positive numeric-compatible proxy can occur with an explicitly unrelated numeric group. Identical proxy values cannot identify coreference."}

