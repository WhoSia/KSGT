'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),cp=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const cli=path.resolve(__dirname,'../cli.cjs'),base=path.resolve(__dirname,'../..');
const args=['--briefs',path.join(base,'genre_authority_v01/fixtures/briefs.json'),'--id','NAR12','--draft',path.join(base,'writer_review_v02/examples/nar12_draft.txt'),'--reference',path.join(base,'writer_review_v02/examples/nar12_reference.json')];
const exec=more=>cp.spawnSync(process.execPath,[cli,...args,...(more||[])],{encoding:'utf8'});
test('CONTEXTUAL CLI withholds edit and prints no private sentence',()=>{
 const x=exec();assert.equal(x.status,0,x.stderr);const j=JSON.parse(x.stdout);
 assert.equal(j.reference_gate,'UNRESOLVED_WRITER_CONTEXT');assert.equal(j.candidates.length,1);assert(!x.stdout.includes('서아는'));
});
test('withheld edit cannot be explicitly selected',()=>{
 const x=exec(['--select','KRC_EXPLICIT_REFERENCE','--ack','EXPLICIT_AUTHOR_CHOICE']);
 assert.notEqual(x.status,0);assert(x.stderr.includes('INVALID_EXPLICIT_SELECTION'));
});
test('CLI rejects overwrite even for generated audit',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ksgt-v03-'));
 try{const file=path.join(dir,'audit.json');assert.equal(exec(['--out',file]).status,0);
 const x=exec(['--out',file]);assert.notEqual(x.status,0);assert(x.stderr.includes('REFUSE_OVERWRITE'));}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});
