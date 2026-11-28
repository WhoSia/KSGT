# G10-P2 R5j — Source-bound referential ellipsis: falsifiable minimum mechanism (2026-11-21)

## Authority and doctrine
Follow [G10-P2 program](../RESEARCH_PROGRAM.md): complete Korean prose first, strong DIRECT120B baseline remains, no superiority claim from deterministic tests. GitHub human-authored commits only; Actions read-only and no github-actions[bot] commits/push. Notion contains interpretation, Drive original bytes, GitHub code/report. No promotion of previously exposed development cases to a blind holdout.

## Historical checkpoint (do not count as new experiment)
- P1 G10-P1 closed with no validated reader preference improvement; P2 active branch, not default main.
- R5g: 8 author-authored sources, 16 actual 120B full-text generations. LATTICE 11,209 vs direct 8,028 provider tokens (+39.62%). Correct rhetorical DAG order still transferred folded paper from 정원 to 준호 and generated unlicensed station facts.
- R5h: 8 author-authored six-frame literary sources. Direct 5,338 vs role-compiled selector 14,811 provider tokens (+177.46%); licensed actor/source frames were preserved but collocations and narrative rhythm remained weak.
- R5i: 0 additional model calls; 16 genuinely assembled Korean texts by conjoining same-actor clauses, preserving 6/6 pretyped source frames, but repeats like “유리창을 바라보며 유리창에는” survive. 
- Current G10-P2 total **340 actual provider calls**, independent reader evaluations **0**, independent semantic gold **0**, trained new models **0**. G10-P2 OPEN/QUALITY_HOLD.

## New R5j mechanistic research question
Can a *source-licensed*, actor- and object-conditioned reference operation eliminate one redundant nominal mention **without transferring ownership**, while refusing to change an expression when reference resolution is underdetermined?

Formalized guard: allow licensed ellipsis iff (i) same actor ID, (ii) same object ID, (iii) no distinct competitor actor, (iv) a source-fact trace exists, and (v) the exact explicit and elliptical Korean surface pair has been independently preapproved in the input. Otherwise KEEP_EXPLICIT; malformed input ABSTAIN. The last condition explicitly **does not** constitute automatic Korean syntax/semantics understanding.

Representative developer example (not external data):
- Original R5i: “준서는 김이 낀 유리창을 바라보며 유리창에는 손을 대지 않았다.”
- Candidate written by researcher: “준서는 김이 낀 유리창을 바라보면서도 손을 대지는 않았다.”
The latter is an *illustrative* referential choice; licensed omission of the second '유리창' remains dependent on author-provided trace and the semantic correctness of the candidate. Neither human preference nor universal naturalness has been measured.

## Discriminating tests and counterexamples
1. Identical actor + object, no alternative: license permits ellipsis.
2. New prior actor: no ellipsis (REFERENT_SWITCH).
3. New prior object: no ellipsis (REFERENT_SWITCH).
4. Competing actor: no ellipsis (COMPETITOR_PRESENT).
5. Wrong actor in license: no ellipsis.
6. Missing source fact: no ellipsis.
7. Malformed request: abstain.
8. Candidate surface differs from licensed exact string: no ellipsis.
9. Licensed candidate text is returned unchanged under exact trace match.

The bundled Node test exercises nine deterministic assertions; a local Node run passed 8/8. These are implementation checks, **not** evidence of genre-spanning Korean quality, independent semantic annotation, latency advantage, trained model or innovation in zero-pronoun theory. Prior work includes Roh & Lee (2003), Roh/Na/Lee (2005), and discourse-continuity studies.

## R5j experimental gate before any quality claim
For a new, rights-clear, source-disjoint corpus of actual professionally revised Korean paragraphs: collect source / before-after alignment with editorial intent and provenance; create author-separated splits; pre-fix (1) DIRECT120B, (2) plain-language same-state baseline, (3) explicit reference retention, (4) typed/authorized reference controller, and (5) equal-token repeated direct generation. Score **complete paragraph** quality and source fidelity independently, blind to arm; include annotation and retrieval costs. Track rejected/abstained inputs. Never count a deterministic source-frame conservation check as reader gold; do not treat editorial edits as aesthetic superiority without human validation.

## Outcome
**R5j preflight implementation only**: zero new provider requests, zero new independent reader responses, zero new trained models. No official stage promotion, no P2 counter increment. Strong direct 120B remains the comparator. The next milestone is rights-authenticated real Korean paragraph editing data with measurable whole-text effect, not more closed-world checks.
