'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {median,refrainCount}=require('./r6v_analysis.cjs');
test('median on unsorted even and odd samples',()=>{assert.equal(median([4,1,3,2]),2.5);assert.equal(median([9,2,4]),4)});
test('paragraph trailing Markdown spaces do not hide a required refrain',()=>{assert.equal(refrainCount('첫 문장. 의자는 그대로였다.  \n\n다음 문장. 의자는 그대로였다.  \n\n끝. 의자는 그대로였다.','의자는 그대로였다.'),3);});
