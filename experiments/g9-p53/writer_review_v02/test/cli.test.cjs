'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const cli=path.join(__dirname,'../cli.cjs');
const root=path.join(__dirname,'..');
const briefs=path.join(root,'../genre_authority_v01/fixtures/briefs.json');
const draft=path.join(root,'examples/nar12_draft.txt'),ref=path.join(root,'examples/nar12_reference.json');
function exec(args){return cp.spawnSync(process.execPath,[cli,'--briefs',briefs,'--id','NAR12','--draft',draft,...args],{encoding:'utf8'});}
test('CLI default discloses hashes and candidate types, not original Korean prose',()=>{
 const r=exec(['--reference',ref]);assert.equal(r.status,0,r.stderr);
 const j=JSON.parse(r.stdout);assert.equal(j.candidates.length,2);
 assert(!r.stdout.includes('서아는 엽서'));
 assert.equal(j.selected,null);
});
test('CLI writes only explicitly requested, no overwrite, full text with caller acknowledgement',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ksgt-p53-review-'));
 try{
 const report=path.join(temp,'audit.json'),selected=path.join(temp,'selected.txt');
 const args=['--reference',ref,'--select','KRC_EXPLICIT_REFERENCE','--ack','EXPLICIT_AUTHOR_CHOICE','--out',report,'--selected-out',selected];
 const first=exec(args);assert.equal(first.status,0,first.stderr);
 const payload=JSON.parse(fs.readFileSync(report,'utf8'));
 assert.equal(payload.selected.candidate_id,'KRC_EXPLICIT_REFERENCE');
 assert(fs.readFileSync(selected,'utf8').includes('풍경 사진이 있는 엽서 두 장 중 한 장'));
 const second=exec(args);assert.notEqual(second.status,0);
 assert(second.stderr.includes('OUTPUT_EXISTS_NO_OVERWRITE'));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('CLI cannot write selected output absent explicit candidate choice',()=>{
 const r=exec(['--reference',ref,'--selected-out','/tmp/nonexistent-do-not-create-ksgt.txt']);
 assert.notEqual(r.status,0);assert(r.stderr.includes('SELECT_BEFORE_WRITING'));
});
