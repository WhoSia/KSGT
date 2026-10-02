import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {compileBCOG} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {analyzeObserved,adjacencyNullCourt,itemLedgerRows,LAW} from './motif_r7.mjs';

const [dataRoot,adapterPath,compilerPath,outDir]=process.argv.slice(2);if(!outDir)throw new Error('usage: node extract_r7_re3align.mjs <archive> <adapter> <r2compiler> <out>');
const {ensureResponseChunks}=await import(pathToFileURL(path.resolve(adapterPath)).href);
const {replayDocument}=await import(pathToFileURL(path.resolve(compilerPath)).href);
const manifest=fs.readFileSync('experiments/g9-p36-r5/fresh118_manifest.txt','utf8').trim().split(/\r?\n/);
if(manifest.length!==118)throw new Error('expected inherited 118-paper manifest');
const wanted=new Set(manifest),paperDirs=new Map();
function discover(dir,depth=0){if(depth>8||paperDirs.size===wanted.size)return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(!e.isDirectory())continue;const p=path.join(dir,e.name);if(wanted.has(e.name)){paperDirs.set(e.name,p);continue;}discover(p,depth+1);}}discover(dataRoot);
const ground=o=>({review_root:o.G.review_root,response_chunk_id:o.G.response_chunk_id,structural_role:o.G.structural_role,block_type:o.G.block_type,attachment_key:o.G.attachment_key,antecedent_key:o.G.antecedent_key,local_scope_key:o.G.local_scope_key});
const items=[];let response_files=0,obligations=0,complete=0;
for(const paper of manifest){const pd=paperDirs.get(paper),rd=pd&&path.join(pd,'response');if(!rd||!fs.existsSync(rd))continue;
 for(const file of fs.readdirSync(rd).filter(x=>x.endsWith('.json')).sort()){response_files++;const raw=JSON.parse(fs.readFileSync(path.join(rd,file),'utf8'));const obs=replayDocument(ensureResponseChunks(raw)).obligations;obligations+=obs.length;
  for(let i=0;i<obs.length;i++){const o=obs[i],bcog=compileBCOG(o.text,ground(o));if(bcog.representation_certificate?.pass)complete++;items.push({id:`${paper}|${file}|${i}`,paper,file,index:i,text:o.text,bcog});}
 }}
const observed=analyzeObserved(items);
const nullCourt=adjacencyNullCourt(items,observed.stats.primary_cross_paper_connected_chain_pairs);
const primary=observed.witnesses.filter(x=>x.connected_chain&&x.cross_paper);
const exploratory=observed.witnesses;
const summary={
 phase:'G9-P36-R7',
 law:LAW,
 source_status:'PREVIOUSLY_OPENED_R5_R6_SOURCE_NEW_PRESEALED_R7_QUESTION',
 papers_expected:118,papers_discovered:paperDirs.size,response_files,obligations,representation_complete_obligations:complete,
 relation_motif:observed.stats,
 lexical_collision_null:{...nullCourt,null_counts:undefined},
 promotion:{
  primary_witness_pairs:primary.length,
  micro_reuse_authority:nullCourt.pass?'PROMOTED_RELATION_MOTIF_ONLY':'NOT_PROMOTED',
  semantic_equivalence_authority:'NOT_GRANTED',
  fusion_authority:'NOT_GRANTED'
 }
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'re3align_summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'relation_witnesses.jsonl'),exploratory.map(JSON.stringify).join('\n')+(exploratory.length?'\n':''));
fs.writeFileSync(path.join(outDir,'primary_relation_witnesses.jsonl'),primary.map(JSON.stringify).join('\n')+(primary.length?'\n':''));
fs.writeFileSync(path.join(outDir,'null_distribution.json'),JSON.stringify(nullCourt,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'motif_items.tsv'),itemLedgerRows(items).join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));
if(paperDirs.size!==118)process.exitCode=4;
