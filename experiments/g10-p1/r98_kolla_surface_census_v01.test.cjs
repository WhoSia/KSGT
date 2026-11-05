'use strict';const test=require('node:test'),a=require('node:assert/strict'),{normalize,census}=require('./r98_kolla_surface_census_v01.cjs');
test('NFC and whitespace normalized',()=>a.equal(normalize('가 나'),normalize('가나')));
test('source repeats preserve ambiguity',()=>{const x=census(['가 나','가나','다']);a.equal(x.repeatedBlocks,2);a.equal(x.pairAmbiguities,1);a.equal(x.repeatedWithRawVariants,1)});
test('multiplicities count all pairs',()=>{const x=census(['가','가','가']);a.equal(x.pairAmbiguities,3);a.equal(x.extraDuplicates,2)});
test('no raw text in census',()=>{const x=census(['민감한 문장','민감한 문장']);a.equal(JSON.stringify(x).includes('민감한 문장'),false);a.equal(x.essayIdsCertified,false)});
test('reject non-text rows',()=>a.throws(()=>census(['가',null]),/TEXT_REQUIRED/));
