'use strict';
// Authored semantic contracts; these are not computed from the Korean surface.
const span=(ids,text,extra=false,endFocus=[],endAnchor=null,mentions=[])=>({ids:ids.split(' '),text,extra,endFocus,endAnchor,mentions});
const spans={
 archive:[span('entry people','민서는 열람실에 들어와 지우와 서현이 같은 책상에 앉아 있는 모습을 보았다.',false,['j','s'],'people'),span('folder leave','지우는 파란 파일을 펼쳤고 서현은 열람실을 나갔다.',false,['s'],'leave',['file:blue']),span('later unknown','나중에 지우는 민서에게 그 파일이 목록이라고 말했다. 민서는 목록의 내용도 서현이 나간 이유도 확인하지 못했다.',false,['m'],'unknown'),span('folder leave','지우가 파란 파일을 펼치자 서현이 열람실을 나갔다.',true)],
 trial:[span('a b','A의 수온은 오전 20도에서 오후 22도로 상승했고, B는 오후에 20도였다. B의 오전 수온 기록은 없다.',false,['b'],'b'),span('limit bLimit','A의 수온 상승이 장치 연결 때문인지는 확인하지 않았다. B는 오전 수온 기록이 없어 오전과 오후의 수온 차이를 판단할 수 없다.',false,['b'],'bLimit'),span('a b','A의 수온은 2도 상승했고 B의 수온은 변하지 않았다.',true)],
 notice:[span('open return','정리 중에도 1층 열람실은 이용할 수 있으며, 책은 1층 반납함에 넣어 주시기 바랍니다.',false,['box'],'return'),span('pending route','2층 자료실의 정리 완료일과 재개 후 이동 동선은 아직 정해지지 않았습니다.',false,['room'],'route'),span('pending route','정리가 끝나는 대로 새 이동 동선을 공지하겠습니다.',true)],
 team:[span('read criteria','공개 초록을 읽어 봤는데, 표본을 나눈 기준이 나와 있더라. 전문은 아직 못 읽었어.',false,['self'],'read',['criterion:sample']),span('proposal result next','팀 문서에 그 기준을 추가하면 좋겠어. 두 연구의 결과가 일치하는지는 아직 확인 못 했어. 결과 비교는 전문을 읽고 나서 하자.',false,['self'],'next'),span('proposal result','팀 문서에 기준을 추가했어. 결과도 같더라.',true)],
 lists:[span('old new','수아는 지난달 대출 목록을 책상 위에 놓았고, 윤호는 그 옆에 이번 달 대출 목록을 놓았다.',false,['y'],'new',['list:old','list:new']),span('unknown scope','이번 달 목록을 확인했는지, 두 목록 중 어느 하나라도 수정했는지는 기록에 없다.',false,[],'scope'),span('check unknown','수아는 두 목록을 모두 확인했다.',true)],
 exhibit:[span('print test','오후에는 학생팀이 안내문을 인쇄하고, 인쇄를 마친 뒤 안내문 한 장을 읽기 쉽게 배치했다.',false,['team'],'test'),span('report plan','담당자는 안내판 위치를 다시 검토할 수 있다고 했고, 학생팀은 나머지 안내문도 같은 방식으로 배치하자고 제안했다.',false,['team'],'plan'),span('report plan','담당자는 안내판 위치를 바꾸기로 했고 학생팀은 나머지 안내문을 배치했다.',true)]
};
// Keep an authored alternative to the original ambiguous omission, not a universal required-surface rule.
const replacements={archive:{later:'나중에 지우는 민서에게 그 파일이 목록이라고 말했다.'}};
module.exports={spans,replacements};
