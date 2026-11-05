'use strict';
/** Source-only KoLLA duplication census. Input: M2 source strings supplied locally. */
function normalize(s){if(typeof s!=='string')throw Error('TEXT_REQUIRED');return s.normalize('NFC').replace(/\s+/gu,'');}
function census(sources){
 if(!Array.isArray(sources))throw Error('SOURCES_ARRAY_REQUIRED');
 const groups=new Map();
 for(const source of sources){const k=normalize(source),list=groups.get(k)||[];list.push(source);groups.set(k,list)}
 const repeated=[...groups.values()].filter(x=>x.length>1);
 const multiplicities={};for(const r of repeated)multiplicities[r.length]=(multiplicities[r.length]||0)+1;
 return {schema:'ksgt.r98.kolla-surface-census.v01',blocks:sources.length,uniqueNormalized:groups.size,repeatedTypes:repeated.length,repeatedBlocks:repeated.reduce((a,x)=>a+x.length,0),extraDuplicates:repeated.reduce((a,x)=>a+x.length-1,0),pairAmbiguities:repeated.reduce((a,x)=>a+x.length*(x.length-1)/2,0),repeatedWithRawVariants:repeated.filter(x=>new Set(x).size>1).length,multiplicities,rawTextReleased:false,essayIdsCertified:false};
}
module.exports={normalize,census};
