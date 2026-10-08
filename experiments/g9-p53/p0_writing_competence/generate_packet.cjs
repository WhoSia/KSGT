'use strict';
const crypto=require('node:crypto'),src=require('./source_briefs.json');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const common='다음 자료에서 벗어나지 않는 한국어 본문 두 문단을 작성하세요. 제목, 번호, 설명용 메타 텍스트 없이 완성된 글만 출력하세요. 사실과 관찰의 확실성 정도를 임의로 높이지 마세요. 제공된 사실을 그대로 나열할 필요는 없지만 사실을 바꾸어서는 안 됩니다.';
function form(b,arm){
 if(!['B','U','K'].includes(arm))throw Error('INVALID_ARM');
 let s=common+'\n글의 종류: '+b.genre+'\n요청: '+b.task+'\n출처 사실:\n'+b.facts.map((x,i)=>String(i+1)+'. '+x).join('\n');
 if(arm==='U')s+='\n평범한 문단 계획: '+b.constraints.discourse+'\n문맥에서 혼동하지 말아야 할 대상: '+b.constraints.reference+'\n어울리는 문체: '+b.constraints.register+'\n반드시 보존할 표현: '+b.constraints.must_preserve.join(', ')+'\n피해야 할 단정: '+b.constraints.forbid.join('; ')+'\n같은 뜻을 여러 방식으로 말할 수 있으면 자연스러운 흐름에 맞는 하나를 고르세요. 정체가 알려지지 않은 대상은 임의로 특정하지 마세요.';
 if(arm==='K')s+='\nKSGT 유형화 계획 (새로운 사실을 추가하지 않음):\n담화 관계: '+b.constraints.discourse+'\n참조/정보구조 조건: '+b.constraints.reference+'\n종결 및 장르 제약: '+b.constraints.register+'\n원문 보존 증거: '+b.constraints.must_preserve.join(', ')+'\n금지된 사실 승격: '+b.constraints.forbid.join('; ')+'\n동일 의미의 표현이 여러 개 가능하면 자연스러운 문단 흐름에 맞는 하나를 선택하세요. 불확실한 개체의 정체성을 임의로 채우지 마세요.';
 return s;
}
function packet(){
 const arms=['B','U','K'],items=src.briefs.flatMap(b=>arms.map(arm=>({id:b.id,arm,genre:b.genre,source_sha256:sha(JSON.stringify(b)),prompt:form(b,arm)})));
 return {schema:'ksgt.g9.p53.p0.capability-gated-writing-packet.v1',status:'INSTRUMENT_ONLY_NO_MODEL_OUTPUTS',source_status:src.status,
 conditions:{B:'FACTS_ONLY',U:'SAME_INFORMATION_IN_PLAIN_PROSE_PLAN',K:'KSGT_TYPED_DISCOURSE_REFERENCE_AND_PRESERVATION_PLAN'},
 invariants:{model_checkpoint:'SAME_ACROSS_ARMS_AND_FIXED_BEFORE_EXECUTION',decoding:'SAME_BUDGET_SEED_TEMPERATURE_AND_DECODE_CONFIG',input_facts:'IDENTICAL_ACROSS_ARMS',U_K_information:'MATCHED_FACTS_AND_PLANNING_CONSTRAINTS_FORMAT_DIFFERS',order:'RANDOMIZED_AND_BLINDED_BEFORE_READER_EVALUATION',preservation:'HARD_NONCOMPENSATORY',human_rating:'NONE_AUTHORIZED_AT_CURRENT_STAGE',premature_superiority_claim:false},
 evaluation_contract:{pretest:'MODEL_COMPETENCE_AND_PLAIN_KOREAN_PARAGRAPHS_BEFORE_ANY_KSGT_EFFECT_TEST',units:'DOCUMENTS_NOT_SENTENCES',mechanical_metrics:['paragraph_count','source_atom_presence_diagnostic','fabricated_protected_values_manual_review','output_meta_text'],independent_semantics:'NOT_COLLECTED',naturalness:'NOT_COLLECTED',operator_cost:'TOKENS_AND_LATENCY_REQUIRE_INSTRUMENTATION'},
 briefs:src.briefs.length,prompts:items.length,source_sha256:sha(JSON.stringify(src)),items};
}
module.exports={form,packet,sha};