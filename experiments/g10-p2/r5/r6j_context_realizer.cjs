'use strict';
// Bounded authored scene realization: labels are supplied, not inferred from prose.
const scenes=[
 {id:'corridor',setting:'복도는 고요했다.',facts:['서쪽 의자에는 유나가 앉아 있다.','동쪽 의자 등받이에만 가느다란 빛이 닿는다.','유나가 일어선다.'],actor:['서쪽 의자에 유나가 앉아 있었다.','유나는 서쪽 의자에 앉아 있었다.'],image:['가느다란 빛은 동쪽 의자 등받이에만 닿았다.','빛은 실처럼 가늘게 동쪽 의자 등받이에만 닿았다.'],event:['유나가 일어섰다.','유나는 자리에서 일어섰다.'],fused:'서쪽 의자에 앉아 있던 유나가 일어섰다.',bad:'가느다란 빛이 두 의자 위로 번졌다.'},
 {id:'shelf',setting:'작업실에는 책장이 놓여 있었다.',facts:['현수가 책장 왼쪽에 서 있다.','책장 오른쪽 칸에만 둥근 빛이 비친다.','현수가 책장을 닫는다.'],actor:['현수는 책장 왼쪽에 서 있었다.','책장 왼쪽에는 현수가 서 있었다.'],image:['둥근 빛은 오른쪽 칸에만 비쳤다.','동전처럼 둥근 빛이 오른쪽 칸에만 비쳤다.'],event:['현수가 책장을 닫았다.','현수는 책장을 닫았다.'],fused:'책장 왼쪽에 서 있던 현수가 책장을 닫았다.',bad:'둥근 빛이 현수의 얼굴까지 비쳤다.'},
 {id:'hall',setting:'대합실에는 두 안내판이 있었다.',facts:['지민은 첫 번째 안내판 옆에 서 있다.','두 번째 안내판에만 길쭉한 빛이 비친다.','지민이 돌아선다.'],actor:['지민은 첫 번째 안내판 옆에 서 있었다.','첫 번째 안내판 옆에는 지민이 서 있었다.'],image:['길쭉한 빛은 두 번째 안내판에만 비쳤다.','길쭉한 빛이 리본처럼 두 번째 안내판에만 비쳤다.'],event:['지민이 돌아섰다.','지민은 돌아섰다.'],fused:'첫 번째 안내판 옆에 서 있던 지민이 돌아섰다.',bad:'빛이 두 안내판 사이를 오갔다.'},
 {id:'room',setting:'방에는 왼쪽과 오른쪽에 창이 하나씩 있었다.',facts:['수민은 오른쪽 창 앞에 서 있다.','왼쪽 창틀에만 얇은 빛이 닿는다.','수민이 고개를 돌린다.'],actor:['수민은 오른쪽 창 앞에 서 있었다.','오른쪽 창 앞에는 수민이 서 있었다.'],image:['얇은 빛은 왼쪽 창틀에만 닿았다.','빛은 얇은 띠처럼 왼쪽 창틀에만 닿았다.'],event:['수민이 고개를 돌렸다.','수민은 고개를 돌렸다.'],fused:'오른쪽 창 앞에 서 있던 수민이 고개를 돌렸다.',bad:'빛이 수민의 눈을 비추었다.'}
];
const contexts=[{focus:'actor',figure:false},{focus:'image',figure:false},{focus:'actor',figure:true},{focus:'image',figure:true}];
function candidates(s){const out=[]; for(const order of [['actor','image'],['image','actor']])for(let a=0;a<2;a++)for(let i=0;i<2;i++)for(let e=0;e<2;e++){
 const p={actor:s.actor[a],image:s.image[i]}; out.push({order,figure:!!i,exact:true,text:[s.setting,...order.map(k=>p[k]),s.event[e]].join(' '),variants:[a,i,e],fused:false});
 }
 for(let i=0;i<2;i++)out.push({order:['image','actor'],figure:!!i,exact:true,text:[s.setting,s.image[i],s.fused].join(' '),variants:[-1,i,-1],fused:true});
 // Investigator-labelled scope violation, not automatic semantic detection.
 out.push({order:['image','actor'],figure:false,exact:false,text:[s.setting,s.bad,s.actor[0],s.event[0]].join(' '),variants:[0,-1,0],fused:false});return out;
}
function admissible(c,ctx){return c.exact&&(ctx.figure||!c.figure)}
const len=x=>Array.from(x.text).length;
function rank(s,ctx,{focusWeight=30,figureWeight=30,fusionWeight=0}={}){
 if(!contexts.some(c=>c.focus===ctx.focus&&c.figure===ctx.figure))throw Error('BAD_CONTEXT');
 const pool=candidates(s).filter(c=>admissible(c,ctx));const byLength=(a,b)=>len(a)-len(b)||a.text.localeCompare(b.text,'ko');
 const objective=c=>len(c)+(c.order[0]===ctx.focus?0:focusWeight)+(ctx.figure&&!c.figure?figureWeight:0)+(c.fused?0:fusionWeight);
 const shortest=pool.slice().sort(byLength)[0];const chosen=pool.slice().sort((a,b)=>objective(a)-objective(b)||byLength(a,b))[0];
 return {scene:s.id,ctx,candidates:pool.length,shortest,chosen,focusHit:chosen.order[0]===ctx.focus,figureHit:chosen.figure===ctx.figure,objective:objective(chosen)};
}
function receipt(){const rows=scenes.flatMap(s=>contexts.map(c=>rank(s,c)));return {authority:'DEVELOPMENT_AUTHORED_LABELS_ONLY',rows,counts:{cases:rows.length,allCandidates:scenes.reduce((n,s)=>n+candidates(s).length,0),shortestFocus:rows.filter(r=>r.shortest.order[0]===r.ctx.focus).length,adaptiveFocus:rows.filter(r=>r.focusHit).length,shortestFigure:rows.filter(r=>r.shortest.figure===r.ctx.figure).length,adaptiveFigure:rows.filter(r=>r.figureHit).length,shortestFused:rows.filter(r=>r.shortest.fused).length,adaptiveFused:rows.filter(r=>r.chosen.fused).length},sensitivity:[0,2,5,10,20,30].flatMap(focusWeight=>[0,2,5,10,20,30].map(figureWeight=>{const r=scenes.flatMap(s=>contexts.map(c=>rank(s,c,{focusWeight,figureWeight})));return {focusWeight,figureWeight,focusHits:r.filter(x=>x.focusHit).length,figureHits:r.filter(x=>x.figureHit).length}}))}}
module.exports={scenes,contexts,candidates,admissible,rank,receipt};
if(require.main===module)console.log(JSON.stringify(receipt(),null,2));
