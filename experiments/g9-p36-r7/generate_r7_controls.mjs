import fs from 'node:fs';
import {compileBCOG} from '../g9-p36-r4/compiler_bcog_r4.mjs';
import {analyzeObserved,LAW} from './motif_r7.mjs';

const out=process.argv[2];if(!out)throw new Error('usage: node generate_r7_controls.mjs <out>');
const G=(chunk='c',role='REVISION_COMMITMENT')=>({review_root:'review::r7',response_chunk_id:chunk,structural_role:role,block_type:'PROSE',attachment_key:'a',antecedent_key:null,local_scope_key:'s'});
const item=(id,paper,text,g=G(id))=>({id,paper,text,bcog:compileBCOG(text,g)});

const positives=[
 item('p1a','P1','We will add a detailed error analysis appendix.'),item('p1b','P2','We will add a detailed error analysis section.'),
 item('p2a','P3','We will include a comprehensive robustness analysis appendix.'),item('p2b','P4','We will include a comprehensive robustness analysis table.'),
 item('p3a','P5','We will provide a careful qualitative error analysis.'),item('p3b','P6','We will provide a careful qualitative error discussion.'),
 item('p4a','P7','We will discuss a detailed limitation analysis appendix.'),item('p4b','P8','We will discuss a detailed limitation analysis section.')
];
const pos=analyzeObserved(positives);

const lexical=[
 item('l1a','L1','We will add a detailed analysis discussion.'),item('l1b','L2','We will add a detailed analysis appendix.'),
 item('l2a','L3','We will add a detailed robustness discussion.'),item('l2b','L4','We will add a qualitative robustness appendix.'),
 item('l3a','L5','We will add a detailed error analysis.'),item('l3b','L6','We will add a detailed error analysis appendix.'),
 item('l4a','L7','We will add a detailed error analysis appendix.'),item('l4b','L8','We will add a detailed error analysis appendix!')
];
const lex=analyzeObserved(lexical);

const coreNeg=[
 item('c1a','C1','We will add a detailed error analysis appendix.'),item('c1b','C2','We will revise a detailed error analysis section.'),
 item('c2a','C3','We will add a detailed error analysis appendix.'),item('c2b','C4','We may add a detailed error analysis section.'),
 item('c3a','C5','Under setting S, we will add a detailed error analysis appendix.'),item('c3b','C6','Under setting T, we will add a detailed error analysis section.'),
 item('c4a','C7','Model A is a detailed error analysis baseline.',G('ca','ASSERTION')),item('c4b','C8','Model B is a detailed error analysis baseline.',G('cb','ASSERTION')),
 item('c5a','C9','Model A has latency 12 ms.',G('cc','ASSERTION')),item('c5b','C10','Model A has latency 20 ms.',G('cd','ASSERTION')),
 item('c6a','C11','These results show a detailed error analysis trend.',G('ce','ASSERTION')),item('c6b','C12','These results indicate a detailed error analysis trend.',G('cf','ASSERTION'))
];
const cn=analyzeObserved(coreNeg);

function brute(items){
 const xs=items.map(x=>({x,q:x.bcog.representation_certificate?.pass?x.bcog:null})).filter(z=>z.q);
 let exploratory=0,chain=0,primary=0;
 const norm=s=>s.normalize('NFKC').toLowerCase().replace(/[“”‘’"'.,;:!?()[\]{}*_]+/g,' ').replace(/\s+/g,' ').trim();
 const big=b=>new Set((b.atoms||[]).filter(a=>a.startsWith('ROLE:ARG1:BIGRAM:')).map(a=>a.slice('ROLE:ARG1:BIGRAM:'.length)));
 const content=b=>new Set((b.atoms||[]).filter(a=>a.startsWith('ROLE:ARG1:')));
 const core=b=>JSON.stringify({class:b.frame?.class,predicate:b.frame?.predicate,arg0:b.frame?.arg0_canon,authority:b.frame?.authority,polarity:b.force?.polarity,modal:b.force?.modal,quantifiers:[...(b.force?.quantifiers||[])].sort(),condition:String(b.force?.condition||'NONE').toLowerCase(),values:(b.values?.bindings||[]).map(v=>JSON.stringify(v)).sort()});
 const chainExists=E=>{const p=[...E].map(e=>e.split('>'));return p.some(([a,b])=>p.some(([c,d])=>b===c));};
 for(let i=0;i<xs.length;i++)for(let j=i+1;j<xs.length;j++){const A=xs[i].x,B=xs[j].x;if(core(A.bcog)!==core(B.bcog))continue;if(norm(A.text)===norm(B.text))continue;const ae=big(A.bcog),be=big(B.bcog),sh=[...ae].filter(e=>be.has(e));if(!sh.length)continue;const ac=content(A.bcog),bc=content(B.bcog);const lu=[...ac].some(x=>!bc.has(x)),ru=[...bc].some(x=>!ac.has(x));if(!lu||!ru)continue;exploratory++;const ch=sh.length>=2&&chainExists(new Set(sh));if(ch){chain++;if(A.paper!==B.paper)primary++;}}
 return {exploratory_edge_recurrence_pairs:exploratory,connected_chain_pairs_any_paper:chain,primary_cross_paper_connected_chain_pairs:primary};
}
const brutePos=brute(positives),bruteLex=brute(lexical),bruteCore=brute(coreNeg);
const validation={
 positive_chain:pos.stats.primary_cross_paper_connected_chain_pairs===4,
 lexical_collision_rejected:lex.stats.primary_cross_paper_connected_chain_pairs===0,
 protected_core_rejected:cn.stats.exploratory_edge_recurrence_pairs===0,
 metamorphic_exact_surface_excluded:!lex.witnesses.some(x=>x.left.id==='l4a'||x.right.id==='l4b'),
 indexed_bruteforce_positive:JSON.stringify({e:pos.stats.exploratory_edge_recurrence_pairs,c:pos.stats.connected_chain_pairs_any_paper,p:pos.stats.primary_cross_paper_connected_chain_pairs})===JSON.stringify({e:brutePos.exploratory_edge_recurrence_pairs,c:brutePos.connected_chain_pairs_any_paper,p:brutePos.primary_cross_paper_connected_chain_pairs}),
 indexed_bruteforce_lexical:JSON.stringify({e:lex.stats.exploratory_edge_recurrence_pairs,c:lex.stats.connected_chain_pairs_any_paper,p:lex.stats.primary_cross_paper_connected_chain_pairs})===JSON.stringify({e:bruteLex.exploratory_edge_recurrence_pairs,c:bruteLex.connected_chain_pairs_any_paper,p:bruteLex.primary_cross_paper_connected_chain_pairs}),
 indexed_bruteforce_core:JSON.stringify({e:cn.stats.exploratory_edge_recurrence_pairs,c:cn.stats.connected_chain_pairs_any_paper,p:cn.stats.primary_cross_paper_connected_chain_pairs})===JSON.stringify({e:bruteCore.exploratory_edge_recurrence_pairs,c:bruteCore.connected_chain_pairs_any_paper,p:bruteCore.primary_cross_paper_connected_chain_pairs})
};
validation.pass=Object.values(validation).every(Boolean);
const result={law:LAW,positive:pos.stats,lexical_negative:lex.stats,core_negative:cn.stats,bruteforce:{positive:brutePos,lexical:bruteLex,core:bruteCore},validation};
fs.mkdirSync(new URL('./final/',import.meta.url),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!validation.pass)process.exitCode=2;
