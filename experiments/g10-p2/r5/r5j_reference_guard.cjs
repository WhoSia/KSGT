'use strict';
// R5j preflight: finite source-licensed Korean reference operation.
// Not an automatic parser, stylistic scorer, or new neural generator.
function decide(input) {
  if (!input || typeof input !== 'object') return {decision:'ABSTAIN',reason:'MALFORMED'};
  const {actor,previousActor,object,previousObject,competitorActors,explicit,elliptical,license}=input;
  if (![actor,previousActor,object,previousObject,explicit,elliptical].every(x=>typeof x==='string'&&x.length>0)
      || !Array.isArray(competitorActors) || !competitorActors.every(x=>typeof x==='string')
      || typeof license!=='object' || license===null)
    return {decision:'ABSTAIN',reason:'MALFORMED'};
  if (license.actor!==actor || license.object!==object || license.elliptical!==elliptical || license.explicit!==explicit)
    return {decision:'KEEP_EXPLICIT',text:explicit,reason:'NO_EXACT_LICENSE'};
  if (actor!==previousActor || object!==previousObject)
    return {decision:'KEEP_EXPLICIT',text:explicit,reason:'REFERENT_SWITCH'};
  if (competitorActors.some(x=>x!==actor))
    return {decision:'KEEP_EXPLICIT',text:explicit,reason:'COMPETITOR_PRESENT'};
  if (!license.sourceFactId)
    return {decision:'KEEP_EXPLICIT',text:explicit,reason:'NO_SOURCE_TRACE'};
  return {decision:'LICENSED_ELLIPSIS',text:elliptical,reason:'SAME_ACTOR_OBJECT_AND_AUTHORIZED_FORM',sourceFactId:license.sourceFactId};
}
module.exports={decide};
