# KRC v0.2 — Warranted Clause Game: Formal Contract and Falsifiers

**Context.** This is a directly executable KSGT Korean-writing experiment, not another generic proposer/governance study. KRC v0.1 compiled typed discourse plans and preserved thirty source-atom strings in its symbolic control, but its 18 model-written drafts often violated ordinary prose format and in particular K produced 0/6 exact two-paragraph passages. A planner typecheck does not confer a semantic theorem on the model's output.

## 1. Why a generator–critic game, rather than a GAN discriminator

In ordinary GAN terminology, a generator and discriminator learn against one another via an adversarial optimization objective. KRC v0.2 instead implements a **bounded test-time two-player protocol**:

\[
G_0(\Gamma,\ell_i)\to c_{i,0},
\qquad V(\Gamma,\ell_i,c_{i,0})\to W_{i,0}.
\]

If the critic produces a **typed counterexample witness** \(W_{i,0}\), the generator may make exactly one witness-conditioned retry:

\[
G_1(\Gamma,\ell_i,W_{i,0})\to c_{i,1}.
\]

Then V rechecks. If the candidate still fails *mechanical* admissibility, the source fact \(f_i\) is copied verbatim as an explicit fallback. No LLM weights are updated and no scalar discriminator reward is maximized. **The term “GAN-inspired” is analogy only**; this is not GAN training.

The crucial distinction is feedback *content*. The critic is not permitted to invent a better sentence or report “human-like score 0.93.” It only returns (a) violated obligation codes, (b) local source-fact identifiers and (c) typed cautionary notes. The generator may respond to those defects, not to an aesthetic optimization score.

## 2. Typed state and locality

A fact object is \(f_i=(id_i,p_i,a_i,\pi_i,r_i)\): id, human-readable licensed proposition, frozen lexical witness anchors, target paragraph and discourse role. A context \(\Gamma\) consists of five such fact objects, a set of explicitly unknown propositions, genre, intended reader, narrator/register and fixed discourse ordering.

For each slot, the surface realizer may return at most

```json
{"fact_id":"F4","sentence":"20분 뒤 천으로 감싼 병의 온도가 더 낮았다."}
```

The critic checks JSON shape, exact source fact identity, local extent, meta-instruction leakage, numerals not present in the source fact, frozen lexical anchors and *limited explicitly listed* causal/emotional overclaims. This is intentionally a **weak proof system**. Even an accepted candidate may shift scope, presupposition or material factual content not captured by lexical witnesses. The status is therefore `MECHANICALLY_ADMISSIBLE_SEMANTICS_UNKNOWN` and never `SEMANTIC_PASS`.

## 3. Termination and conditional guarantees

With ten slots and two calls per slot maximum, the algorithm admits no more than 20 generation requests. The slot compiler appends exactly one clause per fact, whether a V-admitted model candidate or a source-verbatim fallback. Each source fact has a fixed paragraph assignment in \(\{1,2\}\). Therefore the finite composer produces exactly two paragraphs provided both paragraphs contain slots (which the prospective packet enforces).

The *guarantees* are computational rather than linguistic:

- finite termination, ignoring external transport stalls beyond a bounded request timeout;
- every source fact ID has exactly one final slot position;
- no accepted model clause had a reported **mechanical** hard violation;
- every fallback is a literal source statement, with explicit provenance;
- the two-paragraph output format is enforced by composition rather than requested from a monolithic decoder.

These properties **do not** entail semantic faithfulness for neural clauses, full truth preservation of juxtaposed source clauses, polished idiomatic Korean, or a reader's preference over a generic model. KSGT should not convert a format invariant into a prose-quality result.

## 4. Comparators and alternative explanations

KRC v0.2 uses **two newly authored prompts** (one science passage, one scene essay) not seen in v0.1: EX07 and EX08, five fact atoms each. It retains the *same* Qwen3 0.6B Q8 model file and llama.cpp runner as v0.1, but changes the unit of generation, prompt, decoding (0.4 vs 0.65) and assembly logic. Consequently, any improvement in paragraph count **cannot be attributed purely to adversarial feedback**. It could arise wholly from deterministic assembly, shorter decoding, a different prompt or sources.

A later prospective causal test would need at least four arms on *fresh* items:
**(I)** monolithic prose; **(II)** slot generation plus deterministic assembly with no repair; **(III)** slot generation plus witness-conditioned repair; **(IV)** exact-source symbolic control. An equal-token untyped plan arm should test whether the type system itself adds value beyond more instructions. Changing model size may test whether the bottleneck is decoder capability, but cannot silently replace a frozen comparison.

## 5. Korean-specific phenomena that matter

The eventual passage evaluation should track source-licensed Korean constructions and discourse effects, not just a word blacklist:

1. **정보구조** — whether given/new reference and topic-focus particles are licensed by context;
2. **생략·회수 가능성** — when an omitted argument can be reconstructed without a misleading reference;
3. **관계와 접속** — whether a conjunctive ending or adverb actually expresses supported temporal, causal, concessive or contrastive structure;
4. **종결·문체** — audience-relative register and stance that remain stable across a passage;
5. **문장 리듬과 어휘 질감** — natural asymmetries whose value depends on narrative purpose, not a global anti-LLM signature.

These are presently **research hypotheses and observational targets**, not functions fully decided by the present regex critic.

## 6. Defeat conditions

- V accepts fabricated details not caught by its limited lexical witnesses ⇒ no semantic guarantee.
- The realizer repeatedly falls back to original fact strings ⇒ the architecture is mechanically safe but not a learned Korean stylistic advance.
- A finished passage is structurally correct but stylistically stilted ⇒ document composition does not entail natural prose.
- A critic learns to reward its own marker patterns ⇒ reward hacking, not research progress.
- Readers find the generic monolithic model more natural while facts remain accurate ⇒ KRC's architecture is not yet worth its added complexity.
- Reader ratings are absent ⇒ **no naturalness superiority/defeat verdict**.

## 7. Human-reader boundary

The user's recruitment of readers is a separate, deferred lane. The KRC v0.1 **blinded three-form packet** is preserved at [Drive](https://drive.google.com/file/d/1kCEkIrcRiVTExOfwVUKNdDyO8E_9xafD/view). The author–arm unblinding key is kept separately and must never be sent alongside the reader packet. In any human exercise, do not collect identifying information; permit “tie,” “neither” and abstentions; have explicit instructions for factual fidelity distinct from stylistic naturalness.

**Current authority:** executable precommitted architecture and test-time generated demonstration pending. There is no human Korean naturalness experiment in v0.2 and no actual gradient-based GAN.
