#!/usr/bin/env node
'use strict';
// Offline executable; never sends draft text to a model/API or prints draft
// body by default. Output files are opt-in and exclusive-create (wx).
const fs=require('node:fs'),path=require('node:path');
const {review}=require('./review.cjs');
function parse(args){
  if(args.length%2)throw Error('USAGE --briefs JSON --id ID --draft TEXT_PATH [--reference JSON] [--models JSON] [--select ID --ack EXPLICIT_AUTHOR_CHOICE] [--out JSON_PATH] [--selected-out TEXT_PATH]');
  const r={};for(let i=0;i<args.length;i+=2){const k=args[i];if(!k.startsWith('--')||r[k]!==undefined)throw Error('INVALID_ARGUMENTS');r[k]=args[i+1];}
  for(const a of Object.keys(r))if(!['--briefs','--id','--draft','--reference','--models','--select','--ack','--out','--selected-out'].includes(a))throw Error('UNKNOWN_ARGUMENT_'+a);
  if(!r['--briefs']||!r['--id']||!r['--draft'])throw Error('REQUIRED_BRIEFS_ID_DRAFT');
  if(Boolean(r['--select'])!==Boolean(r['--ack']))throw Error('SELECTION_ACK_PAIR_REQUIRED');
  if(r['--selected-out']&&!r['--select'])throw Error('SELECT_BEFORE_WRITING');
  if(r['--out']&&r['--out']===r['--selected-out'])throw Error('SAME_OUTPUT_PATH');
  return r;
}
function run(args){const opt=parse(args);
  const briefs=JSON.parse(fs.readFileSync(opt['--briefs'],'utf8'));
  if(!Array.isArray(briefs)||briefs.filter(b=>b.id===opt['--id']).length!==1)throw Error('UNKNOWN_OR_DUPLICATE_BRIEF');
  const brief=briefs.find(b=>b.id===opt['--id']),draft=fs.readFileSync(opt['--draft'],'utf8');
  const referenceInput=opt['--reference']?JSON.parse(fs.readFileSync(opt['--reference'],'utf8')):null;
  const models=opt['--models']?JSON.parse(fs.readFileSync(opt['--models'],'utf8')):[];
  const selection=opt['--select']?{id:opt['--select'],acknowledge:opt['--ack']}:null;
  const result=review({brief,draft,referenceInput,modelCandidates:models,selection});
  const output=opt['--out'],selectedOutput=opt['--selected-out'];
  for(const file of [output,selectedOutput].filter(Boolean))if(fs.existsSync(file))throw Error('OUTPUT_EXISTS_NO_OVERWRITE:'+path.basename(file));
  if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  if(selectedOutput)fs.writeFileSync(selectedOutput,result.selected.text,{flag:'wx'});
  // Only IDs, counts, warnings and hashes on stdout: draft stays local.
  const summary={brief_id:result.brief_id,draft_sha256:result.draft_sha256,
    candidates:result.candidates.map(c=>({id:c.id,channel:c.channel,changed_characters:c.delta.removed_codepoints+c.delta.inserted_codepoints})),
    alerts:result.alerts.map(x=>x.type),selected:result.selected?.candidate_id??null,writer_quality:'NOT_MEASURED'};
  process.stdout.write(JSON.stringify(summary,null,2)+'\n');return summary;
}
if(require.main===module){try{run(process.argv.slice(2))}catch(e){console.error('KSGT_OFFLINE_ERROR:',e.message);process.exitCode=1;}}
module.exports={run,parse};
