"""Revisit four exposed R5c patch drafts. All labels/replacements investigator-authored.
The sentence splitter is limited to these pinned archived cases.
"""
import json, re, zipfile, sys, hashlib
from pathlib import Path
from r5z_edit_closure import closure,apply,digest
# Explicit independent missing-fact obligations are seeds, not inferred edges.
ARCHIVE_SHA="fc5b87340ed6b3e4c399547812050b75637b1fd4fd83b54b1d9470cecfc8d733"
CASES={
 'R5A_SCENE_PAPER': ({3:['anchor'],7:['event']},[(3,5,'anchor','event'),(5,6,'event','reference')],{3:'한쪽 벽 옆에 놓인 의자 아래에 종이 한 장이 보였다.',5:'나는 그 종이를 바라보았다.',6:'거기에 무엇이 적혀 있는지는 아직 몰랐다.',7:'종이는 여전히 의자 아래에 있었다.'}, '전시가 끝난 늦은 오후, 작은 전시관에 나 혼자 남았다. 몇 개 남은 조명이 바닥을 희미하게 비추고 있었다. 의자 아래에 접히지 않은 종이 한 장이 보였다. 무엇이 적혀 있는지는 알 수 없었다. 나는 아직 종이를 집지 않았다.'),
 'R5A_SCENE_GARDEN': ({0:['event'],2:['location'],5:['event'],7:['anchor']},[(2,3,'location','location'),(2,4,'location','reference'),(5,6,'event','event'),(7,8,'anchor','reference'),(8,9,'reference','ending')],{0:'새벽에 현우는 빈 온실에 먼저 들어섰다.',2:'현우는 탁자 위에 빈 화분을 놓았다.',3:'',4:'수진은 온실 문턱에 서서 그 화분을 바라보았다.',5:'',6:'두 사람 사이에는 아무 말도 오가지 않았다.',7:'',8:'수진은 여전히 문턱에 서 있었다.',9:''}, '새벽, 비가 그친 뒤의 온실은 유리창마다 물기를 머금고 있었다. 현우가 먼저 들어와 탁자 위에 빈 화분을 놓았다. 수진은 문턱에 서서 화분을 바라보았다. 두 사람 사이에 오가는 말은 없었다. 수진은 그대로 문턱에 머물렀다.'),
 'R5A_SCI_CLOCK': ({6:['certainty'],4:['scope']},[(4,5,'scope','scope'),(5,6,'scope','certainty')],{4:'현재 기록만으로는 색 변화 시점이 달라진 원인을 특정할 수 없습니다.',5:'다음 실험에서는 온도와 교반 속도를 일정하게 유지해 두 조건을 비교할 계획입니다.',6:''}, '시약을 혼합한 뒤 색 변화가 관찰되기까지 조건 A에서는 42초, 조건 B에서는 35초가 걸렸습니다. 조건 B의 교반 속도가 더 빨랐고 두 조건의 온도는 기록되지 않았으므로, 관찰 시점의 차이를 특정 요인의 효과로 단정하기 어렵습니다. 다음 실험에서는 온도와 교반 속도를 일정하게 유지한 상태에서 두 조건을 비교할 계획입니다.'),
 'R5A_NOTICE_BOOK': ({3:['scope'],2:['missing_fact']},[(2,3,'missing_fact','scope')],{2:'4교시에도 열람석은 이용할 수 있습니다. 반납함 이용 가능 여부는 아직 확인되지 않았습니다.',3:'이번 안내는 수요일에만 적용되며, 목요일 운영 방식은 바뀌지 않습니다.'}, '이번 수요일 4교시에는 도서관 대출 창구를 운영하지 않습니다. 5교시부터는 평소대로 이용할 수 있습니다. 4교시에도 열람석은 이용 가능하며, 반납함 이용 가능 여부는 아직 확인되지 않았습니다. 이번 안내는 수요일에만 적용되며 목요일 운영 방식은 바뀌지 않습니다.')
}

def run(path):
    if hashlib.sha256(Path(path).read_bytes()).hexdigest()!=ARCHIVE_SHA:raise ValueError('ARCHIVE_SHA_MISMATCH')
    with zipfile.ZipFile(path) as z:
        if z.testzip() is not None:raise ValueError('CRC')
        j=json.loads(z.read('r5c-live/final-score.json'))
    results=[]; private=[]
    for r in j['rows']:
        w=r['sourceWork']
        if w not in CASES:continue
        text=r['exactSpanEdit']['text']; expected=r['exactSpanEdit']['sha256']
        spans=[m.span() for m in re.finditer(r'\S.*?(?:[.!?](?=\s|$)|$)',text,re.S)]
        seeds,edges,edits,whole=CASES[w];selected=closure(range(len(spans)),seeds,edges)
        out=apply(text,expected,spans,edits,selected)
        if len(selected)*4>=len(spans)*3:route='COMPARE_FULL_REWRITE'
        else:route='REVIEW_LOCAL_AND_FULL'
        # Whitespace-only cleanup is a separate display candidate, not a byte-preserving edit.
        clean=re.sub(r'\n[ \t]+','\n',out);clean=re.sub(r'\n(?:[ \t]*\n){2,}','\n\n',clean);clean=re.sub(r' {2,}',' ',clean).strip()
        results.append({'work':w,'nodes':len(spans),'seeds':len(seeds),'closure_nodes':sorted(selected),'closure_size':len(selected),'closure_chars_in_scope':sum(spans[i][1]-spans[i][0] for i in selected),'contiguous_chars_in_scope':spans[max(selected)][1]-spans[min(selected)][0],'whole_chars_in_scope':len(text),'candidate_chars':len(clean),'source_only_candidate_chars':len(whole),'parent_sha256':expected,'candidate_sha256':digest(clean),'source_only_candidate_sha256':digest(whole),'route':route,'status':'REVIEW_ONLY_EXPOSED'})
        private.append({'work':w,'source_facts':r['sourceFacts'],'closure_candidate_before_display_cleanup':out,'closure_candidate':clean,'source_only_candidate':whole})
    if len(results)!=4:raise ValueError('MISSING_CASE')
    return {'archive_sha256':hashlib.sha256(Path(path).read_bytes()).hexdigest(),'cases':results,'new_provider_calls':0,'human_ratings':0,'quality_promotion':False,'labels_and_text':'Investigator-authored exposed development; not automatic inference.'},private
if __name__=='__main__':
    r,p=run(sys.argv[1]);print(json.dumps(r,ensure_ascii=False,indent=2))
    if len(sys.argv)>2:Path(sys.argv[2]).write_text(json.dumps(p,ensure_ascii=False,indent=2),encoding='utf8')
