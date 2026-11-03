# KSGT Generation X G10-P1
## Lightweight Discourse-Guided Korean Prose Generation: Source-Conditioned Planning, Contextual Linguistic Realization & End-to-End Quality Evaluation

**Status: OPEN — generation research and implementable baseline comparison, no claimed prose-quality gain.**
**Notion:** https://app.notion.com/p/40def561cf9281a0b990ee1b3662b79e
**Predecessor:** [Generation IX evidence-preserving program closure](../g9/GENERATION_IX_PROGRAM_CLOSURE_20261103.md)

### The problem that matters

Can existing general LLMs produce substantially better **Korean prose paragraphs** when a lightweight external structure organizes the source facts, discourse relations, writer intent and Korean contextual realization? Improvements must be **experienced by real Korean readers**, not inferred from synthetic formal-validity tests.

Do not substitute another narrow 'should we edit?' authority paper for the original goal. FineEdit, multiple candidate generation, risk-calibrated abstention, and DRT are inherited tools, not the central scientific contribution.

### First artifact (engineering)

`compare.cjs` runs matched **DIRECT**, **RICH_PROMPT**, **DISCOURSE_GUIDED** conditions over user-authorized source briefs. The guided arm uses a deterministic/inspectable lightweight plan with one LLM realization call. Rich prompt is a strong single-call comparator that receives the same facts and constraints. The tool records actual model, prompts, temperature, max output tokens, wall time and API usage, if any. The default `--dry-run` makes **zero** model requests and cannot yield a writing-performance claim. No external text is added to GitHub.

```bash
node experiments/g10-p1/compare.cjs --dry-run --input experiments/g10-p1/fixtures/author_original_demo.json
node --test experiments/g10-p1/compare.test.cjs
# Actual API-based evaluation only when explicitly provisioned:
OPENAI_API_KEY=... node experiments/g10-p1/compare.cjs --run --model MODEL --input LOCAL_PRIVATE_TASK.json --output LOCAL_PRIVATE_OUTPUT.json
```

Never commit credentials or private source texts. The endpoint can be configured via `OPENAI_BASE_URL` and `OPENAI_API_KEY` for a compatible chat-completions service; use approved legal sources and model terms. Store raw generated passages and all private task text outside the repository. `compare.cjs` explicitly requires `--run` and API credentials to make network calls.

### Scientific comparison

- Source grouping by original **work/brief**. Historical P53 EX09/EX10 are **development/regression** only and may not masquerade as unseen holdouts.
- Same base model, source facts, audience, genre, intent, output limit and stochastic controls. Report prompt/token budget differences explicitly rather than declaring prompts equal length.
- Direct generation, rich prompt engineering, lightweight guided planning are the minimum comparator set. Strong diverse prompting / Verbalized Sampling and ablations (no plan; plan with generic realization; Korean contextual realization alone) follow.
- Independent native Korean reader quality/preference, and separate source-fidelity/epistemic reviewer labels. Synthetic canaries and human-correction corpora are not reader-preference outcomes.
- Report holistic prose quality and errors at **source-work level**; all outputs count, including invalid or unproduced ones. Long-form coherence, form variation, topicality, ellipsis, referential clarity, evidence level and facts are error dimensions.
- Report latency, API token counts and real hardware/model setting. A structured prompt might cost MORE than direct generation. Declare superiority only at supported quality/cost trade-offs.

### Strong 2025–2026 rivals

- Kim et al. (AAAI 2026), *Align to Structure*: discourse-informed structural reinforcement learning; direct conceptual rival. https://doi.org/10.1609/aaai.v40i44.41085
- Liu et al. (ACL 2026), *Disco-RAG*: discourse graph/blueprint conditioned RAG without model fine-tuning. https://aclanthology.org/2026.acl-long.189/
- Kim, Yang & Kim (2026), *An Explorative Study on a Structure-Style Concurrent Constraint Pipeline for AI-Based Long-Form Novel Creation*: Korean long-form narrative planning and style discipline. https://www.jics.or.kr/digital-library/107588
- Song & Cho (2026), *Implicit Consequentiality and Topicality in Korean*: joint Korean discourse cue integration limitations. https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003350286
- Yu et al. (ACL SRW 2025), *KoSEnd*: sentence ending naturalness annotations, not full prose preference. https://aclanthology.org/2025.acl-srw.29/
- Zeng et al. (2025), *FineEdit*; Zhang et al. (2025/2026 v4), *Verbalized Sampling*; Kamp & Reyle (1993), *From Discourse to Logic* are already available in Research OS Drive and provide components, not standalone G10 novelty.

### Pilot-to-paper contract

1. **Smoke:** verify input/schema/plan/prompt/runtime logging with tests. This is engineering success only.
2. **Pilot:** actually call the same base LLM for all arms on allowed new/exposed developmental sources; judge outputs separately with no human-gain claims.
3. **Freeze:** new source-work-disjoint test set, independent Korean evaluators and exact prompt versions before running confirmatory evaluation.
4. **Paper:** Intro/Related Work/Methods may be drafted now; Results/abstract quality conclusions await actual measured output and blinded human findings.
5. **Kill criteria:** if guided outputs do not outperform strong rich prompts, or quality/cost are worse, revisit the planning representation or abandon a general lightweight architecture gain claim. No reframing a failure as automatic semantic-governance novelty.

### Preservation / authority

Generation IX's entire exact previous CURRENT_STAGE snapshot is archived under `historical_g9_final_snapshot` in current root `CURRENT_STAGE.json`; old files and Git history preserved. The G9 latest scientifically closed stage remains G9-P58. G9-P59/P60 and P64 exploratory hypotheses were programmatically closed **without invented PASS results**. Human-authored Git commits only; CI cannot commit/push/merge/tag.
