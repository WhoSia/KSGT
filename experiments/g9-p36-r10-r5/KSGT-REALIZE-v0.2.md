# KSGT-REALIZE-v0.2 — Partially Identified Realization Theory

## 1. Opportunity is a multiset
For predicate token p and syntactic class s,

R(p,s)=O(p,s) ⊎ Z(p,s),

where O and Z are overt and omitted **instances**. Official 2024/2025 data contain simultaneous O and Z for the same predicate-slot class. Therefore a slot class is not a latent argument-token identity.

## 2. Identified quantity
For an observed stratum x,

q_obs(x)=N_omit(x)/(N_omit(x)+N_overt(x)).

This is descriptive prevalence over the observed instance universe. It is not a causal omission probability, stylistic preference, or utility difference.

## 3. Latent decision state
For argument-token candidate i:
- X_i: observed predicate/sense/slot/source/dependency state;
- H_i: unobserved discourse, referent, information-structure and social-pragmatic state;
- Gamma_i: authorized semantic-role uncertainty set;
- S_i: style target;
- A_i in {OMIT, OVERT, PRONOMINAL_OR_MARKED}.

The desired generation policy is pi(a|X_i,H_i,Gamma_i,S_i). Current corpora do not jointly observe H_i or counterfactual outcomes for alternative actions, so pi and DeltaU_i(OMIT,OVERT) are not point identified.

## 4. Generation-time evidence
Completed-document recoverability is not generation-time licensing.

Evidence states:
- PRIOR_TEXT_AVAILABLE
- FUTURE_TEXT_REQUIRED
- DEICTIC_OR_SHARED_CONTEXT
- POSITION_UNRESOLVED
- UNRESOLVED

Future-only evidence cannot by default license a current omission. Deictic evidence requires non-textual common-ground state.

## 5. Gate lattice
G0 semantic fidelity
→ G1 generation-time recoverability
→ G2 syntactic/pragmatic omission licensing
→ G3 discourse and information-structure fit
→ G4 register/style/social-pragmatic fit.

A later gate cannot create authority missing at an earlier gate.

## 6. Vector utility
For action a and admissible world omega, define

u(a,omega)=(
 semantic_fidelity,
 referential_recoverability,
 discourse_coherence,
 information_structure_fit,
 register_style_fit,
 non_redundancy
).

No fixed global scalar weights are authorized.

With interval objective bounds [L_k(a),U_k(a)], action a has a robust dominance certificate over b only if

L_k(a) >= U_k(b) for every protected dimension k

and strict inequality holds for at least one dimension.

If no certificate exists, the realizations remain incomparable and the alternative set stays open.

## 7. Semantic-role uncertainty
Gamma_i may be:
- singleton: independent token-role authority exists;
- finite set: partially identified, e.g. frame constraints;
- unknown: no authorized role information.

A realization may collapse alternatives only when the decision is robust across Gamma_i. A unique frame residual does not retroactively become observed role gold.

## 8. Information structure
Topic/focus/contrast are decision-relevant but remain latent unless independently annotated or identified. Surface case/topic marking after realization cannot be treated as a pre-choice causal variable by default.

## 9. Decision rule
Let F_i be the actions passing G0-G4. The default KSGT output set is

A*_i = Max_robust(F_i; Gamma_i).

Return one realization only when it robustly dominates all alternatives, or when an explicit author preference functional resolves the frontier. Otherwise preserve multiple realizations.

## 10. Research consequence
KSGT is not a classifier that hides uncertainty behind one probability. It is a constrained generator whose world contact removes impossible choices, whose mathematics preserves unresolved distinctions, and whose style layer ranks only realizations that remain semantically and referentially authorized.
