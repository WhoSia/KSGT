# R9.41 — Alternate Korean wording and actor competition

## One notice plan, more than one surface form

Eight existing synthetic plans now map each of their 20 action IDs to two authored Korean wordings. A list block and a same-line paragraph block each carry an explicit audience/condition sentence. An exact parser reconstructs scope, ordered action IDs and evidence spans from the text. Both formats accept each listed synonym-bearing sentence, with 32/32 realized variants and 80/80 action spans. The paragraph format requires sentence boundaries delimited by a period and a single space, along with blank lines between blocks. Unregistered sentences remain unsupported.

In the alternate paragraph format, seven exclusivity toggles, five swaps across audiences, and six within-scope order changes were rejected against the original plans. Edits intentionally reversing exclusivity were accepted against the amended plan. They preserve the authored wording and format outside the condition being edited.

This is an authorized phrase inventory with auditable bindings, not an open paraphrase recognizer. The eight earlier R9.40 free model notices were all still unsupported. The 32 positives are combinations of prepared rules and words, not independent natural-reader judgments.

## Does the second action need a subject?

Four new story briefs retain the next action and its intended actor across a one-actor prefix, a two-competing-actor prefix, and a prefix in which the competing actor leaves. The controlled renderer reuses DiscourseState and chooses among author-supplied named and bare surfaces. Its author-provided states license eight bare continuations and require four named ones. The same person and next action remain fixed within each set. Departing competitors still occur by name in the text; state changes because of the annotated departure, not mention count.

The initial free model reference received only the prefix, intended actor and next action with one-sentence style guidance. It named the intended actor in 12/12 outputs, kept the supplied action words, and gave identical continuations across the three contexts in each of the four briefs. This meets the permissive request, including all four competing conditions. It does not show context-driven variation. [Run 44812027506](https://github.com/WhoSia/KSGT/actions/runs/44812027506), 12 normal completions and 3,714 total tokens. Provider ZIP SHA-256 91eb650fd76bdc46c08fa3a8a2fbc347c76a3dd4b5d0bb66544e49e11f3e67ac.

## Change the model's omission instruction

The matched rerun alternates the permission prompt with a version that requires omission when only one actor can be recovered. Every user prompt, model setting and condition instruction about competing actors remains fixed. [Run 44812304194](https://github.com/WhoSia/KSGT/actions/runs/44812304194): 24 normal completions. Plans, prompt hashes and content hashes were verified for both runs. The paired provider ZIP SHA-256 is 73a6d04fbc91e3de5d464362c2caedae91634ee883a29bc06b66227d44c8ecd1.

| Strategy | Bare with only one named character / 4 | Bare after competitor leaves / 4 | Bare in deliberately competing context / 4 | Model tokens / 12 |
| --- | ---: | ---: | ---: | ---: |
| Permission model, paired rerun | 0 | 0 | 0 | 3,690 |
| Require omission when one actor is plausible | 3 | 2 | 3 | 3,927 |
| Controlled realization from supplied focus events | 4 | 4 | 0 | 0 |

The paired permission arm returned the same 12 lines as the initial run. Both model conditions retain the source action wording in every response. In DRAWER, the stronger prompt left the name in the one-actor and resolved versions but omitted it while two people had opened similar drawers. In LANTERN it omitted in all three versions. Therefore the stronger prompt changes the frequency of bare forms, with both suitable and ambiguous omissions under the intended reading inventory. The inventory is hand-authored: no conclusion about how an actual reader chooses the actor is warranted. The use of an overt subject when omission is merely permissible is a valid response.

## Decision and next test

There are two different interfaces to strengthen. Notice parsing needs more independently written wordings and unsupported examples with unchanged meaning, so grammar coverage is not mistaken for meaning accuracy. Actor realization needs events produced from story evidence: adding a person, that person ceasing to be plausible for the next event, and that person becoming plausible again. The existing realizer has the event transitions, but receives the state from curated fixtures. It should be tested on cases with two actual names and sequential commitments, and against a baseline supplied the same computed candidate set. Score grounding, author-preferred explicitness, reader selection and reading time separately. An automatically derived ID cannot take the place of evidence that the reader resolves a bare action.

The controlled notice and actor work belongs to the same source-grounded KRC line: keep prepared facts and relationships fixed while varying their written form. This round covers two controlled notice layouts and one finite subject-choice policy. It has no reader ratings and does not test general fluent paraphrase or a new network architecture.
