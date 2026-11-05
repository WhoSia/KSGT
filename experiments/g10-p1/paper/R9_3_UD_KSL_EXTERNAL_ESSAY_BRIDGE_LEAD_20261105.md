# KSGT G10-P1 R9.3 — UD_Korean-KSL External Essay-ID Recovery Lead (2026-11-05)

**Disposition:** POSITIVE EXTERNAL SOURCE-STRING CONTACT / 7 OF 7 SPECIFIED EXACT-NORMALIZED EXAMPLES LINKED UNIQUELY / ORIGINAL ESSAY AUTHORITY STILL HOLD / NO FULL-CORPUS RECONSTRUCTION CLAIM.

## Discovery

[Official UniversalDependencies/UD_Korean-KSL](https://github.com/UniversalDependencies/UD_Korean-KSL) README explicitly says the treebank includes a subset of original **KoLLA** learner sentences, with `KL` IDs and group tags `fb, fi, hb`, in addition to other independent Kyung Hee and argumentative datasets. Its current `ko_ksl-ud-test.conllu` contains sample IDs that are consistent with the form:

`KL-<fb/fi/hb>-<essay-number>-<sentence-number>`

This is an **external candidate of original essay identity**; we must not conflate grouping in a later syntactic treebank with a proven bijective original 100-essay mapping.

## Verified published public test-split boundary (not full treebank)

The **public GitHub test-split blob** `ko_ksl-ud-test.conllu` was fetched via GitHub, repository blob SHA-1 `637d4405a89b41439b63cc175ec20ae666227905`. The current public test split yielded **168 `KL-` source IDs** (97 distinct candidate essay group labels under the `KL-fb/fi/hb-group` prefix); only the seven specified examples below have been cold-compared against the entire 1,418-block KoLLA M2. The other **161 entries are NOT yet proven exact original matches**, and their apparent group counts cannot be promoted into an independent 100-essay partition. This source blob SHA pins the test-file contents as viewed; it is not a SHA-256 receipt for all train/dev/test CoNLL-U files.

## Independently replayed original M2 contacts

I read the first published `KL` samples from the upstream GitHub test treebank and cold-compared their NFC+whitespace-normalized `# text` fields with **all 1,418** original KoLLA M2 `S` lines using the already SHA-sealed M2. In the seven deliberately selected concrete examples, **all 7** have **exactly one** match in the original M2 (M2 index zero-based). No learner text is reproduced below.

| Public UD sentence ID | M2 index (0-based) | Candidate essay group |
|---|---:|---|
| KL-fb-24-7 | 61 | fb-24 |
| KL-fb-7-1 | 290 | fb-7 |
| KL-hb-22-4 | 876 | hb-22 |
| KL-fi-7-13 | 704 | fi-7 |
| KL-hb-22-5 | 877 | hb-22 |
| KL-hb-22-1 | 873 | hb-22 |
| KL-fi-11-4 | 635 | fi-11 |

Most importantly, the same candidate essay group `hb-22` maps three externally labeled sentences to **three separate original M2 blocks**, `873, 876, 877`. This shows concrete *cross-source linkage* between a released annotated treebank and the original flat M2. It does **NOT** yet justify labeling all M2 blocks with those essay boundaries.

## Next validation requirements

1. Read and preserve exact byte SHA/version of all three current upstream UD train/dev/test CoNLL-U files; the UD release is evolving (2025 vs 2026 samples differ), so pin a commit and record access date.
2. For EVERY upstream `KL` entry, normalize original surface form conservatively (Unicode NFC, whitespace differences only) and index against the entire M2. Report unique matches, ambiguous duplicate-string matches, missing matches, and multiple UD IDs per M2 source sentence.
3. Require independently backed original essay-group semantics. Parsing a token pattern like `KL-hb-22-4` is not itself proof `hb-22` is the original 100-essay identifier; validate upstream repository documentation and original KoLLA edition.
4. Find the original 100-essay group-to-M2 index mapping. Incomplete annotations cannot be extrapolated by nearest neighbor. If only a partial group mapping is recovered, hold unmapped blocks out of independent document-level analysis.
5. Never put raw restricted learner Korean text into the public KSGT repository. Publish hash-level receipts/group index labels only, subject to source license.
6. The public UD_Korean-KSL repository identifies its material as **CC BY-SA 4.0**; this is not an unrestricted grant to redistribute the different original KoLLA ZIP under its own **GPLv3** license.
7. No model results, no new human readers and no Korean literary preferences are inferred from this bridge.

## Code and reproducibility

- [External mapping/collision gate](../r9_ud_essay_bridge_v01.cjs), deliberately sets `sourceWorkVerified=false` and `documentHold=true` until authorized coverage and work-level genealogy are complete.
- [Adversarial unit tests](../r9_ud_essay_bridge_v01.test.cjs), including duplicate learner-source strings, cross-group collisions and rejection of other non-KoLLA treebank IDs.
- [Upstream original source](https://github.com/UniversalDependencies/UD_Korean-KSL/blob/master/ko_ksl-ud-test.conllu) (not yet locally SHA-sealed and subject to remote version drift).
- [R9.3 full original KoLLA M2 audit](R9_3_KOLLA_RAW_ROLE_AND_ESSAY_BOUNDARY_AUDIT_20261105.md).

**Scientific gate:** This is a substantive candidate towards essay provenance recovery, not confirmation of all 100 essay boundaries, a fresh holdout corpus, or model superiority. G10-P1 OPEN / NO NEW RECRUITMENT / NO PROVEN WRITING QUALITY UPLIFT.
