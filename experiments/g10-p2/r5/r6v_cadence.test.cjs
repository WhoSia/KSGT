'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {diagnose,sentences,render}=require('./r6v_cadence.cjs');
const w={paragraphs:1,genre:'산문',refrains:[],protectedStarts:[]};
test('repeated opening is a cue not a rewrite',()=>{let d=diagnose('나는 책을 읽었다. 나는 창문을 보았다. 나는 수첩을 접었다.',w);assert.equal(d.hints[0].kind,'REPEATED_OPENING');assert.match(render(d),/맞으면 유지/);});
test('intentional refrain and comparison are not length penalties',()=>{let d=diagnose('나는 책을 읽었다. 나는 창문을 보았다. 나는 수첩을 접었다.',{...w,refrains:['나는 창문을 보았다.']});assert.equal(d.hints.length,0);assert.equal(diagnose('A는 수온을 확인하는 장치가 연결되어 있었다. A는 오전의 수온을 기록하는 대상이었다. A는 오후의 수온도 기록하는 대상이었다.',{...w,protectedStarts:['A는']}).hints.length,0);});
test('skip quotes and paragraph mismatch; decimal stays intact',()=>{assert.equal(sentences('그는 “좋아.”라고 했다. 나는 나갔다.'),null);assert.deepEqual(sentences('온도는 2.5도였다. 기록했다.'),['온도는 2.5도였다.','기록했다.']);assert.equal(diagnose('문장이다.\n\n다음이다.',w).kind,'FORMAT_MISMATCH');});
test('similar length is genre sensitive',()=>{let p='수온은 오전에 기록한 수치와 같았다. 오후에는 별도의 수치를 남겨 두었다. 마지막 기록의 날짜는 월요일이었다.';assert.equal(diagnose(p,w).hints[0].kind,'SIMILAR_LENGTH');assert.equal(diagnose(p,{...w,genre:'과학 잡지 설명문'}).hints.length,0);});
