# KRC v0.4 — A Narrow Korean Construction Calculus

**Result authority:** read-only GitHub Actions CI **37742686521**, 11/11 tests PASS, four full two-paragraph artifacts. No claim of Korean human naturalness or better-than-LLM results.

## Why we changed direction

KRC v0.1–v0.3 showed three confounded weaknesses: monolithic small-LLM genre and factual failure, source copying under a lexical critic, and typed IR terms contaminating the output. Strengthening a critic alone does not fix *realization*. This version makes the smallest positive construction question inspectable: can a compiler change Korean constituent order without altering what the source semantic record asserts?

## Formal object

Let \(\Gamma\) be a small typed source world containing propositions \(f_i\), each attached to:
- `semantic`: predicate, argument roles, polarity, time, comparison direction and epistemic state where applicable;
- `segments`: human-authored Korean constituents licensed for the same local proposition;
- `orders`: explicitly licensed permutations, always retaining the finite verb in final position;
- `paragraph` and `role`: document position and discourse function;
- `case_obligations`: a limited Hangul coda/particle test where marked nouns occur.

For the finite inventory, the implementation accepts

\[
\Gamma\vdash (f_i,\pi):\mathrm{LicensedOrder}
\]

only when \(\pi\) is one of the pre-authored source orders and uses every original constituent exactly once. The compiler also emits a provenance hash for the *same* semantic record before and after the operation. This demonstrates **typed identity of the internal proposition**, not that every surface reading is truth-conditionally or pragmatically equivalent in every context.

A separate Hangul Unicode rule selects Korean nominative \(이/가\), accusative \(을/를\), topic \(은/는\), and instrumental \(으로/로\) from the final coda; the \(ㄹ\) instrumental exception is explicit. Unattested non-Hangul endings fail closed. A topic construction requires a declared given referent; a contrastive topic requires an additional contrast warrant. Even when these conditions pass, emphasis and contrast presupposition are not automatically proved felicitous.

## Actual four document outputs

**EX11 — science, canonical**

> 같은 길이의 종이띠 두 장을 준비했다. 종이띠 한 장은 햇빛이 드는 곳에, 나머지 한 장은 그늘에 놓았다. 15분 뒤 두 종이띠의 표면 온도를 확인했다.
>
> 햇빛에 둔 종이띠의 표면 온도가 다른 종이띠의 표면 온도보다 높았다. 두 장소의 바람 세기는 측정하지 않았다.

**EX11 — licensed reorder and epistemic connective**

> 같은 길이의 종이띠 두 장을 준비했다. 종이띠 한 장은 햇빛이 드는 곳에, 나머지 한 장은 그늘에 놓았다. 두 종이띠의 표면 온도를 15분 뒤 확인했다.
>
> 다른 종이띠의 표면 온도보다 햇빛에 둔 종이띠의 표면 온도가 높았다. 다만 두 장소의 바람 세기는 측정하지 않았다.

**EX12 — scene, canonical**

> 늦은 오후에 나는 우체국 앞에 도착했다. 유리문 옆에 작은 안내판이 놓여 있었다. 한 사람이 봉투를 손에 들고 건물 밖으로 나왔다.
>
> 도로 건너편에서 버스가 멈췄다. 나는 횡단보도를 건너 정류장 쪽으로 걸었다.

**EX12 — licensed reorder**

> 나는 늦은 오후에 우체국 앞에 도착했다. 작은 안내판이 유리문 옆에 놓여 있었다. 한 사람이 봉투를 손에 들고 건물 밖으로 나왔다.
>
> 버스가 도로 건너편에서 멈췄다. 나는 횡단보도를 건너 정류장 쪽으로 걸었다.

This is a **small hand-licensed domain**: four documents, two source situations, five reordered fact clauses total. Some reorders alter emphasis and may sound less elegant than their canonical counterparts. Their value is mechanistic inspectability, not demonstrated stylistic superiority.

## Refutable operations

| Request | Compiler ruling | What this proves |
|---|---|---|
| Reorder explicitly licensed Korean phrase constituents | Accepted | Source fragment multiset and semantic record are unchanged |
| Reverse \(측정하지 않았다\) to positive | Rejected | Polarity flip is not a stylistic rewrite |
| Reverse \(높았다\) to \(낮았다\) | Rejected | Comparison direction remains a typed commitment |
| Insert unlicensed causal relation | Rejected | Observation cannot be promoted to cause by style alone |
| Delete referent with ambiguous antecedents | Rejected | Pronoun omission requires contextual licensing |
| Introduce new fact ID or unsanctioned word order | Rejected | Source document coverage cannot silently drift |
| Use \(다만\) after observed result to mark an unmeasured condition | Accepted only under the declared `EPISTEMIC_LIMIT` edge | Connector authorization is tied to a typed local discourse relation |

CI PASS: [KRC v0.4 execution](https://github.com/WhoSia/KSGT/actions/runs/37742686521).

## Strong scientific caveats

1. The positive phrase variants were **authored as grammar materials**; the compiler chooses and orders them rather than discovering unrestricted Korean morphology and syntax.
2. Identical semantic-record hashes prove record identity, not natural-language entailment. A misleading author's own segment could be preapproved; independent linguistic review remains an unsolved obligation.
3. Current grammar coverage is deliberately tiny, covering finite phrase order, four particle classes and one evidential-limit connective. It is *not* yet a general Korean writer.
4. Case particles and word order affect topicality, information focus and implicature; their pragmatics remain a separate research question.
5. Old v0.1 human-reader comparison was cancelled due to invalid stimuli, and this v0.4 run did not recruit readers.

## Next specific mechanism

The next extension should implement **typed predicate-argument realization** rather than add another generic evaluation/approval loop: e.g., evidence-traceable subject/topic selection, safe omitted arguments, predication/nominalization under semantic constraints, and two-clause combination with explicitly typed temporal/contrast evidence. The key falsifier remains whether these operations can create fluent **non-verbatim Korean passages** without copying all source sentences or inventing events. Only after that should the research resume a credible LLM-vs-KSGT writing comparison.
