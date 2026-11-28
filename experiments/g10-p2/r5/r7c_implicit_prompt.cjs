'use strict';
const {families}=require('./r7b_scope_cases.cjs');
const {cases}=require('./r7c_implicit_cases.json');
const {messages}=require('./r7b_scope_prompt.cjs');
function stimuli(){return [...families.map(f=>({id:f.id,text:f.context,target:f.target,parts:f.parts,gold:'UNSETTLED',cohort:'EXPOSED_OMISSION'})),...cases.map(f=>({...f,cohort:'FRESH_DEV'}))];}
function schedule(){return stimuli().flatMap((c,i)=>(i%2?['RESOLVED','DIRECT']:['DIRECT','RESOLVED']).map(arm=>({id:c.id+'__'+arm,work:c.id,cohort:c.cohort,arm,gold:c.gold,source:{text:c.text,target:c.target,parts:c.parts},messages:messages(c,arm)})));}
module.exports={stimuli,schedule};