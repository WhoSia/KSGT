import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [dataRoot,adapterPath,compilerPath,outDir]=process.argv.slice(2);
if(!dataRoot||!adapterPath||!compilerPath||!outDir) throw new Error('usage: node run_full121_public.mjs <emnlp24-root> <adapter.mjs> <compiler.mjs> <outdir>');
const {ensureResponseChunks}=await import(pathToFileURL(path.resolve(adapterPath)).href);
const {replayDocument,CONTRACT}=await import(pathToFileURL(path.resolve(compilerPath)).href);
const manifest=fs.readFileSync('experiments/g9-p36-r2/calibration121_manifest.txt','utf8').trim().split(/\r?\n/).filter(Boolean);
if(manifest.length!==121) throw new Error(`manifest length ${manifest.length} != 121`);

const agg={papers:0,response_files:0,units:0,obligations:0,unresolved_obligations:0,existing_chunk_files:0,reconstructed_chunk_files:0,W0:0,W1:0,W2:0,certifiable:0};
const paperMetrics=[];
const candidates=[];
const missing=[];
for(let index=0;index<manifest.length;index++){
  const paper=manifest[index];
  const responseDir=path.join(dataRoot,paper,'response');
  if(!fs.existsSync(responseDir)){missing.push({index,paper,reason:'MISSING_RESPONSE_DIR'});continue;}
  const files=fs.readdirSync(responseDir).filter(f=>f.endsWith('.json')).sort();
  if(!files.length){missing.push({index,paper,reason:'NO_RESPONSE_JSON'});continue;}
  const pm={index,paper,response_files:0,units:0,obligations:0,unresolved:0,W0:0,W1:0,W2:0,certifiable:0,existing:0,reconstructed:0};
  for(const file of files){
    const raw=JSON.parse(fs.readFileSync(path.join(responseDir,file),'utf8'));
    const doc=ensureResponseChunks(raw);
    const mode=doc._r2_adapter?.mode||'UNKNOWN';
    if(mode==='EXISTING'){agg.existing_chunk_files++;pm.existing++;}
    if(mode==='RECONSTRUCTED'){agg.reconstructed_chunk_files++;pm.reconstructed++;}
    const rr=replayDocument(doc);
    pm.response_files++; agg.response_files++;
    pm.units+=rr.totalUnits; agg.units+=rr.totalUnits;
    pm.obligations+=rr.obligations.length; agg.obligations+=rr.obligations.length;
    const unres=rr.obligations.filter(o=>o.unresolved?.length).length;
    pm.unresolved+=unres; agg.unresolved_obligations+=unres;
    for(const g of rr.groups){
      pm[g.type]++; agg[g.type]++;
      if(g.certifiable){pm.certifiable++;agg.certifiable++;}
      candidates.push({index,paper,file,review_id:raw.review_id,type:g.type,certifiable:g.certifiable,reason:g.reason,items:g.items.map(o=>({text:o.text,norm:o.norm,alias:o.alias,G:o.G,unresolved:o.unresolved,semanticSignature:o.semanticSignature}))});
    }
  }
  agg.papers++; paperMetrics.push(pm);
}

function synthetic(reply,id){return {doc_name:`synthetic_${id}`,review_id:'v1_review0',response_chunk_nodes_by_quote:[{ix:`chunk_${id}`,quoted_review:'Please address the concern.',author_reply:reply}]};}
const positiveCases=[
  ['exact_duplicate_assertion_same_attachment_same_antecedent','The limitation is documented. The limitation is documented.','W0'],
  ['punctuation_alias_duplicate_assertion_same_attachment_same_antecedent','The limitation is documented. The limitation is documented!','W1'],
  ['exact_duplicate_revision_commitment_same_target','We will add an ablation discussion. We will add an ablation discussion.','W0']
];
const positiveControls=positiveCases.map(([name,reply,type])=>{const r=replayDocument(synthetic(reply,name));const hits=r.groups.filter(g=>g.type===type&&g.certifiable);return {name,expected_type:type,pass:hits.length>0,groups:r.groups.map(g=>({type:g.type,certifiable:g.certifiable,reason:g.reason,count:g.items.length}))};});
const regressionPapers=['emnlp24_doc387','emnlp24_doc739','emnlp24_doc1035','emnlp24_doc199','emnlp24_doc103','emnlp24_doc1043'];
const regressionControls=regressionPapers.map(p=>{const gs=candidates.filter(x=>x.paper===p);return {paper:p,candidates:gs.length,certifiable:gs.filter(x=>x.certifiable).length,pass:gs.every(x=>!x.certifiable)};});
const reasonCounts={};for(const c of candidates) reasonCounts[c.reason]=(reasonCounts[c.reason]||0)+1;
const result={phase:'KSGT Generation IX G9-P36-R2',compiler:CONTRACT.version,source:'Re3Align_v1.0 public archive / EMNLP24',manifest_papers:manifest.length,aggregate:agg,missing,reason_counts:reasonCounts,positive_controls:positiveControls,regression_controls:regressionControls,frontier_reopened:agg.certifiable>0,certifiable_witnesses:candidates.filter(x=>x.certifiable).map(x=>({index:x.index,paper:x.paper,file:x.file,review_id:x.review_id,type:x.type,reason:x.reason,items:x.items})) ,paper_metrics:paperMetrics};
if(missing.length) throw new Error(`missing papers: ${JSON.stringify(missing)}`);
if(!positiveControls.every(x=>x.pass)) throw new Error(`positive control failure: ${JSON.stringify(positiveControls)}`);
if(!regressionControls.every(x=>x.pass)) throw new Error(`R1 regression failure: ${JSON.stringify(regressionControls)}`);
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'full121_structural_replay.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'candidate_witnesses.json'),JSON.stringify(candidates,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'positive_controls.json'),JSON.stringify({positiveControls,regressionControls},null,2)+'\n');
console.log(JSON.stringify({aggregate:agg,reasonCounts,frontier_reopened:result.frontier_reopened,positiveControls,regressionControls},null,2));
