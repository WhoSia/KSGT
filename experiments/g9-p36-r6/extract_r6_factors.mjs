import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {compileBCOG,controlledFusionWitness,normalize} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {quotient,indexFactorReuse,indexMicrofusion,couplingAudit} from './factor_r6.mjs';

const [dataRoot,adapterPath,compilerPath,outDir]=process.argv.slice(2);if(!outDir)throw new Error('usage: node extract_r6_factors.mjs <archive> <adapter> <r2compiler> <out>');
const {ensureResponseChunks}=await import(pathToFileURL(path.resolve(adapterPath)).href);
const {replayDocument}=await import(pathToFileURL(path.resolve(compilerPath)).href);
const manifest=fs.readFileSync('experiments/g9-p36-r5/fresh118_manifest.txt','utf8').trim().split(/\r?\n/);
if(manifest.length!==118)throw new Error('expected inherited 118-paper manifest');
const wanted=new Set(manifest),paperDirs=new Map();
function discover(dir,depth=0){if(depth>8||paperDirs.size===wanted.size)return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(!e.isDirectory())continue;const p=path.join(dir,e.name);if(wanted.has(e.name)){paperDirs.set(e.name,p);continue;}discover(p,depth+1);}}discover(dataRoot);
const ground=o=>({review_root:o.G.review_root,response_chunk_id:o.G.response_chunk_id,structural_role:o.G.structural_role,block_type:o.G.block_type,attachment_key:o.G.attachment_key,antecedent_key:o.G.antecedent_key,local_scope_key:o.G.local_scope_key});
const items=[];let response_files=0,obligations=0,complete=0,quotient_complete=0;
for(const paper of manifest){const pd=paperDirs.get(paper),rd=pd&&path.join(pd,'response');if(!rd||!fs.existsSync(rd))continue;
 for(const file of fs.readdirSync(rd).filter(x=>x.endsWith('.json')).sort()){response_files++;const raw=JSON.parse(fs.readFileSync(path.join(rd,file),'utf8'));const obs=replayDocument(ensureResponseChunks(raw)).obligations;obligations+=obs.length;
  for(let i=0;i<obs.length;i++){const o=obs[i],id=`${paper}|${file}|${i}`,bcog=compileBCOG(o.text,ground(o));if(bcog.representation_certificate?.pass)complete++;const q=quotient(bcog);if(q.pass)quotient_complete++;items.push({id,paper,file,index:i,text:o.text,source_id:`${o.G.response_chunk_id}#${i}`,bcog});}
 }}
const reuse=indexFactorReuse(items),micro=indexMicrofusion(items);
const reuseRows=[...reuse.rows].sort((a,b)=>a.pair_key.localeCompare(b.pair_key));
const microRows=[...micro.rows].sort((a,b)=>a.pair_key.localeCompare(b.pair_key));
const fusionDiagnostics=[],candidates=[];
for(const e of microRows){
 const A=e.left.bcog,B=e.right.bcog,c=couplingAudit(A,B);
 const w=c.pass?controlledFusionWitness(A,B):{pass:false,reason:c.reason};
 fusionDiagnostics.push({pair_key:e.pair_key,left:e.left.id,right:e.right.id,shared:e.shared,left_unique:e.left_unique,right_unique:e.right_unique,coupling:c,roundtrip:{pass:!!w.pass,reason:w.reason,gain_chars:w.gain_chars??null}});
 if(!w.pass)continue;
 const aa=new Set(A.atoms),bb=new Set(B.atoms),shared=[...aa].filter(x=>bb.has(x)),left=[...aa].filter(x=>!bb.has(x)),right=[...bb].filter(x=>!aa.has(x));
 candidates.push({id:`R6|${e.left.id}|${e.right.id}`,pair_key:e.pair_key,paper:e.left.paper,file:e.left.file,operation:'F1_CONJUNCTIVE_FUSION',source_ids:[e.left.source_id,e.right.source_id],source_texts:[e.left.text,e.right.text],source_obligation_atoms:[A.atoms,B.atoms],shared_atoms:shared,left_unique_atoms:left,right_unique_atoms:right,fused_obligation_atoms:[...new Set([...aa,...bb])].sort(),grounding:{compatible:true,left:A.grounding,right:B.grounding},force_compatible:true,representation_sufficiency:{pass:true,left:A.representation_certificate,right:B.representation_certificate},factor_quotient:{shared:e.shared,left_unique:e.left_unique,right_unique:e.right_unique,q_core:e.q_core,q_ground:e.q_ground},realization:w,compression:{source_chars:e.left.text.length+e.right.text.length+1,fused_ir_chars:w.text.length,gain_chars:w.gain_chars}});
}
const factorFreq=new Map();for(const x of items){const q=quotient(x.bcog);if(!q.pass)continue;for(const f of q.content)factorFreq.set(f,(factorFreq.get(f)||0)+1);}
const factor_family_counts={ARG1_BIGRAM:0,ARG1_TOKEN:0,DOC_POINTER:0};for(const [f,n] of factorFreq){const k=f.split('|')[0];if(k in factor_family_counts)factor_family_counts[k]+=n;}
const samePaper=reuseRows.filter(x=>x.left.paper===x.right.paper).length;
const crossPaper=reuseRows.length-samePaper;
const summary={
 phase:'G9-P36-R6',source_status:'PREVIOUSLY_OPENED_BY_R5_NOT_FRESH_SOURCE_WORLD_CONTACT',
 papers_expected:118,papers_discovered:paperDirs.size,response_files,obligations,
 representation_complete_obligations:complete,quotient_complete_obligations:quotient_complete,
 inherited_r5_whole_obligation_neighbors:0,
 factor_reuse:{...reuse.stats,same_paper_pairs:samePaper,cross_paper_pairs:crossPaper,factor_family_posting_counts:factor_family_counts},
 microfusion:{...micro.stats,controlled_roundtrip_pass_pairs:candidates.length,controlled_roundtrip_fail_pairs:microRows.length-candidates.length}
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'extraction_summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'factor_reuse_witnesses.jsonl'),reuseRows.slice(0,500).map(x=>JSON.stringify({pair_key:x.pair_key,left:{id:x.left.id,text:x.left.text,paper:x.left.paper},right:{id:x.right.id,text:x.right.text,paper:x.right.paper},shared:x.shared,left_unique:x.left_unique,right_unique:x.right_unique,same_grounding:x.same_grounding})).join('\n')+(reuseRows.length?'\n':''));
fs.writeFileSync(path.join(outDir,'microfusion_diagnostics.jsonl'),fusionDiagnostics.map(JSON.stringify).join('\n')+(fusionDiagnostics.length?'\n':''));
fs.writeFileSync(path.join(outDir,'candidates.jsonl'),candidates.map(JSON.stringify).join('\n')+(candidates.length?'\n':''));
const postings=[];for(const x of items){const q=quotient(x.bcog);if(!q.pass)continue;for(const f of q.content)postings.push([x.id,q.q_core,q.q_ground,f].join('\t'));}
postings.sort();fs.writeFileSync(path.join(outDir,'factor_postings.tsv'),postings.join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));if(paperDirs.size!==118)process.exitCode=4;
