"use strict";
const t=require("node:test"),a=require("node:assert/strict");
const {parseM2,replay,audit}=require("./r9_kolla_m2_cold_replay_v01.cjs");
const {COLUMNS}=require("./r9_kolla_packet_audit_v01.cjs");
const m2='S 저는 학교에 가요 .\nA 1 2|||R:PART|||학교에서|||REQUIRED|||-NONE-|||0\nA 1 2|||R:PART|||학교로|||REQUIRED|||-NONE-|||1\n\nS 다음 문장입니다 .\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||0\n';
function csv(hidden=0){const fields={challenge_id:"R2ay-001",row_index0:"0",m2_block_1based:"1",row_sha256:"a".repeat(64),risk_stratum:"R2_LOCAL_MULTI",hidden_annotator:String(hidden),source:"저는 학교에 가요 .",visible_ref:hidden===0?"저는 학교로 가요 .":"저는 학교에서 가요 .",candidate:hidden===0?"저는 학교에서 가요 .":"저는 학교로 가요 ."};return COLUMNS.join(",")+"\n"+COLUMNS.map(k=>fields[k]).join(",")+"\n";}
t("both human annotator edits are reconstructible from M2",()=>{const b=parseM2(m2)[0];a.equal(replay(b,0),"저는 학교에서 가요 .");a.equal(replay(b,1),"저는 학교로 가요 .")});
t("hidden annotator 0 maps to candidate, other to visible",()=>{const r=audit(m2,csv(0));a.equal(r.fullTripleIdentityRows,1);a.equal(r.candidateReplayedFromHiddenHuman,1);a.equal(r.visibleReferenceReplayedFromOtherHuman,1);a.equal(r.modelWins,0)});
t("hidden annotator 1 maps to candidate, other to visible",()=>{const r=audit(m2,csv(1));a.equal(r.fullTripleIdentityRows,1);a.equal(r.candidateReplayedFromHiddenHuman,1)});
t("M2 missing second reference is preserved not hallucinated",()=>{const r=audit(m2,csv(0));a.equal(r.missingSecondAnnotator,1);a.equal(r.blocks,2)});
t("source-to-M2 mismatch identified even with plausible refs",()=>{const c=csv(0).replace("저는 학교에 가요 .","저는 학교에 오요 .");const r=audit(m2,c);a.equal(r.fullTripleIdentityRows,0);a.equal(r.failures.length,1)});
t("M2 rejects corrupt source and wrong annotator",()=>{a.throws(()=>parseM2("Q not a source"),/M2_SOURCE_MISSING/);a.throws(()=>replay(parseM2(m2)[0],2),/UNKNOWN_ANNOTATOR/)});
t("M2 de-duplication and no new reader gold",()=>{const r=audit(m2,csv(0));a.equal(r.actualNewHumanRatings,0);a.equal(r.essayIdsAvailable,false);a.equal(r.independentEssayCount,"UNIDENTIFIED")});
