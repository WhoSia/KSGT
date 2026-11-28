'use strict';
const seq=(...events)=>({events,mode:'sequence'}),topic=(...events)=>({events,mode:'topic'}),reset=(...events)=>({events,mode:'reset'});
const c=(id,text,groups,hard=[])=>({id,text,groups,hard});
// Source order edges are separated from discourse dependencies. These are authored interpretations.
const cases=[
{id:'repair',events:['A','B','note'],before:[['A','note']],candidates:[
 c('linear','A실의 서가 번호를 확인해 점검표에 적었다. B실의 반납함 위치를 확인했다.',[seq('A','note'),seq('B')],[['A','note']]),
 c('topic','A실의 서가 번호와 B실의 반납함 위치를 확인했다. 확인한 서가 번호는 점검표에 적었다.',[topic('A','B'),topic('note')],[['A','note']]),
 c('then','A실의 서가 번호를 확인한 뒤 B실의 반납함 위치를 확인했다. 이후 번호를 적었다.',[seq('A','B','note')],[['A','B'],['B','note']])]},
{id:'letters',events:['white','blue','open','leave'],before:[['white','open'],['blue','leave'],['open','leave']],candidates:[
 c('linear','은서는 흰 봉투를 책상에 놓고 열었다. 민재는 파란 봉투를 선반에 놓았다. 흰 봉투를 여는 일과 파란 봉투를 놓는 일이 끝난 뒤 민재는 작업실을 나갔다.',[seq('white','open'),seq('blue'),seq('leave')],[['white','open'],['blue','leave'],['open','leave']]),
 c('topic','흰 봉투는 은서가 책상에 놓았고 파란 봉투는 민재가 선반에 놓았다. 은서는 자신이 놓은 봉투를 열었다. 흰 봉투를 여는 일과 파란 봉투를 놓는 일이 끝난 뒤 민재는 작업실을 나갔다.',[topic('white','blue'),topic('open'),seq('leave')],[['white','open'],['blue','leave'],['open','leave']]),
 c('added','은서가 흰 봉투를 열자 민재가 파란 봉투를 놓고 나갔다.',[seq('white','open','blue','leave')],[['white','open'],['open','blue'],['blue','leave']])]},
{id:'studio',events:['white','gray','open','leave'],before:[['white','open'],['gray','leave'],['open','leave']],candidates:[
 c('linear','재윤이 왼쪽 책상에 흰 상자를 놓고 열었다. 하은은 오른쪽 책상에 회색 상자를 놓았다. 흰 상자를 여는 일과 회색 상자를 놓는 일이 끝난 뒤 하은은 작업실을 나갔다.',[seq('white','open'),seq('gray'),seq('leave')],[['white','open'],['gray','leave'],['open','leave']]),
 c('topic','재윤은 왼쪽 책상에 놓은 흰 상자를 열었고 하은은 오른쪽 책상에 회색 상자를 놓았다. 흰 상자를 여는 일과 회색 상자를 놓는 일이 끝난 뒤 하은은 작업실을 나갔다.',[topic('white','open','gray'),seq('leave')],[['white','open'],['gray','leave'],['open','leave']])]},
{id:'new_notice_partial',events:['print','move'],before:[],candidates:[c('linear','안내문을 인쇄했다. 책상을 옮겼다.',[seq('print'),seq('move')]),c('topic','안내문 인쇄와 책상 이동을 마쳤다.',[topic('print','move')]),c('then','안내문을 인쇄한 뒤 책상을 옮겼다.',[seq('print','move')],[['print','move']])]},
{id:'new_notice_ordered',events:['print','move'],before:[['print','move']],candidates:[c('linear','안내문을 인쇄했다. 책상을 옮겼다.',[seq('print'),seq('move')]),c('topic','안내문 인쇄와 책상 이동을 마쳤다.',[topic('print','move')]),c('then','안내문을 인쇄한 뒤 책상을 옮겼다.',[seq('print','move')],[['print','move']])]},
{id:'new_scene_partial',events:['bell','light'],before:[],candidates:[c('linear','종이 울렸다. 복도에 불이 켜졌다.',[seq('bell'),seq('light')]),c('topic','종이 울렸고 복도에 불이 켜졌다.',[topic('bell','light')])]},
{id:'new_scene_reverse',events:['bell','light'],before:[['light','bell']],candidates:[c('linear','종이 울렸다. 복도에 불이 켜졌다.',[seq('bell'),seq('light')]),c('flashback','종이 울렸다. 그 전에 복도에 불이 켜졌다.',[seq('bell'),reset('light')],[['light','bell']]),c('chronological','복도에 불이 켜진 뒤 종이 울렸다.',[seq('light','bell')],[['light','bell']])]}
];module.exports={cases};
