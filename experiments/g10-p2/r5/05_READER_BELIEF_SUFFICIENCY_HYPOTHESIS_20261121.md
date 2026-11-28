# R5 scientific candidate · Reader-belief sufficient state rather than a generic prose governor

2026-11-21. Status: NEW THEORY PROPOSAL; no measured human effect; not a proved novel contribution.

## Scientific explanandum
Why does a grammatically valid and source-lexically faithful passage still feel as though a human did not write it? A writer makes an utterance to change **what the reader can infer, expect and attend to**. A static checklist about source facts is not a model of that change, and a model's planned state is not necessarily the interpretation licensed by its actual sentences.

## Proposed typed states
For a source work w and realized Korean prefix y[1:t], let

- X(w): source constraints and explicitly licensed invention/fiction.
- I(w): writer's genre, desired reader action, stance, rhetorical and aesthetic objectives.
- B_t(r): a distribution or uncertainty set of propositions/expectations the target reader r can actually recover after reading y[1:t].
- P_t: the writer/controller's prediction of B_t *before* the candidate sentence was realized.
- O_t: an externally anchored estimate of the reader's possible beliefs *from the realized surface*.
- Delta_t = difference(P_t, O_t) in task-dependent consequences, NOT literal word overlap.

The strong hypothesis H1 is that a task-calibrated, compact O_t improves the next Korean realization under source-fidelity and compute constraints compared with explicit I(w) and X(w) alone.

Crucial: an LLM's own inference about what readers know is **not** calibrated B_t(r). A synthetic teacher may approximate O_t for preflight, but its score has no independent-reader authority.

## Decision and sufficiency objective
Seek a compression Z_t = phi(X, I, y[1:t]) such that the reader outcome Q obeys approximately

    Q independent of y[1:t] given (X, I, Z_t, reader-group, genre)

under held-out human behavior. If a smaller Z'_t predicts equally well while saving cost, the larger state is **not minimum necessary**. With only researcher-authored synthetic examples we cannot estimate this conditional independence or train a defensible reader belief posterior; it is a proposed operational test, not a theorem already shown.

The system's proposed action policy is:

    a_t = argmax_a { expected reader-task utility Q after realizing a
                     - lambda * marginal all-in cost(a)
                     - source-violation penalties(a) }

subject to preserving mandatory source obligations and not making a prediction a certified meaning judgment. Prefer a plural set of admissible realizations when the evidence underdetermines style.

## Causal contribution decomposition
A difference between a single model prompt and a multi-call reader-state controller could be due to: (A) additional factual context, (B) extra computation and search, (C) state representation, (D) the timing of actual-prefix feedback, or (E) text selection by a more capable oracle.

An experiment claiming *feedback-state* gain must intervene on D while matching A–C and E as far as possible; in particular STATE_AS_TEXT receives the same exact Z_t after the same realized prefix, with the same candidate budget. EQUAL_COST_ITERATIVE spends equivalent measured calls on ordinary revision, not an artificially weak direct one-shot only.

## Rival hypotheses and hard counterexamples
H0 information suffices: the model given X + I + same Z in plaintext already produces equally good reader outcomes, making the state machine unnecessary.
H2 repetition/planning dominates: gains stem from extra provider calls, not the structure of Z.
H3 measurement artifact: the reader-belief proxy follows lexical cues rather than reader interpretation (e.g. a grounded contrast 'A가 아니라 B' is legitimate, while a baseless contrast without that exact token remains poor).
H4 style-overfitting: removing every uncertain or unusual statement creates defensive, bland writing; the objective must distinguish forbidden invention from a genre-licensed metaphor, irony or narrative ellipsis.
H5 unsupported inference: a text repeats all original facts but changes a condition into an asserted causal explanation; source-token overlap does not certify the new relation.

If H1 loses to H0/H2 on independent whole-prose outcomes, RETIRE reader-state as a mandatory production layer. Keep its source diagnostics only where they earn their marginal cost. If O_t requires essentially the whole original passage and several model calls, compact-state theory fails even if prose gain exists.

## Ambition and method discipline
This is a bounded route toward a **small modular Korean writing architecture**. It need not invent an entirely new neural backbone. A truly new, cost-effective controller would need to identify a transportable reader-state statistic from human traces or held-out reader tasks and show a causal intervention; naming a POMDP does not do that. We will not announce 'better than Transformer' without matching the strongest direct and iterative generation systems.

Linked G10-P2 original: https://app.notion.com/p/41fef561cf928105a17bc0c33a9701bc
