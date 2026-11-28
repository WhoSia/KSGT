# KSGT G10-P2 R5s — Blinded assignment commitment failure, recovered and repaired

2026-11-23 KST · **SECURITY_ERRATUM** affecting previously published **synthetic-only R5r** packets. No human participant data existed. Official stage remains `G10-P2 OPEN / QUALITY_HOLD`.

## Replayed failure

The original R5r preflight wrote `assignment_commitment = sha256(json.dumps(labels, sort_keys=True))` into the **public** packet. There are seven distinct arms and exactly `7! = 5040` possible label-to-arm mappings. With the names of the seven arms known, an observer enumerates all permutations and compares their digest to the published SHA. A SHA-256 digest is cryptographically strong against random input preimages, **not** against exhaustively searching this tiny input space. An independent Python reproduction recovered the private seven-arm mapping for **both rows of the original R5r synthetic receipt** without knowing any private seed. No actual experiment was conducted.

This is a genuine blinding-design flaw, not a completed human blinding violation. The old receipt is preserved as evidence but **deprecated**; do not send it to human readers or use it as a live research allocation.

## Remediation

1. Update `r5r_blind_packet.py` to **omit** the public `assignment_commitment` field entirely. The private `private_key()` mapping is separate. This removes the known low-entropy public hash inversion, but does NOT turn the original synthetic seed into a secure live-study key.
2. Add `r5s_blind_commitment.py` to reject any public packet containing the legacy field, private seed, private mapping or secret. It can produce a domain-separated HMAC-SHA256 commitment only with an independently retained `bytes` secret of at least 32 bytes. Keep that binding secret in a restricted vault, NOT GitHub, Drive shared review packets or Notion. The included fixed-byte example secret is **test-only** and MUST NOT be used live.
3. The HMAC is only a **binding check** for mapping integrity. It is not proof of independent random allocation, entropy provenance, human reviewer blinding, real study preregistration or the absence of side-channel leakage. Other potential leaks include prompt wording, outputs recognizable by style, task metadata and identity of the evaluator. These are separate threats, not solved by hashing.
4. Retain synthetic source results as test fixtures. Real evaluations require fresh high-entropy secret generation, limited authorized access, role separation, exposure logging, a signed mapping reveal after rating lock, and independently verified source-work/right audits.

## Executed verification

- Brute-force recovery from **2/2 original** R5r synthetic public packets: recovered all seven arm names in each row (private mapping withheld from public report).
- New 15/15 adversarial synthetic regressions PASS (`test_r5s_blind_commitment.py`): inversion, 5040 candidates, old format reject, public key absence, HMAC binding, cross-context replay, wrong key, tampered mapping and input shape.
- Existing R5r tests 20/20 PASS after removing public assignment digest.
- New generated preflight 2-work JSON scanned: 0 public legacy commitments; R5s public audit 2 rows PASS. The tests are reproducibility/contract tests only.

## LIRA director score and epistemic limits

See `R5S_LIRA_LINES.md`: **12/12 meaningful lines** carry E/P 0..1, FACT/PLAN/INFER/HOLD and exact evidence provenance. Priority of preventing a corrupted blind experiment: **P=1.00**; demonstrated old brute-force failure evidence: **E=1.00**; independent actual G10-P2 improvement evidence still **0**. E scores rate the backing of the *statement*, never true-event odds or measured effect.

**Decision D7:** preserve R5r legacy (with explicit deprecation); replace executable public packet generator, add public-blindness failure preflight; require researcher-kept 256-bit secret for optional HMAC evidence, never pass the private mapping to rater files. No G5 promotion. Future source-disjoint real experiment remains gated by actual NIKL/other authorized source bytes, rights, work lineage, variance/power and independent reader/source assessments.

## Custody

GitHub commits go only to `WhoSia/KSGT` branch `research/g10-p2-reader-state-coupled`, author/committer `WhoSia`; original R5r historical report preserved, not silently rewritten. This revision is also archived in private Drive, with source, 15 tests, LIRA score ledger, synthetic redacted receipt, manifest and ZIP. No raw NIKL/KoLLA text included.
