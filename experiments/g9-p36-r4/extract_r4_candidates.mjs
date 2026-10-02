import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {compileBCOG,compatibleCore,controlledFusionWitness} from './compiler_bcog_r4.mjs';

const [dataRoot,adapterPath,compilerPath,outDir]=process.argv.slice(2);
if(!dataRoot||!adapterPath||!compilerPath||!outDir)throw new Error('usage: node extract_r4_candidates.mjs <archive-root> <adapter> <r2compiler> <outdir>');
const {ensureResponseChunks}=await import(pathToFileURL(path.resolve(adapterPath)).href);
const {replayDocument,normalize}=await import(pathToFileURL(path.resolve(compilerPath)).href);
const manifest=fs.readFileSync('experiments/g9-p36-r2/calibration121_manifest.txt','utf8').trim().split(/\r?\n/).filter(Boolean);
const wanted=new Set(manifest),paperDirs=new Map();
function discover(dir,depth=0){if(depth>8||paperDirs.size===wanted.size)return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(!e.isDirectory())continue;const p=path.join(dir,e.name);if(wanted.has(e.name)){paperDirs.set(e.name,p);continue;}discover(p,depth+1);}}
discover(dataRoot);
const STOP=new Set('a an the and or but if then than to of in on at for from with without by as is are was were be been being do does did have has had can could may might must should would will this that these those it they we our you your reviewer authors paper work study result results'.split(/\s+/));
const TOK=s=>(normalize(s).match(/[\p{L}\p{N}_+%.-]+/gu)||[]).filter(x=>!STOP.has(x)&&x.length>2);
const uniq=a=>[...new Set(a)];
function r3Atoms(o){const g=o.graph||{},f=g.F||{},v=g.V||{},act=g.ACTION||null,a=[];(g.A||[]).forEach((x,i)=>a.push(`A:${i}:${x}`));(g.R||[]).forEach((x,i)=>a.push(`R:${i}:${x}`));for(const k of ['polarity','modal','comparator','condition'])if(f[k]!=null)a.push(`F:${k}:${f[k]}`);(v.entities||[]).forEach((x,i)=>a.push(`V:entity:${i}:${x}`));(v.values||[]).forEach((x,i)=>a.push(`V:value:${i}:${x}`));if(act){a.push(`ACTION:verb:${act.verb}`);(act.object||[]).forEach((x,i)=>a.push(`ACTION:object:${i}:${x}`));}return uniq(a);}
function exactOrAlias(a,b){const c=s=>normalize(s).replace(/[\s\"'“”‘’.,;:!?()[\]{}*_]+/g,' ').trim();return normalize(a.text)===normalize(b.text)||c(a.text)===c(b.text);}
function grounding(o){return {review_root:o.G.review_root,response_chunk_id:o.G.response_chunk_id,structural_role:o.G.structural_role,block_type:o.G.block_type,attachment_key:o.G.attachment_key,antecedent_key:o.G.antecedent_key,local_scope_key:o.G.local_scope_key};}
function sameGround(a,b){return a.review_root===b.review_root&&a.response_chunk_id===b.response_chunk_id&&a.structural_role===b.structural_role&&a.block_type==='PROSE'&&b.block_type==='PROSE'&&a.attachment_key===b.attachment_key&&a.antecedent_key===b.antecedent_key;}
const candidates=[];let response_files=0,obligations=0,unresolved_obligations=0,eligible=0,repCompletePairs=0,roundtrip=0;
for(const paper of manifest){
 const pd=paperDirs.get(paper),rd=pd?path.join(pd,'response'):null;if(!rd||!fs.existsSync(rd))continue;
 for(const file of fs.readdirSync(rd).filter(x=>x.endsWith('.json')).sort()){
  response_files++;const raw=JSON.parse(fs.readFileSync(path.join(rd,file),'utf8')),doc=ensureResponseChunks(raw),rr=replayDocument(doc),obs=rr.obligations;
  obligations+=obs.length;unresolved_obligations+=obs.filter(x=>x.unresolved?.length).length;
  for(let i=0;i<obs.length;i++)for(let j=i+1;j<Math.min(obs.length,i+7);j++){
   const a=obs[i],b=obs[j];if(a.G.response_chunk_id!==b.G.response_chunk_id)continue;
   if(!['ASSERTION','REVISION_COMMITMENT'].includes(a.G.structural_role)||a.G.structural_role!==b.G.structural_role)continue;
   if(a.unresolved?.length||b.unresolved?.length||exactOrAlias(a,b))continue;
   const ra=new Set(r3Atoms(a)),rb=new Set(r3Atoms(b)),shared=[...ra].filter(x=>rb.has(x));if(shared.length<2)continue;eligible++;
   const ga=grounding(a),gb=grounding(b),A=compileBCOG(a.text,ga),B=compileBCOG(b.text,gb);
   const repPass=A.representation_certificate?.pass&&B.representation_certificate?.pass;if(repPass)repCompletePairs++;
   const core=compatibleCore(A,B),sa=new Set(A.atoms||[]),sb=new Set(B.atoms||[]);
   const left=[...sa].filter(x=>!sb.has(x)),right=[...sb].filter(x=>!sa.has(x)),inter=[...sa].filter(x=>sb.has(x));
   const subset=(left.length===0&&right.length>0)||(right.length===0&&left.length>0);
   let op=subset?'S1_SUBSUMPTION':'F1_CONJUNCTIVE_FUSION',witness={pass:false,reason:'NOT_ATTEMPTED'};
   if(repPass&&sameGround(ga,gb)&&core.pass&&!subset){witness=controlledFusionWitness(A,B);if(witness.pass)roundtrip++;}
   let fused=[...new Set([...sa,...sb])].sort(),gain=Number.NEGATIVE_INFINITY,controlled_text=null;
   if(subset){const keep=left.length===0?b.text:a.text;gain=a.text.length+b.text.length+1-keep.length;controlled_text=keep;}
   else if(witness.pass){gain=witness.gain_chars;controlled_text=witness.text;}
   const forceCompatible=core.pass;
   candidates.push({
    id:`${paper}|${file}|${i}|${j}`,paper,file,review_id:raw.review_id,indices:[i,j],operation:op,
    source_ids:[`${a.G.response_chunk_id}#${i}`,`${b.G.response_chunk_id}#${j}`],source_texts:[a.text,b.text],
    source_obligation_atoms:[A.atoms||[],B.atoms||[]],shared_atoms:inter,left_unique_atoms:left,right_unique_atoms:right,fused_obligation_atoms:fused,
    grounding:{compatible:sameGround(ga,gb),left:ga,right:gb},
    force_compatible:forceCompatible,
    representation_sufficiency:{left:A.representation_certificate||{pass:false},right:B.representation_certificate||{pass:false},pass:!!repPass,left_unresolved:A.unresolved||[],right_unresolved:B.unresolved||[]},
    bcog:{left:A,right:B,core,witness:{pass:witness.pass,reason:witness.reason,text:controlled_text}},
    compression:{source_chars:a.text.length+b.text.length+1,fused_ir_chars:controlled_text?controlled_text.length:999999999,gain_chars:Number.isFinite(gain)?gain:-999999999},
    source_norms:[normalize(a.text),normalize(b.text)]
   });
  }
 }
}
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'candidates.jsonl'),candidates.map(x=>JSON.stringify(x)).join('\n')+(candidates.length?'\n':''));
const summary={phase:'G9-P36-R4',compiler:'C3-R4-BCOG-v1',papers_discovered:paperDirs.size,response_files,obligations,unresolved_obligations,eligible_pair_windows:eligible,candidates:candidates.length,representation_complete_pairs:repCompletePairs,controlled_roundtrip_witnesses:roundtrip};
fs.writeFileSync(path.join(outDir,'extraction_summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
