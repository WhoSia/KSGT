'use strict';
/** Set-identified paired reader preference, not a quality score. */
function bounds(identical,different){
 if(!Number.isSafeInteger(identical)||!Number.isSafeInteger(different)||identical<0||different<0||identical+different===0)throw Error('INVALID_PAIR_COUNTS');
 const n=identical+different;
 return {pairs:n,structuralTies:identical,unratedDifferentPairs:different,
         meanPreferenceBounds:[-different/n,different/n],
         readerJudgments:0,observedWinner:null,statisticalConfidenceInterval:false};
}
module.exports={bounds};
