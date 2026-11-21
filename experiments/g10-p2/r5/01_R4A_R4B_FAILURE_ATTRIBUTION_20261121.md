# R5 research unit A · Failure attribution from actual G10-P2 prose

2026-11-21. Status: AUDITED HISTORICAL DEVELOPER EVIDENCE, not an independent gold outcome.

## Evidence boundaries
R4a independently generated 24 *model* drafts from 12 author-created source works and used 24 model self-audit calls plus 12 plain-state chooser calls, for 60 actual calls and 49,978 tokens. Its selector chose the RICH candidate once in 12 works; the LLM supplied with the same state as plain text chose RICH three times, agreeing on 10/12. These are selector decisions, not quality scores. Missing source details passed model audits as CLEAR.

R4b selected 10 already exposed actual drafts after seeing R4a outputs: 6 targeted issues and 4 no-target controls. The same source and developer target was given to each arm. PATCH_MODEL consumed 8,147 recorded tokens and strictly removed the exact targeted substring in 3/6; FULL_REWRITE consumed 8,839 tokens and removed it in 6/6; neither establishes semantic repair or reader utility. Both kept all 4 no-target cases unchanged. The three strict patch refusals were due to whitespace mismatch of a quote. A separate post-hoc whitespace adapter may rescue mechanics, but cannot revise the preregistered 3/6.

The first R4b wrapper labelled valid JSON patch responses INVALID_PATCH because of an old *three-paragraph* parse contract; 20 genuine model responses were preserved and rescored, without model recall, from the original SHA evidence. The failure is a software-contract failure, not a 20-call provider failure, and may not be silently replaced by the later rescue.

## Four distinct failure mechanisms
1. **Detection miss**: self-audit CLEAR for newly invented promises or notice submission destinations.
2. **Patch-envelope rejection**: a quote has different whitespace though content is identical; cannot treat the restricted patch mechanism as semantically wrong.
3. **Unlicensed replacement**: targeted unsupported place removed but a different recipient inserted; a successful string deletion is still an unresolved source-fidelity failure.
4. **Global residual**: a limited patch removes one highlighted error but other invented obligations remain. Whole-document outcome stays unaudited.

## Required estimands, distinct from proxy scores
- Target span exact removal: mechanical; score separately.
- All-source fact/actor/condition preservation: independent source-auditor verdict, not a source span count.
- Blind reader comprehension and usability: real independent Korean-language judgments, not the model's own assessment.
- Cost advantage: total calls, provider tokens and extraction/annotation effort of a deployable arm, not aggregate all experimental arms presented as a deployment price.

## Falsifier
If the same base LLM plus the identical state as ordinary text is no worse on full documents within comparable total cost, the executable state layer has no demonstrated marginal advantage. If a simpler direct model is as usable and more faithful, the complex pipeline should be pruned.

References:
- https://github.com/WhoSia/KSGT/blob/research/g10-p2-reader-state-coupled/experiments/g10-p2/R4A_FULL_PROSE_SELECTION_RESULTS_20261121.md
- https://github.com/WhoSia/KSGT/blob/research/g10-p2-reader-state-coupled/experiments/g10-p2/R4B_STRICT_REPAIR_RESULTS_20261121.md
- https://drive.google.com/file/d/1Eci4qhiyIz1GGVa1GghOmpxHA3O2OtXi/view
