'use strict';
const {works,arms}=require('./r7i_works.cjs');
const system='한국어 글쓰기 작업을 합니다. 확정된 사실과 허용된 추론·창작의 범위를 준수하세요. 독자의 목적과 장르에 맞는 자연스러운 원고를 작성하되, 제공하지 않은 사실을 임의로 확정하지 마세요.';
function source(w){return [w.genre,w.goal,'확정된 사실:',...w.facts,'허용 범위:',w.license].join('\n');}
function first(w,arm){if(!arms.includes(arm))throw Error('BAD_ARM');return [{role:'system',content:system},{role:'user',content:source(w)+'\n'+(arm==='PLAN'?'글을 쓰기 전에 내용과 설명 관계, 전달 순서를 구상한 계획을 작성하세요. 완성 원고는 아직 작성하지 마세요.':'구체적인 문장으로 이루어진 탐색 초고를 작성하세요. 지금 발견하는 연결을 활용해 글 전체를 일단 써 보세요.')}];}
function final(w,previous){if(typeof previous!=='string'||!previous.trim())throw Error('BAD_PREVIOUS');return [{role:'system',content:system},{role:'user',content:source(w)+'\n이전 작업물:\n'+previous+'\n이전 작업물이 사실의 근거가 되는 것은 아닙니다. 필요하다면 전체 구상과 표현을 바꾸어도 됩니다. 원천과 허용 범위 안에서 독자에게 실제로 전달할 완성 원고만 작성하세요. 별도의 제목, 평가, 해설은 출력하지 마세요.'}];}
function schedule(){return works.flatMap((w,i)=>(i%2?arms.slice().reverse():arms).map(arm=>({id:w.id+'__'+arm,work:w.id,arm,source:w})));}module.exports={source,first,final,schedule};
