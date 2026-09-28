# KSGT-XARG-v0.1 — Cross-Layer Authority Constitution

## Core object
A zero argument is not a semantic role. It is a token-level missing realization whose recovered referent must be related to a predicate token. Semantic role is a separate edge that requires independent authority.

`EVENT_TOKEN --HAS_ZERO_SLOT--> ZERO_SLOT_TOKEN --RECOVERS_TO--> REFERENT/SPAN_SET`

Independent layers may add:
- `EVENT_TOKEN --ATTACHES--> DEPENDENCY_ARGUMENT`
- `EVENT_TOKEN --BEARS_ROLE--> SRL_ARGUMENT`
- `EVENT_TOKEN --INSTANTIATES--> PREDICATE_SENSE`
- `PREDICATE_SENSE --LICENSED_BY--> CASE_FRAME_ROLE`

## Cross-layer non-laundering theorem
Let O be the ZA observable projection containing predicate token, syntactic slot, restored surface/referent, antecedent span set and edge state.
Let R be a semantic-role enrichment.

If two enriched graphs G1 and G2 differ only in R but have identical O, then O cannot identify R.
Therefore no deterministic mapping from ZA slot labels, dependency labels, particles or antecedent identity to semantic role has gold authority without an independent SRL/frame-bearing source.

## Role authority
Direct token-role authority requires an explicit SRL edge aligned to the same predicate token and argument token/span.
Case Frame supplies a sense-conditioned admissible role inventory, not token truth.
Dependency supplies syntactic attachment and grammatical relation, not semantic role.
Exact Case Frame + dependency can reduce the compatible role set, but if >1 role remains, the result is PARTIALLY_IDENTIFIED and must stay a set.

## Zero-role bridge test
Three outcomes are allowed when the new sources arrive:
1. DIRECT_ROLE_BINDING — zero/restored slot itself is explicitly SRL-labeled in the integrated object.
2. PARTIAL_ROLE_SET — predicate sense + frame + syntax narrows to a non-singleton role set.
3. UNIDENTIFIED — no authorized role edge exists.

No fourth outcome may infer a unique role from subject/object labels alone.

## 2024 bridge
The 2024 ZA + dependency pair is used to localize when the ontology moved from 2020 subject/object restoration toward 2025 explicit ellipsis/restored/set-valued antecedent structure.
This is an annotation-policy genealogy, not a temporal change claim about Korean.

## Stopping rule
If the 2025 integrated corpus does not share exact document/sentence/predicate identity with the separately distributed ZA layer, and no official alignment map exists, R3 closes semantic-role token authority as structurally unavailable rather than constructing fuzzy text joins.
