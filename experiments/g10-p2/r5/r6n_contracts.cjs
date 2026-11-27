'use strict';
const {works}=require('./r6l_works.cjs'),{spans,replacements}=require('./r6m_spans.cjs');
// Explicitly authored entry contracts for the inherited spans, not extracted meaning.
const entries={archive:{'later unknown':{requires:['folder'],unique:{kind:'file',id:'blue'}}},team:{'proposal result next':{requires:['criteria'],unique:{kind:'criterion',id:'sample'}}},exhibit:{'report plan':{requires:['test']}}};
const inherited=works.map(w=>({...w,units:w.units.map(u=>({...u,variants:u.variants.map(v=>({...v,text:w.id==='archive'&&u.id==='later'&&v.unique?replacements.archive.later:v.text}))})),spans:(spans[w.id]??[]).map(c=>({...c,...entries[w.id]?.[c.ids.join(' ')]}))}));
const v=(text,focus=[],extra={})=>({text,focus,...extra});
const u=(id,p,fact,variants,after=[],mentions=[])=>({id,p,fact,variants,after,mentions});
const s=(ids,text,endFocus,endAnchor,mentions=[],entry={})=>({ids:ids.split(' '),text,endFocus,endAnchor,mentions,...entry});
const newWorks=[
{id:'repair',genre:'도서관 업무 경과 보고',task:'두 문단. 먼저 오전 점검과 오후 작업을 정리하고, 둘째 문단에는 담당자의 설명과 아직 미정인 사항을 담는다. 기록에 없는 인과나 약속은 넣지 않는다.',units:[
 u('start',0,'오전에 두 자료실의 상태를 확인했다.',[v('오전에 두 자료실의 상태를 확인했다.')]),
 u('a',0,'A실에서는 서가 번호를 확인했다.',[v('A실에서는 서가 번호를 확인했다.',['a'])],['start']),
 u('b',0,'B실에서는 반납함 위치를 확인했다.',[v('B실에서는 반납함 위치를 확인했다.',['b'])],['start']),
 u('note',0,'A실의 서가 번호를 점검표에 적었다.',[v('A실의 서가 번호를 점검표에 적었다.',['a']),v('번호를 점검표에 적었다.',['a'],{ref:'a'})],['a']),
 u('afternoon',0,'오후에 점검표를 담당자에게 전달했다.',[v('오후에 점검표를 담당자에게 전달했다.',['staff'])],['note','b']),
 u('reply',1,'담당자는 A실 번호를 다시 확인할 수 있다고 말했다.',[v('담당자는 A실 번호를 다시 확인할 수 있다고 말했다.',['staff'])],['afternoon']),
 u('pending',1,'B실 반납함을 옮길지는 미정이다.',[v('B실 반납함을 옮길지는 미정이다.',['b'])],['reply']),
 u('end',1,'추가 작업의 완료일은 정해지지 않았다.',[v('추가 작업 완료일은 정해지지 않았다.')],['pending'])],spans:[s('a note','A실에서는 서가 번호를 확인해 점검표에 적었다.',['a'],'note'),s('b a','B실의 반납함 위치와 A실의 서가 번호를 확인했다.',['a'],'a'),s('reply pending','담당자는 A실 번호를 다시 확인할 수 있다고 말했다. B실 반납함을 옮길지는 미정이다.',['b'],'pending')]},
{id:'letters',genre:'제한적 시점의 기록 서사',task:'두 문단. 첫 문단은 하린이 본 일, 둘째 문단은 전달받은 설명과 미확인 사항. 두 봉투를 혼동하거나 마음속을 단정하지 않는다.',units:[
 u('enter',0,'하린은 작업실로 들어왔다.',[v('하린은 작업실에 들어왔다.',['h'])]),
 u('white',0,'하린은 은서가 흰 봉투를 책상에 놓는 것을 보았다.',[v('은서가 흰 봉투를 책상에 놓는 모습이 보였다.',['e'])],['enter'],[{kind:'envelope',id:'white'}]),
 u('blue',0,'하린은 민재가 파란 봉투를 선반에 놓는 것을 보았다.',[v('민재는 파란 봉투를 선반에 놓았다.',['m'])],['enter'],[{kind:'envelope',id:'blue'}]),
 u('open',0,'하린은 은서가 흰 봉투를 여는 것을 보았다.',[v('은서는 흰 봉투를 열었다.',['e']),v('봉투를 열었다.',['e'],{ref:'e',unique:{kind:'envelope',id:'white'}})],['white']),
 u('leave',0,'하린은 민재가 작업실을 나가는 것을 보았다.',[v('민재는 작업실을 나갔다.',['m'])],['blue','open']),
 u('report',1,'은서는 나중에 하린에게 흰 봉투에 안내문이 있었다고 말했다.',[v('나중에 은서는 하린에게 흰 봉투에 안내문이 있었다고 말했다.',['e'])],['leave']),
 u('unknown',1,'하린은 안내문의 내용과 파란 봉투의 내용물을 확인하지 못했다.',[v('하린은 안내문의 내용과 파란 봉투의 내용물을 확인하지 못했다.',['h'])],['report']),
 u('reason',1,'하린은 민재가 나간 이유도 확인하지 못했다.',[v('민재가 나간 이유도 확인하지 못했다.',['h'],{ref:'h'}),v('하린은 민재가 나간 이유도 확인하지 못했다.',['h'])],['unknown'])],spans:[s('white open','은서가 흰 봉투를 책상에 놓고 여는 모습이 보였다.',['e'],'open',['envelope:white']),s('blue leave','민재는 파란 봉투를 선반에 놓았고 작업실을 나갔다.',['m'],'leave',['envelope:blue']),s('unknown reason','하린은 안내문의 내용과 파란 봉투의 내용물, 민재가 나간 이유를 확인하지 못했다.',['h'],'reason')]}
];
module.exports={inherited,newWorks,works:[...inherited,...newWorks]};
