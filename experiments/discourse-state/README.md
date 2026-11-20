# Korean referent choice with reader and quotation state

This probe resumes one part of the DiSM proposal in KSGT 18. It tests a change to an executable state transition under fixed wording options. It uses handcrafted events and candidates. It measures conditional realization behavior under a closed referent model.

```sh
node --test experiments/discourse-state/referent-choice.test.cjs
node experiments/discourse-state/referent-choice.cjs
node experiments/discourse-state/replay-comparison.cjs
```

## Controlled contrasts

Six synthetic pairs hold the intended actor and both candidate strings fixed. One factor changes within each pair: recipient, focus inside quotation, return from quotation, competing referent, refocusing, or knowledge of the active state. A singleton containing the intended actor counts as omission admissibility in these cases. The hand-authored labels implement this definition and do not measure how people would write or interpret these sentences.

| Method | Admissible omissions used / 6 | Inadmissible omissions / 6 |
| --- | ---: | ---: |
| Always name | 0 | 0 |
| Per reader, discard quotation scopes | 5 | 0 |
| Per scope, collapse all readers | 5 | 1 |
| Per reader and scope | 6 | 0 |

After closing the quotation, discarding its scope leaves the outside reader with a spurious competitor. Combining readers treats the team member's information as available to the team lead in the missing-state contrast. A second negative control deletes a real competitor from the input events while retaining the correct label. The full mechanism then produces an inadmissible omission. Accurate event extraction and uncertainty handling are necessary to transfer the result beyond annotated input.

## Operation count

The replay and streaming implementations call the same transition function. At 1,024 checkpoints they agree 1,024 times. Replaying each prefix makes 525,824 event updates. Carrying the state forward makes 1,025. The test alternates opening and closing the same kind of empty scope. This comparison counts updates and assumes structured events. A caching Transformer and recurrent decoder remain the efficiency baselines for real text. The count does not measure latency, memory, training cost, or a model's naturalness.

## Next decision

Hold the source, intended actor, available evidence, and alternatives fixed. Compare a full-history Transformer, the same model with the same computed state, and executable state-controlled choice. Separate runs with human-annotated events from runs with extracted events. Use text the experiment author did not use to design the rules and score correct reader recovery along with the choices readers would actually keep. Include topic changes, partial quotation, conflicting testimony and source attribution. Evaluate source fidelity and reader preference on new paragraphs before making claims about writing quality.

If the same-state Transformer matches the explicit choice with the same recovery, fidelity and cost, this experiment supports a state representation without identifying a distinct benefit from the controller. If event extraction invalidates the fidelity gain, test uncertainty or change the representation before scaling. A decoder comparison should share corpus, tokenizer and training budget, include the strongest small Transformer and a recurrent baseline, and report a quality-cost curve including state extraction.
