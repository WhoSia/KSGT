import fs from 'node:fs';import path from 'node:path';
import {compileBCOG} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {analyze,nullCourt,ledger,LAW} from './motif_r8.mjs';

const [input,outDir]=process.argv.slice(2);if(!outDir)throw new Error('usage: node analyze_rmr_r8.mjs <jsonl> <out>');
const rows=fs.readFileSync(input,'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const clean=s=>String(s||'').replace(/\*\*/g,'').replace(/^\s*\[[^\]]{1,80}\]\s*:?\s*/,'').replace(/^\s*[-–—*#]+\s*/,'').trim();
function segments(s){const z=String(s||'').replace(/\r/g,'\n').split(/\n+|(?<=[.!?])\s+(?=[A-Z\[])/).map(clean).filter(x=>x.length>=18&&x.length<=900);return [...new Set(z)];}
const role=lab=>['SRP','VCR'].includes(String(lab).toUpperCase())?'REVISION_COMMITMENT':'ASSERTION';
const items=[];let total_segments=0,complete=0;
for(const r of rows){
 const segs=segments(r.rebuttal_content);total_segments+=segs.length;
 for(let i=0;i<segs.length;i++){
  const text=segs[i],g={review_root:'RMR|'+r.paper_id,response_chunk_id:'RMR|'+r.paper_id+'|'+r.review_id,structural_role:role(r.rebuttal_label),block_type:'PROSE',attachment_key:r.review_id,antecedent_key:r.perspective,local_scope_key:r.rebuttal_label};
  const bcog=compileBCOG(text,g);if(bcog.representation_certificate?.pass)complete++;
  items.push({id:[r.paper_id,r.review_id,i].join('|'),paper:r.paper_id,text,rebuttal_label:r.rebuttal_label,perspective:r.perspective,bcog});
 }
}
const exact=analyze(items,'exact'),family=analyze(items,'family');
const nul=nullCourt(items,family.stats.primary_cross_paper_pairs);
const primary=family.witnesses.filter(x=>x.connected_chain&&x.cross_paper);
const summary={phase:'G9-P36-R8',law:LAW,rows:rows.length,total_segments,representation_complete_segments:complete,exact_arm:exact.stats,family_arm:family.stats,family_null:nul,promotion_inputs:{primary_pairs:primary.length,distinct_papers:family.stats.distinct_primary_papers,distinct_families:family.stats.distinct_primary_families}};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'rmr_analysis_summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'exact_witnesses.jsonl'),exact.witnesses.map(JSON.stringify).join('\n')+(exact.witnesses.length?'\n':''));
fs.writeFileSync(path.join(outDir,'family_witnesses.jsonl'),family.witnesses.map(JSON.stringify).join('\n')+(family.witnesses.length?'\n':''));
fs.writeFileSync(path.join(outDir,'family_primary_witnesses.jsonl'),primary.map(JSON.stringify).join('\n')+(primary.length?'\n':''));
fs.writeFileSync(path.join(outDir,'motif_items.tsv'),ledger(items).join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
