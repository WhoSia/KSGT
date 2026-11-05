'use strict';
/** Partial identification from external candidate labels; not original essay certification. */
function evaluateAnchors(anchors,totalBlocks){
 if(!Array.isArray(anchors)||!Number.isSafeInteger(totalBlocks)||totalBlocks<1)throw Error('INVALID_INPUT');
 const seen=new Map();
 for(const a of anchors){if(!a||!Number.isSafeInteger(a.index)||a.index<0||a.index>=totalBlocks||typeof a.group!=='string'||!a.group.trim())throw Error('INVALID_ANCHOR');if(seen.has(a.index)&&seen.get(a.index)!==a.group)throw Error('CONFLICTING_ANCHOR');seen.set(a.index,a.group)}
 const sorted=[...seen].map(([index,group])=>({index,group})).sort((a,b)=>a.index-b.index),transitions=[],spans=new Map();
 for(let i=0;i<sorted.length;i++){const a=sorted[i],s=spans.get(a.group)||{lo:a.index,hi:a.index};s.lo=Math.min(s.lo,a.index);s.hi=Math.max(s.hi,a.index);spans.set(a.group,s);if(i&&sorted[i-1].group!==a.group){const gap=a.index-sorted[i-1].index;transitions.push({left:sorted[i-1],right:a,unobserved:gap-1,conditionalBoundaryCount:gap,uniqueOnlyIfAdjacentGroups:gap===1})}}
 let crossings=0;const list=[...spans.values()];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++)if(list[i].lo<=list[j].hi&&list[j].lo<=list[i].hi)crossings++;
 return {schema:'ksgt.r97.boundary.partial.v1',totalBlocks,anchors:sorted.length,candidateGroups:spans.size,crossings,transitions,certifiedEssayBoundaries:0,sourceWorkVerified:false,assumptions:['authentic labels not established','group adjacency not established','contiguity not established']};
}
module.exports={evaluateAnchors};
