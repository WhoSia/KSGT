# G10-P2 R5 — External novelty kill and RAVEL review (2026-11-21)

**Status:** independent PI argument and opponent audit from eight-work DEVELOPMENT, public author abstracts, primary code README. Not a new performance claim or full-paper reproduction.

## Real writing evidence that changes our action
Live [R5a original run](https://github.com/WhoSia/KSGT/actions/runs/44897700620) produced 40 actual GPT-OSS 20B calls and 24 whole Korean texts; model-generated extracted JSON 8/8 was syntactically anchored. OBSERVED condition used 17,501 allocated total tokens vs DIRECT 4,995 (3.50x). Despite extraction validity, OBSERVED continuation in SCENE_PAPER performed an action forbidden by the source (picking up an untouched paper). PLAN_ONLY in SCI_CLOCK converted "temperature was not recorded" into "temperature change was not observed". Actual language quality preference: ZERO independent judgments. Thus a model's anchored reader-state string is neither a semantic guard nor observed human cognition. [Whole-prose failure report](08_R5A_40_CALL_REAL_PROSE_RESULTS_20261121.md), [Drive ZIP](https://drive.google.com/file/d/1SJsUyVnGlviJH69PB-o85XLeCGAIBW5e/view).

## Novelty-attack A: ReaderScope (EMNLP 2026)
Feng Zhang and Rong Pan, "ReaderScope: From Offline Reader-Response Calibration to Online Controlled Story Generation." [Official ACL Anthology](https://aclanthology.org/2026.emnlp-main.1074/); [primary implementation README](https://github.com/FengZhang758/ReaderScope).
The README actually describes calibrating offline simulated reader-response curves and using online story-writing controllers for emotion, entropy, immersion and insight; public repo contains online_writing/controller modules. **The general move from simulated reader reaction to online writing control is not novel to KSGT.** KSGT should cease claiming generic reader-state control originality. Its potential narrow contribution is the *propositional source/realized-text entailment boundary across Korean genres with concise state under matched cost*, but this has not been demonstrated. No assumption that ReaderScope results generalize to factual Korean explanation, or vice versa. ReaderScope full paper text NOT YET RECONCILED with a Drive original; repo LICENSE path not found, therefore no reuse/copy authorization inferred.

## Novelty-attack B: WRitEer (AAAI 2026)
Junchuan Yu & Yuyang Sun, "WRitEer: A Multi-Objective, Preference-Driven Multi-Agent Framework for Human-Like Advanced Text Generation." [Primary venue abstract](https://ojs.aaai.org/index.php/AAAI/article/view/40232), [official PDF URL](https://ojs.aaai.org/index.php/AAAI/article/download/40232/44193). Already uses Reader, Editor and Writer feedback and preference training; another direct rival to naming a multi-agent reader/writer loop as innovation. Abstract reviewed; PDF not fully read in this pass.

## Novelty-attack C: SuperWriter (Findings ACL 2026)
Wu et al., "SuperWriter: Reflection-Driven Long-Form Generation with Large Language Models." [Primary publication](https://aclanthology.org/2026.findings-acl.428/), [official PDF](https://aclanthology.org/2026.findings-acl.428.pdf). Planning–Writing–Refinement with 7B fine-tuning and DPO/MCTS prevents claiming generic multi-stage writing planning as new. Official abstract reviewed; no replication and no inferential claim about KSGT performance.

## RAVEL opponents with action-changing conclusions

- **Prior-art critic:** ReaderScope/WRitEer refute broad narrative "reader-state control is ours." Action: narrow the hypothesized novelty or abandon it.
- **Experimentalist:** 8 authored source works, extra model calls, partial extractive quote tests, and no human ratings cannot establish control effect. Action: make state-as-text, strong direct, no-op and equal-budget iterative competitors decisive; stop piling on uncalibrated proxy scores.
- **Source-fidelity reviewer:** UNMEASURED→NO-CHANGE, forbidden object action, invented submission hours or communications all survived generative prompts. Action: assess full-document source commitments and editing burden, do not infer fidelity from substring removal.
- **Cost skeptic:** an OBSERVED_STATE arm costing 3.50x DIRECT must show real benefit, not only different outputs. Action: compute full all-in Pareto frontier and allow pruning the controller.

### Falsification decisions
H1: A minimal source-witnessed state measured *after actual realization* could bring cost-justified quality benefit; must establish with independent source-fidelity and human evaluation, not syntactic extraction.
H0: A strong direct model or equal-budget direct revision is equally good. If upheld, retire mandatory state infrastructure.
H2: Source-related Korean discourse controls might matter in notices/science but not fiction; treat genre effects as hypotheses without cherry-picking.
H3: The base writer may be incompetent, so all arms may fail regardless of controller; fix generation capacity before adding governance.

**Ruling:** Official G10-P2 OPEN. R5a DEVELOPMENT observed, quality advantage 0 proven, executable-controller contribution NOT TESTED. Next priority is source-correct complete prose and compute-matched intervention; add no new stage name.

### Drive acquisition / edition
ReaderScope: exact-title indexed Drive search 0; file acquisition pending, full text NOT READ. WRitEer: exact-title indexed Drive search 0; full PDF NOT READ. SuperWriter: standalone exact title not found, but ACL 2026 proceedings anthology exists in Drive; inspect its completeness before declaring absent. Do not confuse publisher landing pages, author abstract or README with a PDF full-text reading.
