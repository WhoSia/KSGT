'use strict';const test=require('node:test'),a=require('node:assert/strict'),{evaluateAnchors:e}=require('./r97_boundary_partial_v01.cjs');
test('different anchor groups permit three conditional boundaries',()=>{const r=e([{index:2,group:'A'},{index:5,group:'B'}],10);a.equal(r.transitions[0].conditionalBoundaryCount,3);a.equal(r.certifiedEssayBoundaries,0)});
test('adjacent anchors only conditionally identify',()=>{const r=e([{index:2,group:'A'},{index:3,group:'B'}],6);a.equal(r.transitions[0].uniqueOnlyIfAdjacentGroups,true);a.equal(r.sourceWorkVerified,false)});
test('same-group anchors do not create transition',()=>a.equal(e([{index:2,group:'A'},{index:5,group:'A'}],9).transitions.length,0));
test('crossing candidate groups detected',()=>a.equal(e([{index:0,group:'A'},{index:1,group:'B'},{index:2,group:'A'}],5).crossings,1));
test('conflicting evidence rejected',()=>a.throws(()=>e([{index:0,group:'A'},{index:0,group:'B'}],3),/CONFLICT/));
test('invalid index rejected',()=>a.throws(()=>e([{index:3,group:'A'}],3),/INVALID/));
test('identical duplicate anchors deduplicated',()=>a.equal(e([{index:1,group:'A'},{index:1,group:'A'}],3).anchors,1));
