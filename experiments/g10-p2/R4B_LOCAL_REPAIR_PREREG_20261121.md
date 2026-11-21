# G10-P2 R4b — Target-local KEEP/PATCH against equal-source full rewrite (2026-11-21)

**Frozen before new Groq calls:** R4a original 12 source works × 2 generated real texts were manually inspected; this R4b annotation is **post-hoc developer-chosen**, not a withheld confirmatory evaluation or an independent Korean source-fidelity judgment. This is a real-generation edit engineering experiment, not a quality-superiority claim.

## Controlled inputs and provenance

Use the *original* [R4a 60-call evidence ZIP](https://drive.google.com/file/d/1bkxWgjehdnoXq3nJKwDwTcr5kwf4tfEC/view) from [Actions run #44883541327](https://github.com/WhoSia/KSGT/actions/runs/44883541327). All 24 source-written candidates, all SHA-256 responses and 12 source work packets must be verified *before* any new provider call. The R4b file fixes **10 original candidate texts** by original text SHA: 6 investigator-flagged **single target spans** (2 CHAT_UPLOAD, 2 NOTICE_CHEM, SCI_SEED rich, SCENE_NOTE rich) and 4 **NO_TARGET** controls (CHAT_SHIFT direct, NOTICE_RETURN direct, NOTICE_ROOM direct, SCENE_RIBBON direct). One row is one previously exposed candidate, not an independent new source work.

The source-fact index and exact original text span are validated; the added developer note is a tentative source interpretation. An absent fact does not always imply a prohibited inference: these restrictions rely on the **explicit no-new-commitment/procedure/event license** supplied to the model in R4a, not on an entailment theorem.

## Arms and fixed 20-call comparison

On each of 10 original texts call the same Groq `openai/gpt-oss-20b` at temperature 0, same original source facts, reader purpose, same original complete candidate and same post-hoc target cue, once in each of two arms (20 calls total):

- **PATCH_MODEL**: output a strict JSON `{"action":"KEEP"}` or `{"action":"PATCH","before":"<exact quoted text>","after":"replacement"}`. Only one replacement supported. The deterministic program can apply a patch **only** if the proposed `before` is the original unique *flagged* span, not any alternative guessed span. No rewrite of unrelated words is allowed by the patch applier; a patch is labeled `APPLIED_UNVERIFIED`, **never independently source-validated**, because `after` can still invent a fact.
- **FULL_REWRITE**: output the full revised Korean candidate text; one model call, identical prompt packet but allowed to rewrite freely. If no issue is flagged, both arms should have the option to KEEP unchanged. An exact same candidate is a no-op.
- **REFERENCE_BOUNDED_PATCH** (zero new model calls): investigator-authored `referenceAfter` is spliced at the verified span, leaving every unrelated byte intact. This is an **oracle/developer upper-bound for the single targeted issue** and gets no causal credit against model-only arms. It is not automatically natural or globally faithful.

Order across PATCH_MODEL and FULL_REWRITE alternates by case index. No model output text or new fact corrections are stored in Git; preserve original response logs and entire result score in a Drive ZIP.

## Scoring and gates

- Exact original text SHA proof; unique target span; source license occurrence and source index correctness; output response SHA, request receipt/plan hash, strict JSON, one-target-only mutation envelope. No partial or silently repaired receipts.
- Report `KEEP` vs `APPLIED_UNVERIFIED` vs `INVALID_PATCH/WRONG_TARGET`, whether original flagged substrings remain, edit-character footprint and relative provider tokens of one-call PATCH vs one-call REWRITE.
- **NO_TARGET** controls are **not certified clean**, so a change there is merely an `UNPROMPTED_EDIT`, not necessarily a demonstrably harmful edit. False positives, quality, true source fidelity and native-Korean reader preference all require separate independent judgment. No inference of automatic source role parsing is authorized.
- If the first model output turns a source-violation sentence into a different unsupported sentence, model patch syntax passing is not semantic success. If the reference bounded patch only removes a specific error but leaves another error, this is not a whole-document PASS.
- Source-work-disjoint confirmation and compute-matched alternatives remain future work; this is **reused exposed R4a development material**. Any R4b success is a mechanics/cost result only.

**Director stop rule:** after the 20 calls, pack exact native reader and source auditor before/after views if the patched drafts are actually distinct. Independent humans, not a self-auditing LLM, are needed to decide whether any candidate is now more useful and accurate.
