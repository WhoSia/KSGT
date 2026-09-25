import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [dataRoot,adapterPath,compilerPath,outDir]=process.argv.slice(2);
if(!dataRoot||!adapterPath||!compilerPath||!outDir) throw new Error('usage: node extract_fusion_candidates.mjs <archive-root> <adapter> <compiler> <outdir>');
const {ensureResponseChunks}=await import(pathToFileURL(path.resolve(adapterPath)).href);
const {replayDocument,normalize}=await import(pathToFileURL(path.resolve(compilerPath)).href);
const manifest=fs.readFileSync('experiments/g9-p36-r2/calibration121_manifest.txt','utf8').trim().split(/\r?\n/).filter(Boolean);
const wanted=new Set(manifest),paperDirs=new Map();
function discover(dir,depth=0){
  if(depth>8||paperDirs.size===wanted.size)return;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(!e.isDirectory())continue;
    const p=path.join(dir,e.name);
    if(wanted.has(e.name)){paperDirs.set(e.name,p);continue;}
    discover(p,depth+1);
  }
}
discover(dataRoot);

const STOP=new Set('a an the and or but if then than to of in on at for from with without by as is are was were be been being do does did have has had can could may might must should would will this that these those it they we our you your reviewer authors paper work study result results'.split(/\s+/));
const TOK=s=>(normalize(s).match(/[\p{L}\p{N}_+%.-]+/gu)||[]).filter(x=>x.length>2&&!STOP.has(x));
const uniq=a=>[...new Set(a)];
function typedAtoms(o){
  const g=o.graph||{}, f=g.F||{}, v=g.V||{}, act=g.ACTION||null, atoms=[];
  (g.A||[]).forEach((x,i)=>atoms.push(`A:${i}:${x}`));
  (g.R||[]).forEach((x,i)=>atoms.push(`R:${i}:${x}`));
  for(const k of ['polarity','modal','comparator','condition']) if(f[k]!=null) atoms.push(`F:${k}:${f[k]}`);
  (v.entities||[]).forEach((x,i)=>atoms.push(`V:entity:${i}:${x}`));
  (v.values||[]).forEach((x,i)=>atoms.push(`V:value:${i}:${x}`));
  if(act){
    atoms.push(`ACTION:verb:${act.verb}`);
    (act.object||[]).forEach((x,i)=>atoms.push(`ACTION:object:${i}:${x}`));
  }
  return uniq(atoms);
}
function protectedSignature(o){
  return JSON.stringify({
    F:o.graph?.F||null,
    V:o.graph?.V||null,
    ACTION:o.graph?.ACTION||null,
    role:o.G?.structural_role||null,
    review:o.G?.review_root||null,
    chunk:o.G?.response_chunk_id||null,
    attachment:o.G?.attachment_key||null,
    antecedent:o.G?.antecedent_key||null,
    block:o.G?.block_type||null
  });
}
function groundingCompatible(a,b){
  return a.G.review_root===b.G.review_root &&
    a.G.response_chunk_id===b.G.response_chunk_id &&
    a.G.structural_role===b.G.structural_role &&
    a.G.block_type==='PROSE' && b.G.block_type==='PROSE' &&
    a.G.attachment_key===b.G.attachment_key &&
    a.G.antecedent_key===b.G.antecedent_key;
}
function forceCompatible(a,b){
  return JSON.stringify(a.graph?.F||{})===JSON.stringify(b.graph?.F||{}) &&
    JSON.stringify(a.graph?.V||{})===JSON.stringify(b.graph?.V||{}) &&
    JSON.stringify(a.graph?.ACTION||null)===JSON.stringify(b.graph?.ACTION||null);
}
function setRelation(a,b){
  const A=new Set(typedAtoms(a)),B=new Set(typedAtoms(b));
  const shared=[...A].filter(x=>B.has(x));
  const left=[...A].filter(x=>!B.has(x));
  const right=[...B].filter(x=>!A.has(x));
  return {shared,left,right,A:[...A],B:[...B]};
}
function exactOrAlias(a,b){
  const canon=s=>normalize(s).replace(/[\s\"'“”‘’.,;:!?()[\]{}*_]+/g,' ').trim();
  return normalize(a.text)===normalize(b.text)||canon(a.text)===canon(b.text);
}
function representationSufficient(o){
  // Fail closed when the frozen R2 graph visibly discards relation/binding complexity.
  // The kernel may only certify the MNMC projection when every substantive lexical
  // content token is represented somewhere in A/R/V/ACTION.
  const textTokens=uniq(TOK(o.text));
  const represented=new Set([
    ...(o.graph?.A||[]),...(o.graph?.R||[]),
    ...(o.graph?.V?.entities||[]),...(o.graph?.V?.values||[]),
    ...(o.graph?.ACTION?.object||[])
  ]);
  const missing=textTokens.filter(t=>!represented.has(t) && !['assert','none','pos'].includes(t));
  return {pass:missing.length===0,missing};
}

const candidates=[],metrics=[];
let sourceFiles=0, obligations=0, unresolved=0, eligible=0;
for(let pi=0;pi<manifest.length;pi++){
  const paper=manifest[pi],pd=paperDirs.get(paper),rd=pd?path.join(pd,'response'):null;
  if(!rd||!fs.existsSync(rd)) continue;
  for(const file of fs.readdirSync(rd).filter(x=>x.endsWith('.json')).sort()){
    sourceFiles++;
    const raw=JSON.parse(fs.readFileSync(path.join(rd,file),'utf8')),doc=ensureResponseChunks(raw),rr=replayDocument(doc);
    obligations+=rr.obligations.length; unresolved+=rr.obligations.filter(x=>x.unresolved?.length).length;
    const obs=rr.obligations;
    for(let i=0;i<obs.length;i++) for(let j=i+1;j<Math.min(obs.length,i+7);j++){
      const a=obs[i],b=obs[j];
      if(a.G.response_chunk_id!==b.G.response_chunk_id) continue;
      if(!['ASSERTION','REVISION_COMMITMENT'].includes(a.G.structural_role)||a.G.structural_role!==b.G.structural_role) continue;
      if(a.unresolved?.length||b.unresolved?.length) continue;
      if(exactOrAlias(a,b)) continue;
      const rel=setRelation(a,b);
      if(rel.shared.length<2) continue;
      eligible++;
      const rsA=representationSufficient(a),rsB=representationSufficient(b);
      const subsetAB=rel.left.length===0&&rel.right.length>0;
      const subsetBA=rel.right.length===0&&rel.left.length>0;
      const op=(subsetAB||subsetBA)?'S1_SUBSUMPTION':'F1_CONJUNCTIVE_FUSION';
      const fused=uniq([...rel.A,...rel.B]).sort();
      const sourceChars=a.text.length+b.text.length+1;
      const fusedChars=JSON.stringify(fused).length;
      candidates.push({
        id:`${paper}|${file}|${i}|${j}`,paper,file,review_id:raw.review_id,
        indices:[i,j],operation:op,
        source_ids:[`${a.G.response_chunk_id}#${i}`,`${b.G.response_chunk_id}#${j}`],
        source_texts:[a.text,b.text],
        source_obligation_atoms:[rel.A,rel.B],
        shared_atoms:rel.shared,left_unique_atoms:rel.left,right_unique_atoms:rel.right,
        fused_obligation_atoms:fused,
        grounding:{compatible:groundingCompatible(a,b),left:a.G,right:b.G},
        force_compatible:forceCompatible(a,b),
        representation_sufficiency:{left:rsA,right:rsB,pass:rsA.pass&&rsB.pass},
        protected_signatures:[protectedSignature(a),protectedSignature(b)],
        compression:{source_chars:sourceChars,fused_ir_chars:fusedChars,gain_chars:sourceChars-fusedChars},
        source_norms:[normalize(a.text),normalize(b.text)]
      });
    }
  }
  metrics.push({paper:pi,name:paper});
}
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'candidates.jsonl'),candidates.map(x=>JSON.stringify(x)).join('\n')+(candidates.length?'\n':''));
fs.writeFileSync(path.join(outDir,'extraction_summary.json'),JSON.stringify({
  phase:'G9-P36-R3',papers_discovered:paperDirs.size,response_files:sourceFiles,
  obligations,unresolved_obligations:unresolved,eligible_pair_windows:eligible,candidates:candidates.length,
  operation_counts:Object.fromEntries(['S1_SUBSUMPTION','F1_CONJUNCTIVE_FUSION'].map(k=>[k,candidates.filter(x=>x.operation===k).length])),
  representation_sufficient_candidates:candidates.filter(x=>x.representation_sufficiency.pass).length
},null,2)+'\n');
console.log(JSON.stringify({papers:paperDirs.size,response_files:sourceFiles,obligations,unresolved,eligible,candidates:candidates.length,representation_sufficient:candidates.filter(x=>x.representation_sufficiency.pass).length},null,2));
