#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {parse}=require('../writer_review_v02/cli.cjs');
const {reviewWithAuthority}=require('./review.cjs');
function run(args){
 const a=parse(args),briefs=JSON.parse(fs.readFileSync(a['--briefs'],'utf8'));
 if(!Array.isArray(briefs)||briefs.filter(b=>b.id===a['--id']).length!==1)throw Error('BRIEF_NOT_UNIQUE');
 const brief=briefs.find(x=>x.id===a['--id']),draft=fs.readFileSync(a['--draft'],'utf8');
 const referenceInput=a['--reference']?JSON.parse(fs.readFileSync(a['--reference'],'utf8')):null;
 const modelCandidates=a['--models']?JSON.parse(fs.readFileSync(a['--models'],'utf8')):[];
 const selection=a['--select']?{id:a['--select'],acknowledge:a['--ack']}:null;
 const result=reviewWithAuthority({brief,draft,referenceInput,modelCandidates,selection});
 if(a['--selected-out']&&!selection)throw Error('MISSING_SELECTION');
 const outs=[a['--out'],a['--selected-out']].filter(Boolean);
 if(new Set(outs).size!==outs.length)throw Error('DUPLICATE_DESTINATION');
 for(const p of outs)if(fs.existsSync(p))throw Error('REFUSE_OVERWRITE');
 if(a['--out'])fs.writeFileSync(a['--out'],JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 if(a['--selected-out'])fs.writeFileSync(a['--selected-out'],result.selected.text,{flag:'wx'});
 const summary={brief_id:result.brief_id,draft_sha256:result.draft_sha256,
  candidates:result.candidates.map(c=>({id:c.id,authority:c.authority_tier,change_count:c.delta.inserted_codepoints+c.delta.removed_codepoints})),
  writer_policy:result.authority_gate.high_level_policy,reference_gate:result.authority_gate.reference_proposal,
  selected:result.selected?.candidate_id||null,quality:'NOT_MEASURED'};
 console.log(JSON.stringify(summary,null,2));return summary;
}
if(require.main===module){try{run(process.argv.slice(2))}catch(e){console.error('KSGT_OFFLINE_ERROR:',e.message);process.exitCode=1;}}
module.exports={run};
