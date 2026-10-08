# KRC v0.5 — Context-Licensed Korean Clause Combination and Recoverable Actor Ellipsis

**Status:** bounded experiment completed. Read-only [GitHub Actions 37745597095](https://github.com/WhoSia/KSGT/actions/runs/37745597095) **SUCCESS**, 8/8 tests. This is a finite construction microgrammar, not a general Korean writer or naturalness benchmark.

## 1. Explanandum

The question is no longer whether a small LLM can be instructed to avoid stock phrases. It is whether **Korean clause formation can reduce needless explicit repetition while retaining the authorized source events and maintaining a recoverable agent**.

The experimental material contains two entirely new controlled fictional situations (`EX13` laboratory, `EX14` library), five typed event records each. Two surface forms of each document are generated: `canonical` (five finite sentences) and `combined` (four finite sentences). All output clauses are authored from finite source-licensed Korean constituents; the realizer changes the construction rather than freely inventing predicates.

## 2. Formal structure

A source event carries

\[
 e_i=(\text{id},\text{actor},\text{predicate},\text{polarity},\text{arguments},\text{sequence},\text{paragraph}).
\]

The generator also receives (a) manually attested finite and conjunctive Korean spellings, (b) ordered discourse edges, and (c) an active-referent state. Its compiler emits a **per-event source trace** and typed construction witnesses. A trace hash is not an entailment proof: it proves the internal event object was referenced, while the validity of the authored Korean wording remains a separate linguistic obligation.

**Operation 1 — `SEQUENTIAL_AND`**. Connect event \(e_i\) to \(e_{i+1}\) with the first event's attested `-고` predicate when:
- both events are positive, in the same paragraph, and contiguous in declared source time;
- both have **the same explicit actor ID**;
- the source discourse graph contains a dedicated adjacent sequential edge; and
- the authored Korean conjunctive head and actorless second clause match those records.

This creates `민지는 컵 두 개를 놓고 두 컵에 물을 부었다` from two separately source-licensed events. It is not a general license for interpreting any two positive clauses as simultaneous or causal.

**Operation 2 — `ELLIPSIS_ALLOW`**. A repeated actor can be omitted only when the previous event and current event have the same actor, a declared ellipsis edge, exactly one source-licensed antecedent, matching active context, and no paragraph boundary or intervening impersonal/third-person reset. Thus the EX14 library paragraph may omit `서윤은` in `입구 옆에 우산을 세워 두고`; after the unagented sound event in paragraph 2, the name is introduced again in `서윤은 안내판을 읽었다`.

**Operation 3 — `EPISTEMIC_LIMIT`**. In EX13, the observation that one cup was warmer is followed by the source's `공기 온도를 측정하지 않았다` claim. An explicit limitation edge licenses `다만`, but not a claim that the position *caused* the difference.

## 3. Generated passages

### EX13 laboratory: canonical

민지는 실험대 위에 투명한 컵 두 개를 놓았다. 민지는 두 컵에 같은 양의 물을 부었다. 민지는 그중 한 컵을 창가로 옮겼다.

20분 뒤 창가에 둔 컵의 물 온도가 다른 컵보다 높았다. 민지는 두 컵 주변의 공기 온도를 측정하지 않았다.

### EX13 laboratory: composed

민지는 실험대 위에 투명한 컵 두 개를 놓고 두 컵에 같은 양의 물을 부었다. 그중 한 컵을 창가로 옮겼다.

20분 뒤 창가에 둔 컵의 물 온도가 다른 컵보다 높았다. 다만 민지는 두 컵 주변의 공기 온도를 측정하지 않았다.

### EX14 library: canonical

서윤은 늦은 오후에 도서관 앞에 도착했다. 서윤은 입구 옆에 우산을 세워 두었다. 서윤은 유리문을 열었다.

안쪽에서 책장을 넘기는 소리가 들렸다. 서윤은 안내판을 읽었다.

### EX14 library: composed

서윤은 늦은 오후에 도서관 앞에 도착했다. 입구 옆에 우산을 세워 두고 유리문을 열었다.

안쪽에서 책장을 넘기는 소리가 들렸다. 서윤은 안내판을 읽었다.

## 4. Actual executable court

- **8/8 Node.js tests PASS**, 0 failures.
- **4 two-paragraph output documents** from two new contexts.
- **2 explicit `-고` clause joins**.
- **2 separately justified actor omissions**, including an actorless conjunctive head.
- **5 source event IDs per document**, 10 distinct source event records; the paired documents retain the same event-record hashes.
- **5 sentences → 4 sentences** for both composed outputs.
- **0 pretrained model calls**, **0 human preference results**, and **0 claims of superiority over a competent generic LLM**.

Negative probes deliberately reject actor change, ambiguous antecedents, cross-paragraph ellipsis, unlicensed temporal linking, source-event omission, source predicate spelling divergence, unsupported causes, negation reversal and comparison reversal. The source-bound verb witnesses include the finite/conjunctive pairs `놓았다/놓고` and `세워 두었다/세워 두고`.

## 5. What remains unproved

1. These Korean variants were **manually authored as finite construction exemplars**. No independent licensed Korean corpus or human author reference confirms their overall style ranking.
2. A source event hash is evidence of **internal provenance**, not a semantic theorem about real Korean sentence interpretation. Combining with `-고` may alter timing/connection implications.
3. The `그중 한 컵` part-whole antecedent is authored, but the compiler does not yet independently prove that this reference resolves to the original two-cup event. The actor reference is checked more strictly than the object reference.
4. The realizer does not support arbitrary Korean finite-predicate conjugation, valency or tense/aspect. It uses a finite set of source-attested string forms.
5. Reducing repetitive subject mentions is a linguistic *capability*, not a reader-rated naturalness improvement. The old v0.1 18-piece human reader packet remains **withdrawn**.

## 6. Next narrow mechanism

KRC v0.6, if opened, should **not** add a new judge. It should test (a) source-grounded nominal/anaphoric link resolution including `그중`, (b) a typed finite-to-conjunctive transformation with lemma, tense and polarity obligations, and (c) when clause combination damages information structure or emphasis. The next criterion is a fresh Korean paragraph pair exhibiting licensed transformation beyond verbatim copying and a counterexample where the *same* surface edit must be rejected in a different discourse context.

**Project routing:** KSGT is a Korean natural-writing research programme, not a general-purpose approval system; the study must eventually compare genuinely good, semantically faithful Korean prose against an adequate general-purpose model, but v0.5 does not qualify as that benchmark.
