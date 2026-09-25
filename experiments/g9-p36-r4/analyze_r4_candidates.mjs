import fs from 'node:fs';
import path from 'node:path';
const dir=process.argv[2];if(!dir)throw new Error('usage: node analyze_r4_candidates.mjs <outdir>');
const rows=fs.readFileSync(path.join(dir,'candidates.jsonl'),'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const reason={},core={},witness={},classes={},unique=new Map();
for(const r of rows){
 for(const side of ['left','right']){
  const b=r.bcog?.[side],id=r.source_ids?.[side==='left'?0:1];if(id&&!unique.has(id))unique.set(id,b);
 }
 core[r.bcog?.core?.reason||'NONE']=(core[r.bcog?.core?.reason||'NONE']||0)+1;
 witness[r.bcog?.witness?.reason||'NONE']=(witness[r.bcog?.witness?.reason||'NONE']||0)+1;
}
let complete=0;
for(const b of unique.values()){
 const cl=b?.frame?.class||'UNBOUND';classes[cl]=(classes[cl]||0)+1;
 if(b?.representation_certificate?.pass)complete++;
 for(const x of b?.unresolved||[])reason[x]=(reason[x]||0)+1;
}
const out={candidate_pairs:rows.length,unique_candidate_obligations:unique.size,representation_complete_unique_obligations:complete,representation_complete_rate:unique.size?complete/unique.size:0,unresolved_reason_counts:reason,frame_class_counts:classes,core_compatibility_counts:core,controlled_witness_reason_counts:witness};
fs.writeFileSync(path.join(dir,'representation_audit.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
