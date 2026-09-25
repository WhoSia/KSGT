import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {compileBCOG} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {contentFactors} from '../g9-p36-r6/factor_r6.mjs';
import {analyze,nullCourt,shell,LAW} from './motif_r9.mjs';
const [input,authorFile,outDir]=process.argv.slice(2);if(!outDir)throw new Error('usage');
const rows=fs.readFileSync(input,'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const authors=JSON.parse(fs.readFileSync(authorFile,'utf8')).papers||{};
const clean=s=>String(s||'').replace(/\*\*/g,'').replace(/^\s*\[[^\]]{1,80}\]\s*:?\s*/,'').replace(/^\s*[-–—*#]+\s*/,'').trim();
function segs(s){return [...new Set(String(s||'').replace(/\r/g,'\n').split(/\n+|(?<=[.!?])\s+(?=[A-Z\[])/).map(clean).filter(x=>x.length>=18&&x.length<=900))]}
const role=l=>['SRP','VCR'].includes(String(l).toUpperCase())?'REVISION_COMMITMENT':'ASSERTION';
const items=[];let total=0,complete=0;
for(const r of rows){for(const [i,text] of segs(r.rebuttal_content).entries()){total++;const g={review_root:'RMR9|'+r.paper_id,response_chunk_id:'RMR9|'+r.paper_id+'|'+r.review_id,structural_role:role(r.rebuttal_label),block_type:'PROSE',attachment_key:r.review_id,antecedent_key:r.perspective,local_scope_key:r.rebuttal_label};const bcog=compileBCOG(text,g);if(bcog.representation_certificate?.pass)complete++;items.push({id:[r.paper_id,r.review_id,i].join('|'),paper:r.paper_id,title:r.paper_title||'',text,rebuttal_label:r.rebuttal_label,perspective:r.perspective,bcog})}}
const exact=analyze(items,authors,'exact'),family=analyze(items,authors,'family');
const resolvedAuthors=Object.values(authors).filter(x=>x.openreview_found).length;
const nul=resolvedAuthors===0?{replicates:127,observed:0,null_mean:0,null_min:0,null_median:0,null_p95:0,null_max:0,plus_one_p:1,pass:false,shortcut:'EXACT_BY_UNKNOWN_AUTHOR_ABSTENTION'}:nullCourt(items,authors,family.stats.lineage_independent_primary_pairs);
const primary=family.witnesses.filter(x=>x.lineage.independent);
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}-]+/gu,' ').replace(/\s+/g,' ').trim();
const stop=new Set(['CNN','RNN','LLM','NLP','AI','ML','GPU','CPU','SOTA']);
function methods(s){const out=[];for(const t of String(s||'').match(/[A-Za-z][A-Za-z0-9-]{2,}/g)||[]){if(stop.has(t.toUpperCase()))continue;if(/[A-Z].*[A-Z]/.test(t)||/[A-Za-z].*\d|\d.*[A-Za-z]/.test(t)||t.includes('-'))out.push(t.toLowerCase())}return [...new Set(out)].sort()}
function auth(pid){const a=authors[pid]||{};const xs=(a.authorids?.length?a.authorids:a.authors)||[];return [...new Set(xs.map(norm).filter(Boolean))].sort()}
const led=[];
for(const x of items){const ex=shell(x,'exact'),fa=shell(x,'family');const cf=contentFactors(x.bcog),edges=[...new Set(cf.filter(y=>y.startsWith('ARG1_BIGRAM|')).map(y=>y.slice(12)))].sort();if(!ex||!fa||!edges.length)continue;led.push([x.id,x.paper,ex.hash,fa.hash,fa.predicate_family,sha(norm(x.text)),edges.join(';'),[...new Set(cf)].sort().join(';'),auth(x.paper).join(';'),norm(x.title).split(' ').filter(z=>z.length>=3).join(';'),methods((x.title||'')+' '+x.text).join(';')].join('\t'))}
const summary={phase:'G9-P36-R9',law:LAW,rows:rows.length,total_segments:total,representation_complete_segments:complete,author_metadata:{selected_papers:Object.keys(authors).length,resolved:resolvedAuthors},exact_arm:exact.stats,family_arm:family.stats,family_null:nul,predicate_family_necessity:{family_minus_exact_independent:family.stats.lineage_independent_primary_pairs-exact.stats.lineage_independent_primary_pairs,family_unique_required:true},promotion_inputs:{independent_pairs:primary.length,distinct_papers:family.stats.distinct_independent_papers,distinct_families:family.stats.distinct_independent_families,distinct_author_components:family.stats.distinct_author_components}};
fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'rmr_analysis_summary.json'),JSON.stringify(summary,null,2)+'\n');fs.writeFileSync(path.join(outDir,'family_witnesses.jsonl'),family.witnesses.map(JSON.stringify).join('\n')+(family.witnesses.length?'\n':''));fs.writeFileSync(path.join(outDir,'lineage_independent_primary.jsonl'),primary.map(JSON.stringify).join('\n')+(primary.length?'\n':''));fs.writeFileSync(path.join(outDir,'motif_items.tsv'),led.sort().join('\n')+'\n');console.log(JSON.stringify(summary,null,2));
