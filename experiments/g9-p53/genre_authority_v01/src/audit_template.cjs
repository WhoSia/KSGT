'use strict';
const {compile,sha}=require('./genre_contract.cjs');
function make(brief){
 const c=compile(brief),base=c.common;
 return {schema:'ksgt.g9p53.genre_writer_review.v0.1',source_id:c.id,common_sha256:c.common_sha256,
 facts:base.F.map(f=>({id:f.id,question:'출력이 출처 사실 '+f.id+'('+f.text+')을 보존하는가?',answer:'UNADJUDICATED'})),
 epistemic:base.E.unknown.map((x,i)=>({id:'E'+(i+1),question:"출력이 미확인 '"+x+"'을 확인된 사실로 승격하는가?",answer:'UNADJUDICATED'})),
 creative:{mode:base.L.mode,allowed:base.L.allowed,forbidden:base.L.forbidden,question:'새 묘사가 글쓴이가 허용한 L 안에 있으며 F/E를 침해하지 않는가?',answer:'UNADJUDICATED'},
 writer:{perspective:base.W.perspective,register:base.W.register,reference_policy:base.W.reference_policy,question:'글쓴이의 명시한 시점·장르·참조 목표에 맞는가?',answer:'UNADJUDICATED'},
 formatting:{paragraph_requirement:2,answer:'UNADJUDICATED'},
 editorial_burden:{observed_human_edits:null,editor_provenance:'NONE',answer:'NOT_COLLECTED'},
 derived_verdict:'NO_MODEL_OUTPUT_EVALUATED',source_sha256:sha(base.F)};
}
module.exports={make};
