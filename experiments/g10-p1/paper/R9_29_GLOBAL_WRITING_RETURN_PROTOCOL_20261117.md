# R9.29 — Return to genre-specific whole-document writing

G10-P1 OPEN · 2026-11-17 KST · Development protocol frozen before generation.

## Direction decision

The [Prototype 0.1 source card](https://app.notion.com/p/3c9ef561cf9281309188ed506c0e7097) records a distinction between stylistic signals and writing quality at the project's start. Genre policy, false-positive control and candidate detection were already part of the prototype. The [research history review](https://app.notion.com/p/41bef561cf92818bb20dfadb8171c211) records the broader writing ambition and the repeated divergence of analyzer progress from writing evidence. The [G10 research program](../RESEARCH_PROGRAM.md) and [November 5 global refocus](../GLOBAL_WRITING_PROGRAM_R1_20261105.md) make complete Korean prose under a strong matched baseline the main outcome. R9.28 supplies a reusable edit-scope control and one tied masked preference on a particle pair. Neither measures gain on a complete document.

Prioritize generated documents and positive, genre-specific effects. Keep local source-preserving edits as a secondary capability. Retain source fidelity as a separate outcome because the planned effect can require new organization and expression within the source license. Prior G10 plan structures and G9 reference work supply design tools. This development experiment does not advance a novelty claim.

## Frozen comparison

Six newly authored public source briefs: two practical notices, two science explanations, and two short scenes with different effects. Three conditions per work, one call each, 18 calls total. All receive the same Korean audience, purpose, genre, expressive aim, source facts, license, output limit, and strong writing instruction. Use Groq GPT-OSS 20B, temperature 0, max 1,450 completion tokens, one generation per condition.

- Strong direct gets the full brief and plans internally.
- Flat notes adds six brief planning cues in author-supplied interleaved order. 
- Paragraph map uses the identical six cue strings and groups them in a three-paragraph sequence, two cues per paragraph, using role annotations supplied by the fixture author.

Direct versus flat tests the added cue package. Flat versus map tests its presentation, grouping/order and explicit paragraph labels jointly. Their measured token costs may differ. The map can be compiled without a separate model call, but annotating cue placement required the author's labor. These runs cannot establish that KSGT can infer placements from unannotated material.

## Scoring before revealing condition labels

Score each complete document against its frozen reader task and positive effect from the fixture. Record each as clear, failed or ambiguous, citing a phrase or paragraph relation. Separately mark whether the text added an unsupported factual assertion or violated the work's license. A recalled detail alone cannot satisfy the positive effect. Retain complete texts and provider usage. Author-side review is exploratory and stays distinct from independent readers.

Advance the map to a fresh-material study only if it achieves at least two more strict positive-effect passes than flat notes across the six works, has at least one flat-to-map gain in two different genres, and shows no net increase in material source breaches versus either comparator. Ambiguous is not a strict pass. If the signal sits in one genre only, narrow the mechanism claim to that genre and examine the actual wording with a same-information alternative. If the map misses the rule, keep whole-document generation central and reconsider the grouping intervention before expanding it. Good direct outputs are positive examples for analysis in either case. No external reader recruitment is required for this development round.
