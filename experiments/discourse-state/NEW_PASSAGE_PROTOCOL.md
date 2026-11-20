# R9.36 — Choice from Korean paragraphs and extracted discourse state

Six newly authored contrast pairs reuse the actor and both candidate strings within a pair. Each pair alters the addressee or discourse context. The 12 items have six permissible and six impermissible omissions under the stipulated rule. Fixed reference annotations and candidate order are frozen before the live requests. This controlled set measures a constrained expression decision. It provides no reader or naturalness outcome.

| Condition | Input and operation |
| --- | --- |
| History | Same GPT-OSS 20B receives the full Korean paragraph and the alternatives. |
| State | Same model receives the state computed from manually annotated events and the same alternatives. |
| Extract | Same model sees the raw paragraph, the sentence without its subject, and an allowed list of candidate names. It receives neither the intended actor nor the reference label. Executable choice consumes its structured output plus the intended actor. |
| Controller | No model call. Apply the executable transition and decision to the manually annotated events. |

The first two conditions hold the policy and options fixed. Favorable performance on curated state is an upper-bound diagnostic. The extract arm differs in instruction, evidence packaging and output contract. Its comparison to full history estimates this particular end-to-end pipeline outcome, not an isolated architectural effect. Every provider response must end normally and conform to its arm's literal format for the format count. A malformed extracted state uses explicit naming, with failure separately counted. Any unsafe omission is a fidelity failure even if other cases are correct.

Record correct choices, safe and unsafe omissions, exact state matches, format conformance and token usage. This paired synthetic run is for debugging and prioritization. To proceed to model training, repeat on new independently coded paragraphs and evaluate composed paragraphs with real readers, including cases where the name is knowingly repeated for a reason. Compare lookups and state extraction in the full runtime budget.