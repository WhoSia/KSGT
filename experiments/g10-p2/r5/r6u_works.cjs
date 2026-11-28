'use strict';
// Original synthetic tasks; paired variants add a required negative fact while leaving the control unchanged.
const families=[
 {id:'message',genre:'친구에게 보내는 메시지',task:'반말로 한 문단. 시간과 확인 요청부터 간결하게 전달한다.',records:[['PAYLOAD','내일 모임은 오후 4시 20분에 2층 연습실에서 열린다.'],['PAYLOAD','공유 폴더에 자료를 올렸고 첫 장 제목만 확인해 달라고 부탁한다.'],['CONTEXT','상대가 지난번 메시지를 읽었는지는 모른다.'],['CONTROL','발표 순서를 묻거나 정하지 않는다.'],['LICENSE','부드러운 구어체 어미와 자연스러운 생략을 허용한다.']],contrast:['PAYLOAD','발표 순서는 아직 정해지지 않았다.']},
 {id:'notice',genre:'학교 시설 이용 공지',task:'합니다체로 한 문단. 이용자가 장소와 시간, 준비할 사항을 즉시 알 수 있게 쓴다.',records:[['PAYLOAD','금요일 독서 모임은 오후 3시 30분에 1층 열람실에서 열린다.'],['PAYLOAD','참가자는 읽을 책을 한 권씩 가져온다.'],['CONTEXT','작성자는 지난 공지에서 장소 설명이 길었다고 판단했다.'],['CONTROL','예약 방법이나 예약 여부를 설명하지 않는다.'],['LICENSE','필요한 정보만 담백하게 이어 쓴다.']],contrast:['PAYLOAD','별도의 좌석 예약은 받지 않는다.']},
 {id:'lab',genre:'과학 보고서',task:'평서체 두 문단. 목적과 결과를 연결하고 관찰 범위에서 해석한다.',records:[['PAYLOAD','기록 목적은 두 위치에서의 물의 온도 변화 비교였다.'],['PAYLOAD','A는 오전 21도, 오후 23도였고 B는 오전 21도, 오후 22도였다.'],['PAYLOAD','기록은 하루 동안 이루어졌다.'],['CONTEXT','이 보고서를 읽을 사람은 실험을 직접 보지 못했다.'],['CONTROL','가열 장치의 효율을 평가하지 않는다.'],['LICENSE','조건과 결과를 한 문장으로 결합해도 된다.']],contrast:['PAYLOAD','가열 장치의 작동 여부는 기록하지 않았다.']},
 {id:'scene',genre:'제한적 시점 소설',task:'평서체 두 문단. 공간을 먼저 보여 주고 마지막에는 인물의 이동을 담는다. 호흡에 변화를 준다.',records:[['PAYLOAD','유나는 닫힌 서고 문 앞에 있었다.'],['PAYLOAD','문 옆 벽에는 네모난 빛이 닿았다.'],['PAYLOAD','유나는 복도 끝 계단 쪽으로 걸어갔다.'],['CONTEXT','이 장면 앞에서는 다른 인물의 대화가 길게 이어졌다.'],['CONTROL','문이 닫힌 까닭이나 인물의 감정을 새로 설명하지 않는다.'],['LICENSE','네모난 빛의 모양을 비유할 수 있다. 새로운 물체, 행동, 감각은 추가하지 않는다.']],contrast:['PAYLOAD','유나는 문이 닫힌 까닭을 알지 못했다.']}
];
const works=families.flatMap(f=>[false,true].map(withNegative=>({id:f.id+(withNegative?'_negative':'_base'),family:f.id,genre:f.genre,task:f.task,paragraphs:f.id==='lab'||f.id==='scene'?2:1,records:[...f.records,...(withNegative?[f.contrast]:[])]})));
module.exports={families,works};
