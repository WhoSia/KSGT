'use strict';
const {auditRegistry}=require('./authority.cjs');
const r=require('./data/source_registry.json');
const x=auditRegistry(r.sources);
console.log(JSON.stringify({schema:x.schema,sources:x.sources.map(z=>({id:z.id,verdict:z.verdict,direct_partitive_gold:z.direct_partitive_gold,adjacent_gold:z.usable_for_native_adjacent_probe})),
  directly_admissible_partitive_gold:x.directly_admissible_partitive_gold,
  materialized_adjacent_native_gold:x.materialized_adjacent_native_gold,
  independent_disagreement_gold:x.independent_disagreement_gold,
  calibration_authority:'NO_IDENTIFIABLE_TARGET_SCORED_OUTCOMES'},null,2));
