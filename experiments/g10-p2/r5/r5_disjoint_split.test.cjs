"use strict";
const test=require("node:test"),a=require("node:assert/strict"),{createHash}=require("node:crypto");
const {planDisjointSplit}=require("./r5_disjoint_split.cjs");
const h=x=>createHash("sha256").update(x).digest("hex");
const r=(id,parent,genre="science")=>({source_id:id,source_parent_id:parent,
 source_fingerprint:h(id),genre});
const opts={salt:"sealed-seed-20261121",minimumEvalWorks:2};
test("stable under input order and one parent cannot cross lanes",()=>{
 const rows=[r("new_a","shared_1"),r("new_b","shared_1"),r("new_c","shared_2"),r("new_d","shared_3")];
 const p=planDisjointSplit(rows,opts),q=planDisjointSplit([...rows].reverse(),opts);
 a.deepEqual(p,q);a.equal(p.assignment[0].lane,p.assignment[1].lane);
 a.equal(p.evidenceAuthority,"RESEARCHER_PROVIDED_IDENTITIES_ONLY_NOT_SEMANTIC_DISJOINTNESS");
});
test("historical exposure parent or fingerprint quarantines entire parent",()=>{
 const rows=[r("new_a","shared_1"),r("new_b","shared_1"),r("new_c","shared_2")];
 const p=planDisjointSplit(rows,{...opts,exposedFingerprints:[h("new_b")]});
 a.equal(p.assignment.find(x=>x.source_id==="new_a").lane,"EXPOSED_DEVELOPMENT");
 a.equal(p.assignment.find(x=>x.source_id==="new_b").lane,"EXPOSED_DEVELOPMENT");
 const q=planDisjointSplit(rows,{...opts,exposedParents:["shared_2"]});
 a.equal(q.assignment.find(x=>x.source_id==="new_c").lane,"EXPOSED_DEVELOPMENT");
});
test("no invented evaluation sufficiency on small cohorts",()=>{
 const p=planDisjointSplit([r("new_a","shared_1")],{...opts,minimumEvalWorks:24});
 a.equal(p.readyForMinimumSize,false);a.ok(p.heldoutParents<=1);
});
test("malformed IDs/fingerprint/salt fail closed",()=>{
 a.throws(()=>planDisjointSplit([r("a","p")],{salt:"short"}),/SALT_REQUIRED/);
 a.throws(()=>planDisjointSplit([{...r("valid","parent"),source_fingerprint:"bad"}],opts),/FINGERPRINT/);
 a.throws(()=>planDisjointSplit([r("duplicate","parent"),r("duplicate","parent")],opts),/DUPLICATE_SOURCE/);
 a.throws(()=>planDisjointSplit([r("valid","parent")],{...opts,evalFraction:1}),/FRACTION/);
});
test("fingerprint alias assigned to different parent rejects false independence",()=>{
 const x=r("work_a","source_1"),y={...r("work_b","source_2"),source_fingerprint:x.source_fingerprint};
 a.throws(()=>planDisjointSplit([x,y],opts),/FINGERPRINT_PARENT_COLLISION/);
});
