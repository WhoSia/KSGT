# KRC v0.1 — Formal Mechanism and Defeat Court

**Stage:** KSGT Generation IX G9-P53  
**Authority:** implemented typed-plan proof + controlled writing trial; not a theorem of Korean naturalness or a measured superiority result.

## 1. Explanandum lock

KSGT asks how a Korean writer realizes a factually licensed meaning under an audience, genre, discourse state, information structure and style intention. It is **not** a detector-evasion toolkit, a word-ban engine, a generic proposer-approval system or a scalar “humanlikeness” classifier.

The source is a finite typed environment:

\[
\Gamma=(F,U,C,D),
\]

where **F** is a finite collection of source-provenanced fact atoms; **U** is a list of predicates/measurements/mental states that are unobserved and cannot be newly asserted; **C** contains audience, genre, narrator, information state and target length; and **D** is a typed directed discourse graph whose edges have declared relations and fact warrants.

A linearization plan is an ordered list of slots

\[
L=(\ell_1,\dots,\ell_n),\quad
\ell_i=(P_i,f_i,\rho_i,e_i),
\]

with paragraph **P**, referenced fact IDs **f**, discourse/expressive role **ρ**, and epistemic force **e**. Slot IDs and fact IDs are not lexical hints; they are **type-checked commitments**.

### What the implemented typechecker guarantees

For six source briefs, the deterministic compiler validates:

1. every licensed fact ID appears **exactly once** as a primary slot reference;
2. no slot refers to an unknown or a non-existent source fact;
3. two paragraphs are nonempty and their ordered slots never move backward;
4. every relation edge joins successive slots and uses a permitted, explicitly typed relation;
5. the compiler does not create an asserted causal relation without an independent warrant.

This is a **plan-level** guarantee. It does *not* prove that a neural surface realizer preserves meanings, that a conjunction never creates a pragmatic implication, or that the resulting prose is idiomatic.

## 2. Structural grammar and writing operators

The early KSGT syntax inventory enters as a typed **operation ecology**, not a blacklist:

| Level | Controlled resource | Failure to audit |
|---|---|---|
| Proposition | event, participant, magnitude, time, modality | invented event, lost qualification |
| Information structure | topic/focus, given–new, ellipsis | unlicensed referent or contrast |
| Sentence form | finite/subordinate clause, nominalization | repetitive clause skeleton |
| Discourse | explanation, order, warranted contrast or concession | connector pretending to prove a relation |
| Expressive effects | rhythm, lexical texture, narrator distance | genre-inappropriate smoothness and unsupported emotion |

For each passage, realizers form a **context-conditioned candidate fiber**

\[
\mathcal R_\Gamma
=\{r:\operatorname{licensed}(r,F,U,C,D)\},
\]

which is a theoretical object rather than a set completely decidable by today's validator. Even two realizations that preserve an event can shift contrast, presupposition, salience or reader inference.

## 3. Two realizers, two authority levels

**LLM-free symbolic linearizer:** copies all source fact clauses in typed slot order, inserting only spaces and paragraph boundaries. Its precise verified property is preservation of all 30 licensed strings over six briefs. It may be awkward or pragmatically misleading; this is a *structure-only control*.

**Neural surface realizer:** the same pinned Qwen3-0.6B Q8 checkpoint handles 6 tasks × 3 conditions. K receives a prevalidated typed plan; B receives the identical source brief without any formal plan; A receives the source brief plus a surface-template ban. The same generation budget and source facts are frozen across all arms. K's longer plan/prompt is **an intervention confound**, and v0.1 alone cannot claim that the graph data structure rather than added instructions caused any observed difference.

## 4. Critic as witness, not reward model

The independent critic examines a completed text **without importing the generator or planner**. It records length, paragraph and sentence topology, connective/false-antithesis candidates, novel numeral cues and genre-sensitive suspicious wording. It returns flags such as `POSSIBLE_UNOBSERVED_AFFECT_REVIEW`.

Formally:

\[
V(r,\Gamma)\in\
\{\text{witness},\text{uncertain},\text{descriptive observable}\},
\]

**not** `V(r)=0.84 naturalness`. Regex absence is never a semantic proof; a changed surface is never automatically a good Korean realization. Later independent readers may supply partially ordered contextual preferences, retaining ties.

A single GAN discriminator trained to identify AI-authored prose is expressly **not** the target. Optimizing such a judge can reward surface camouflage rather than accurate, situation-appropriate Korean.

## 5. Fixed experimental court and falsifiers

The 18-draft study freezes **6 briefs × B/A/K**, checkpoint revision and file SHA256, temperature 0.65, top-p 0.9, max 640 tokens, per-brief seed shared by B/A/K, and a deterministic arm execution order. It uses a *single pass*, **zero model reruns after critic feedback**.

The readout separates:

- formal planner validity;
- completed model responses and length/paragraph compliance;
- mechanical witness flags (not adjudicated fact errors);
- source-grounded factual preservation adjudicated independently;
- blinded reader judgments of context-aware idiomaticity, cohesion, cadence and genre fit.

**Defeat 1:** A performs at least as well as K on blinded writing judgments → KRC's additional structure has not earned its complexity.  
**Defeat 2:** K introduces unsupported assertions or ineffective prose → the neural realization bridge does not inherit type safety from the planner.  
**Defeat 3:** K wins only because of more prompt tokens or a more verbose plan → conduct an equally long untyped-planning ablation on *new* texts; no post-hoc retuning of these six briefs.  
**Defeat 4:** participants disagree in a genre-dependent manner → reject a universal scalar style objective.

## 6. Prior art and distinct test

Planning–realization separation exists in Moryossef, Goldberg & Dagan (2019), Hua & Wang (2019), Puduppully & Lapata's macro-planning literature (2021), and DRS-to-text work by Liu, Cohen & Lapata (2021). KRC has **no claim to have invented the split**. Its testable Korean-specific addition is the explicit coupling of fact provenance with information structure, speaker/addressee state, discourse licensing and stylistic realization **on natural Korean prose passages**, plus a critic that does not promote surface features to semantic authority.

Sources:
- https://aclanthology.org/N19-1236/
- https://aclanthology.org/D19-1055/
- https://doi.org/10.1162/tacl_a_00381
- https://aclanthology.org/2021.naacl-main.35/
- https://aclanthology.org/2025.ijcnlp-long.18/
- https://proceedings.mlr.press/v267/kim25e.html

**Research stopping rule:** if a stage improves the evaluator's labels or the model transport but produces no new evidence about Korean realizations, it returns to concrete writing phenomena instead of opening another approval/governance subfield.
