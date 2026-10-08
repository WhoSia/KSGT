'use strict';
// G9-P53 offline F/E/L/W writing contract; declarations are not author authentication.
const crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const modes={science:['NONE','MARKED_HYPOTHESIS'],narrative:['NONE','AMBIENCE_ONLY','SCENE_TEXTURE'],argument:['NONE','RHETORIC_ONLY']};
const textOK=x=>typeof x==='string'&&x.trim()===x&&x.length>0&&!/[\r\n]/u.test(x);
const uniq=a=>new Set(a).size===a.length;
function compile(b){
 if(!b||!textOK(b.id)||!Object.hasOwn(modes,b.genre)||!textOK(b.task))throw Error('INVALID_BRIEF_ID_GENRE_OR_TASK');
 const {F,E,L,W,plan}=b;
 if(!Array.isArray(F)||F.length<3||F.length>12||F.some(f=>!f||!textOK(f.id)||!textOK(f.text))||!uniq(F.map(f=>f.id)))throw Error('INVALID_PROTECTED_FACTS');
 if(!E||!Array.isArray(E.unknown)||!Array.isArray(E.hypotheses)||[...E.unknown,...E.hypotheses].some(x=>!textOK(x)))throw Error('INVALID_EPISTEMIC_STATE');
 if(!L||!modes[b.genre].includes(L.mode)||!Array.isArray(L.allowed)||!Array.isArray(L.forbidden)||[...L.allowed,...L.forbidden].some(x=>!textOK(x)))throw Error('INVALID_CREATIVE_LICENSE');
 if(L.mode==='NONE'&&L.allowed.length)throw Error('NONE_MODE_CANNOT_GRANT_ADDITIONS');
 if(b.genre==='science'&&L.mode==='MARKED_HYPOTHESIS'&&E.hypotheses.length===0)throw Error('NO_LICENSED_HYPOTHESIS');
 if(!W||W.declared!==true||!textOK(W.perspective)||!textOK(W.register)||!textOK(W.goal)||!['KEEP','CLARIFY','CONTEXTUAL'].includes(W.reference_policy))throw Error('UNCONFIRMED_WRITER_OBJECTIVE');
 if(!plan||!Array.isArray(plan.sections)||plan.sections.length!==2||plan.sections.some(s=>!s||!textOK(s.role)||!Array.isArray(s.facts)||s.facts.length<1||s.facts.some(x=>!textOK(x))))throw Error('INVALID_PLAN');
 const ids=F.map(x=>x.id),planned=plan.sections.flatMap(x=>x.facts);
 if(planned.some(x=>!ids.includes(x))||!uniq(planned)||planned.length!==ids.length)throw Error('FACT_PLAN_COVERAGE_OR_DUPLICATION');
 const common={task:b.task,genre:b.genre,F:F.map(f=>({id:f.id,text:f.text})),E:{unknown:[...E.unknown],hypotheses:[...E.hypotheses]},L:{mode:L.mode,allowed:[...L.allowed],forbidden:[...L.forbidden]},W:{perspective:W.perspective,register:W.register,goal:W.goal,reference_policy:W.reference_policy}};
 const planAtoms=plan.sections.map((s,i)=>({section:i+1,role:s.role,facts:[...s.facts]}));
 return {id:b.id,common,planAtoms,common_sha256:sha(common),plan_sha256:sha(planAtoms)};
}
function shared(c){let x=c.common;
 return '한국어 글쓰기: '+x.task+'\n장르: '+x.genre+'\n원문 사실(추가·삭제·역전 금지):\n'+x.F.map(f=>f.id+': '+f.text).join('\n')+
 '\n알려지지 않은 사항: '+(x.E.unknown.join(' / ')||'없음')+
 '\n가설로만 다룰 수 있는 사항: '+(x.E.hypotheses.join(' / ')||'없음')+
 '\n창작 허용 모드: '+x.L.mode+
 '\n허용된 표현 확장: '+(x.L.allowed.join(' / ')||'없음')+
 '\n금지된 표현 확장: '+(x.L.forbidden.join(' / ')||'없음')+
 '\n글쓴이 목표: '+x.W.goal+'\n시점: '+x.W.perspective+'\n문체: '+x.W.register+
 '\n지시 표현 방침: '+x.W.reference_policy+
 '\n출처에 없는 관찰을 실제 관찰로 쓰지 말고, 금지된 정보는 만들어내지 마세요. 충분한 한국어 본문 두 문단을 쓰되, 제목·번호·메타 설명을 출력하지 마세요.';
}
function planText(c,arm){
 if(arm==='B')return '';
 if(arm==='U')return '\n보통말 문단 설계:\n'+c.planAtoms.map(x=>x.section+'문단의 역할은 '+x.role+'입니다. 이 문단은 '+x.facts.join(', ')+'의 내용을 다룹니다.').join('\n');
 if(arm==='K')return '\nKSGT 구조화 문단 설계:\n'+c.planAtoms.map(x=>'문단='+x.section+'; 담화역할='+x.role+'; 사실참조=['+x.facts.join(', ')+']').join('\n');
 throw Error('UNKNOWN_ARM');
}
function packet(briefs){
 if(!Array.isArray(briefs)||!briefs.length)throw Error('EMPTY_PACKET');
 const cases=briefs.map(compile);if(!uniq(cases.map(x=>x.id)))throw Error('DUPLICATE_BRIEF_ID');
 const entries=cases.flatMap(c=>['B','U','K'].map(arm=>({id:c.id,arm,prompt:shared(c)+planText(c,arm),common_sha256:c.common_sha256,plan_sha256:c.plan_sha256,source_ids:c.common.F.map(f=>f.id),creative_mode:c.common.L.mode})));
 return {schema:'ksgt.g9-p53.genre-authority.v0.1',class:'DEVELOPMENT_INSTRUMENT_NO_MODEL_RESULTS',n_briefs:cases.length,n_prompts:entries.length,conditions:{B:'identical_source_and_warrant_no_plan',U:'same_plan_atoms_in_ordinary_text',K:'same_plan_atoms_in_typed_form'},entries,verdict:'NOT_TESTED'};
}
module.exports={compile,shared,planText,packet,sha};
