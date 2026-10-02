import fs from 'node:fs';
import {compileBCOG} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {analyze} from './motif_r8.mjs';
const input=process.argv[2];if(!input)throw new Error('usage');
const rows=fs.readFileSync(input,'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const clean=s=>String(s||'').replace(/\*\*/g,'').replace(/^\s*\[[^\]]{1,80}\]\s*:?\s*/,'').replace(/^\s*[-–—*#]+\s*/,'').trim();
function segments(s){return [...new Set(String(s||'').replace(/\r/g,'\n').split(/\n+|(?<=[.!?])\s+(?=[A-Z\[])/).map(clean).filter(x=>x.length>=18&&x.length<=900))];}
const role=lab=>['SRP','VCR'].includes(String(lab).toUpperCase())?'REVISION_COMMITMENT':'ASSERTION';
const items=[];
for(const r of rows)for(const [i,text] of segments(r.rebuttal_content).entries()){const g={review_root:'RMR|'+r.paper_id,response_chunk_id:'RMR|'+r.paper_id+'|'+r.review_id,structural_role:role(r.rebuttal_label),block_type:'PROSE',attachment_key:r.review_id,antecedent_key:r.perspective,local_scope_key:r.rebuttal_label};items.push({id:[r.paper_id,r.review_id,i].join('|'),paper:r.paper_id,text,rebuttal_label:r.rebuttal_label,perspective:r.perspective,bcog:compileBCOG(text,g)});}
const exact=analyze(items,'exact').witnesses.filter(x=>x.connected_chain&&x.cross_paper);
const family=analyze(items,'family').witnesses.filter(x=>x.connected_chain&&x.cross_paper);
console.log(JSON.stringify({status:'POSTHOC_READ_ONLY_DIAGNOSTIC_NO_SELECTOR_CHANGE',exact_primary:exact,family_primary:family,family_only:family.filter(f=>!exact.some(e=>e.pair_key===f.pair_key))},null,2));
