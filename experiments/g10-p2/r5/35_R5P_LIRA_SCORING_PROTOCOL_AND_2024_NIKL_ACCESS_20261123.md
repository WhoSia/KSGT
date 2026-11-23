# KSGT G10-P2 R5p — LIRA v1 (Localized Iterative Recommendation Audit)

**2026-11-23.** This is a score-and-audit research instrument, **not a language-model quality result**. The original human-quality research stage stays `G10-P2 OPEN / QUALITY_HOLD`.

## Scope

Every physical line of the canonical `LIRA_LINE_AUDIT.md` is numbered and assigned **E** and **P** scores in `[0,1]`; the report contains no free unscored lines. All 24 line statements cite a registered identifier `S1`–`S9`; all six research decisions carry five explicitly recorded `0..1` decision dimensions and attribution. The LIRA tool *does not* retroactively score every line of historical KSGT code or prove statement truth.

- `E` = director-assessed evidence/audit support for that exact statement, not a calibrated probability. A raw verified SHA supports a custody statement but **does not** establish essay-level author independence.
- `P` = director-assessed practical priority for addressing that line during the current research cycle; unrelated to truth.
- `FACT / INFER / PLAN / HOLD` = statement kind; `FACT` requires >=0.50 E merely as a *sanity floor*, not a guarantee.
- For decisions, `gate`, `quality`, `info`, `feasibility`, `cost` are all 0–1, higher `cost` is worse. Priority = `0.30*gate + 0.30*quality + 0.20*info + 0.15*feasibility + 0.05*(1-cost)`.
- Qualitative necessity gates are **non-compensatory**: no score can override missing native text, real human reader outcomes, source work boundaries, or licensing. Scientific claims must still be justified by independent evidence.

## Implementation and reproducibility

`lira_audit.py`: Validates whole report lines and decision registry, detects unscored additions, unknown sources, invalid values, and illegal quality promotion. Outputs `LIRA_AUDIT_RECEIPT.json` with every line hash and a ranked decision list.

`lira_sensitivity.py`: Exhaustive 3^5 = **243** deterministic, not randomly sampled, perturbed scoring weight cases: each of five raw weights changes by `-0.10, 0, +0.10`, clamped positive and normalized. **D2 wins 195** cases, **D1 wins 48**, the others 0. This is not a frequentist confidence interval or posterior truth probability; it is a local sensitivity bound over a manually specified weight grid. The feasible/authorized status is a separate gate.

`test_lira_audit.py`: **13/13 synthetic/contract tests pass** locally; the report itself has **24/24 scored lines**. The actual NIKL 2024 raw corpus was **not acquired** and no new GPT-OSS generations or human reader judgements were performed. The prior 340 provider calls are a historical total, not an outcome of this test.

Run:

```bash
python -m unittest -v test_lira_audit.py
python lira_audit.py LIRA_LINE_AUDIT.md LIRA_DECISIONS.json --out fresh_new_receipt.json
python lira_sensitivity.py
```

`--out` must not point to an existing file. The validator does not fetch websites automatically; `S1...S9` are evidence registry URLs, not source content validation. For stronger evidence this research should add cold-byte source hashes and independent human audits.

## Research discovery and decision

The official NIKL catalogue lists the **2024 source-work revision corpus v1.1** derived from 2023 original writing and annotated at document/paragraph/sentence level for content/organization/expression correction. The **June 30, 2026 corrected release** lists it; the official **2024 construction report** is also publicly linked. The corpus *raw archive and license/author/editor group* remain **unheld or unverified** in the present session. Therefore NIKL 2024 access and blind evaluation preregistration are first-tier, alongside source-work boundary audit. We will **not** conflate KoLLA learner sentence M2 correction, P36 zero-anaphora annotation, P45 surface EDF counts or the 2025 national Q&A support dataset with native-written whole-paragraph style-quality gold.

Official catalog: https://kli.korean.go.kr/request/corpusRegist.do?lang=ko

Official 2026 notice: https://kli.korean.go.kr/m/boards/noticeView.do?recordId=1733

2024 construction report: https://www.korean.go.kr/front/reportData/reportDataView.do?mn_id=207&pageIndex=2&report_seq=1184&searchOrder=

## Preservation and limitations

This package contains ONLY LIRA evaluation code, reports, metadata, aggregate scores and synthetic checks; NO NIKL raw Korean content or KoLLA learner sentences. Preserve the source originals in existing Drive locations and register only derivative metadata here. GitHub: code/tests/auditable reports; Notion: the scientific decision judgment; Google Drive: delivered byte archive and receipts.

The 0.01 resolution is an indexing convention, **not 1% calibrated accuracy**. Scores can easily be influenced by director bias; the 243-case grid perturbs weights but not the initial assessments. A separate challenger must attempt to reverse D1/D2 rankings using plausible alternative candidate value assessments. No 'LIRA 0.95 proves true' claims are permitted.
