'use strict';
const {works}=require('./r6n_contracts.cjs'),{solve}=require('./r6n_joint.cjs'),{solve:old}=require('./r6l_discourse.cjs');
function receipt(){return {authority:'AUTHORED_SPAN_CONTRACTS_ONLY',rows:works.map(w=>{const fixedOrder=old(w).seq.map(x=>w.units[x.i].id);return {id:w.id,fixedOrder,fixed:solve(w,{fixedOrder}),joint:solve(w)};}),sensitivity:[0,4,8,12,20,30].map(weight=>({weight,rows:works.map(w=>{const fixed=solve(w,{weight,fixedOrder:old(w).seq.map(x=>w.units[x.i].id)}),joint=solve(w,{weight});return {id:w.id,fixed:fixed.cost,joint:joint.cost,sentences:joint.sentences};})}))};}
if(require.main===module)console.log(JSON.stringify(receipt(),null,2));module.exports={receipt};
