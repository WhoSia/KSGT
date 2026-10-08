'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {census,gitBlobSha,BLOB}=require('../census.cjs');
const make=(alter=()=>{})=>{const a=Array.from({length:20},(_,i)=>[(i<10?'0':'1'),'문장'+i]);alter(a);return Buffer.from('topic\tsentence\n'+a.map(x=>x.join('\t')).join('\n')+'\n');};
test('source Git blob SHA is an explicit pin',()=>assert.match(BLOB,/^[a-f0-9]{40}$/));
test('ten-row group diversity is measured without human quality labels',()=>{
 const r=census(make(),{verify:false});assert.equal(r.groups,2);assert.equal(r.rows,20);
 assert.equal(r.full_ten_distinct_groups,2);assert.equal(r.limitations.independent_human_writing_quality,false);
});
test('repeated human strings do not become distinct candidates',()=>{
 const r=census(make(a=>a[9][1]=a[0][1]),{verify:false});
 assert.equal(r.groups_with_duplicates,1);assert.equal(r.cross_half_exact_match_groups,1);
});
test('topic-crossed group cannot silently count as one intent',()=>{
 assert.throws(()=>census(make(a=>a[4][0]='1'),{verify:false}),/CROSSED_TOPIC/);
});
test('unverified corpus bytes are not accepted as pinned official source',()=>{
 assert.throws(()=>census(make()),/PINNED_SOURCE_BLOB_MISMATCH/);
});
test('truncated group must fail rather than be counted',()=>{
 const b=make().toString('utf8').trimEnd().split('\n').slice(0,-1).join('\n');
 assert.throws(()=>census(Buffer.from(b),{verify:false}),/NON_MULTIPLE/);
});
test('unexpected TSV header is rejected',()=>{
 assert.throws(()=>census(Buffer.from('wrong\tsentence\n0\tx'),{verify:false}),/WRONG_HEADER/);
});
test('Git object hash distinguishes line endings',()=>{
 assert.notEqual(gitBlobSha(Buffer.from('a\n')),gitBlobSha(Buffer.from('a\r\n')));
});
