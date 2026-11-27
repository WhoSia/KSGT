'use strict';
// Closed, manually typed observation ledger; not a Korean parser.
const axes=new Set(['WORLD','KNOW','REMEMBER','BELIEVE','EXPECT','OBSERVE']);
const values=new Set(['TRUE','FALSE','UNKNOWN']);
function key(x){if(!x||!axes.has(x.axis)||typeof x.subject!=='string'||!x.subject.trim()||typeof x.time!=='string'||!x.time.trim()||typeof x.proposition!=='string'||!x.proposition.trim())throw Error('INVALID_KEY');return JSON.stringify([x.axis,x.subject,x.time,x.proposition]);}
function evaluate(records,query){
 const target=key(query);const known=new Set();let unknown=0;
 for(const r of records){const k=key(r);if(!values.has(r.value))throw Error('INVALID_VALUE');if(k!==target)continue;if(r.value==='UNKNOWN')unknown++;else known.add(r.value);}
 if(known.size===2)return {status:'CONFLICT_HOLD',unknown};
 if(known.has('TRUE'))return {status:'SUPPORTED',unknown};
 if(known.has('FALSE'))return {status:'CONTRADICTED',unknown};
 return {status:'UNSETTLED',unknown};
}
module.exports={key,evaluate};
