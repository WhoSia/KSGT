"use strict";
/** G9-P59 v0.5: constructed source-scene families, not independent Korean gold. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const hash = obj => crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
const scenes = Object.freeze([
  {id:'fair', family:'school-fair', split:'development', genre:'report', groups:[['science','과학 동아리 학생',12],['math','수학 동아리 학생',8]], action:'직접 제작한 장치를 소개했다', selected:4},
  {id:'library', family:'library-workshop', split:'development', genre:'report', groups:[['reading','독서 모임 참가자',10],['writing','글쓰기 모임 참가자',9]], action:'추천 도서 목록을 작성했다', selected:3},
  {id:'garden', family:'garden-project', split:'validation', genre:'narrative', groups:[['ecology','생태 동아리 학생',14],['photo','사진 동아리 학생',11]], action:'관측 기록을 제출했다', selected:5},
  {id:'village', family:'village-meeting', split:'synthetic_holdout', genre:'narrative', groups:[['resident','주민 대표',9],['volunteer','청년 자원봉사자',7]], action:'의견서를 제출했다', selected:2}
]);
const LINK='과';
function sceneFact(scene,order){
 const ix=order==='AB'?[0,1]:[1,0];
 return ix.map(i=>scene.groups[i][1]+' '+scene.groups[i][2]+'명').join(LINK+' ')+'이 모임에 참석했다.';
}
function makeRows(){
 const rows=[];
 for(const scene of scenes)for(const targetIndex of [0,1])for(const order of ['AB','BA'])for(const scope of ['unique','competing']){
  const [targetId,name,count]=scene.groups[targetIndex];
  const source={fact:sceneFact(scene,order),family:scene.family,sceneId:scene.id,genre:scene.genre};
  const accessibleRefs=scope==='unique'?[targetId]:scene.groups.map(g=>g[0]);
  const intent={targetId,subsetCount:scene.selected,sourceCount:count,action:scene.action,authority:'AUTHOR_DECLARED_ONLY'};
  const item={schema:'ksgt.p59.item.v05',id:[scene.id,targetId,order,scope].join('-'),
   provenance:{source:'AUTHOR_SYNTHETIC',humanGold:false,externalSource:false},
   split:scene.split,splitAuthority:'SYNTHETIC_FAMILY_ONLY',templateFamily:'two-group-discrete-subset-v1',
   source,order,readerState:{scope,accessibleRefs,authority:'EXPERIMENTAL_DECLARATION_NOT_HUMAN_INFERENCE'},
   intent,
   alternatives:{KEEP:'그중 '+scene.selected+'명은 '+scene.action+'.',EXPLICIT:name+' '+count+'명 중 '+scene.selected+'명은 '+scene.action+'.'}};
  rows.push({...item,sha256:hash(item)});
 }
 return rows;
}
function audit(rows){
 assert.equal(rows.length,32);
 assert.equal(new Set(rows.map(x=>x.id)).size,32);
 const families=new Map();
 const counts={development:0,validation:0,synthetic_holdout:0};
 for(const row of rows){
  assert.equal(row.schema,'ksgt.p59.item.v05');
  assert.equal(hash(Object.fromEntries(Object.entries(row).filter(([k])=>k!=='sha256'))),row.sha256);
  assert.equal(row.provenance.humanGold,false);
  assert.equal(row.splitAuthority,'SYNTHETIC_FAMILY_ONLY');
  assert.ok(row.intent.subsetCount>0 && row.intent.subsetCount<row.intent.sourceCount);
  assert.ok(row.readerState.accessibleRefs.includes(row.intent.targetId));
  counts[row.split]++;
  if(families.has(row.source.family))assert.equal(families.get(row.source.family),row.split,'FAMILY_SPLIT_LEAK');
  else families.set(row.source.family,row.split);
 }
 assert.deepEqual(counts,{development:16,validation:8,synthetic_holdout:8});
 for(const scene of scenes)for(const target of scene.groups){
  for(const order of ['AB','BA']){
   const pair=rows.filter(x=>x.source.sceneId===scene.id&&x.intent.targetId===target[0]&&x.order===order);
   assert.equal(pair.length,2);
   assert.equal(pair[0].source.fact,pair[1].source.fact);
   assert.deepEqual(pair[0].intent,pair[1].intent);
   assert.deepEqual(pair[0].alternatives,pair[1].alternatives);
   assert.notDeepEqual(pair[0].readerState,pair[1].readerState);
  }
 }
 return {rows:rows.length,scenes:families.size,counts,authority:'SYNTHETIC_FAMILY_HOLDOUT_NOT_NATIVE_GOLD'};
}
function test(){
 const rows=makeRows(),r=audit(rows);
 assert.deepEqual(makeRows(),rows,'non-determinism');
 const corrupt=structuredClone(rows);corrupt[0].split='validation';
 const {sha256,...payload}=corrupt[0];corrupt[0].sha256=hash(payload);
 assert.throws(()=>audit(corrupt),/FAMILY_SPLIT_LEAK/);
 const altered=structuredClone(rows);altered[0].readerState.accessibleRefs=['nonexistent'];
 assert.throws(()=>audit(altered));
 console.log(JSON.stringify({test:'PASS',version:'v0.5',...r,hash:hash(rows)}));
}
if(require.main===module){
 if(process.argv.includes('--emit'))console.log(JSON.stringify({schema:'ksgt.p59.dataset.v05',rows:makeRows(),humanPreference:'NOT_OBSERVED'}));
 else test();
}
module.exports={scenes,makeRows,audit,hash,test};
