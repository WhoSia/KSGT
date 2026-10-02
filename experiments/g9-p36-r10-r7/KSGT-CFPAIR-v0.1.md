# KSGT-CFPAIR-v0.1 — Counterfactual Surface Authority

## 1. Counterfactual realization is a relation, not a symmetric rewrite function

Let Y be the space of Korean surface realizations.

For an overt realization y_o, deletion is a partial map

D : Y_overt ⇀ Y_null.

It is defined only when the overt argument span is exactly localized and removing it does not delete independently meaningful discourse, scope, honorific, coordination, or contrast material.

For a null realization y_n with an officially restored form r, insertion is generally set-valued:

I(y_n,r) ⊆ Y_overt.

Korean constituent order and information-structural placement permit more than one grammatical surface position. Therefore I is not assumed to be a function and D is not assumed to have a unique inverse.

## 2. Counterfactual preference requires protected equivalence

A pair (y_o,y_n) may enter a preference court only if it passes protected equivalence:

E_sem(y_o,y_n)=1,
E_ref(y_o,y_n)=1,
E_scope(y_o,y_n)=1,
E_hon(y_o,y_n)=1,

and no protected information-structure distinction is deleted without explicit authority.

Naturalness is evaluated only after this gate. A fluent but semantically or discourse-shifted edit is not a preference pair.

## 3. Information-structure cargo

An overt NP can carry more than referential content. Korean auxiliary/topic particles such as JX-marked material may contribute salience, contrast, additivity, limitation, or discourse framing.

Thus:

DELETE(ARGUMENT_NP) != DELETE(REFERENCE_ONLY)

whenever the NP bears independently relevant information-structure cargo.

This is why OVERT→NULL conversion is especially nontrivial for subjects.

## 4. Reference safety is asymmetric

For NULL→OVERT, the NIKL ZA restored form has recovery authority, but surface position is not thereby identified.

For OVERT→NULL, an exact native span can be deleted, but referential safety requires generation-time accessibility evidence. Exact-form or proper-name repetition is only a proxy, not coreference gold.

## 5. Internal surface authority is not preference authority

R7 internal gates may certify:
- exact edit span;
- absence of selected morphological danger flags;
- availability of a reference-accessibility proxy;
- duplicate-free blind surface.

They do not certify that humans prefer the counterfactual, nor that the pair is fully meaning-equivalent.

## 6. Preference packet rule

A blind human packet is admissible only after:
1. surface materialization authority;
2. protected-meaning gate;
3. reference-safety gate;
4. duplicate/near-duplicate audit;
5. frozen A/B randomization.

If any gate fails, human collection is postponed rather than used to debug the materialization algorithm.

## 7. R7 empirical implication

The first frozen 240-candidate packet demonstrates:
- OVERT→NULL exact-span materialization is feasible but strongly source/slot dependent;
- NULL→OVERT insertion position is not identified by ZA recovery gold alone;
- subject deletion is disproportionately blocked by information-structure-bearing morphology;
- therefore a valid preference experiment requires an information-structure-preserving counterfactual realizer, not generic phrase deletion/insertion.
