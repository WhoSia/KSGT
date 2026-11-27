'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {median}=require('./r6v_analysis.cjs');
test('median on unsorted even and odd samples',()=>{assert.equal(median([4,1,3,2]),2.5);assert.equal(median([9,2,4]),4)});
