# R9.40 — Korean obligation scope, text evidence, and local revision

## What was fixed and run

Eight synthetic plans carry 20 action IDs and authorized Korean action sentences. Each action has one scope rule, with an audience and one of three modalities: all users have the obligation, the named audience has the obligation with other audiences unspecified, or only the named audience has the obligation. An action's predecessor within a scope block is also part of its formal contract. The plans include whole-notice scope and mixed scopes.

The finite renderer writes a Korean heading for each scope block and renders its action sentences as a list. The parser uses the source plan's authorized surface forms to recover block headings, action IDs, conditions and within-block order from text. Evidence offsets are half-open JavaScript UTF-16 indices in that input. Recovery does not rely on a hidden trace from the renderer. The evaluator is deliberately closed to this finite wording and layout. "Unsupported" means the checker cannot read the text under its grammar.

Freeze 631cf35f92f4612285fbcb4c256cd3acd30e9721. [Run 44810051849](https://github.com/WhoSia/KSGT/actions/runs/44810051849), execution 2ca91b41b49c58a0ad605ebcd5635d3ae4727611. All 8 baseline calls completed normally using GPT-OSS 20B at temperature zero. The first plan matches byte for byte. Attempt, request and response identities, prompt and output hashes, and finish reasons match. The provider ZIP matches SHA-256 4384812aa06368cd7f13ca309fe59bce2d8193328260410565fb4f0a27497ede.

| Observation | Result |
| --- | --- |
| Controlled rendering, recovered scope and procedure order | 8/8 notices and 20 action spans; 0 model calls |
| Changed scope or procedure variants under the finite contract | 28 rejected, 6 unsupported, 0 accepted out of 34 |
| Original audience and action strings still present in those altered texts | 26/34 |
| Controlled change of a planned exclusivity value | 7/7 change only the designated heading and preserve all other bytes |
| Model free-form scope judgment | 2/8 clear, 5/8 exclusivity unstated, 1/8 target audience dropped |
| Finite parser on the model's free-form texts | 8/8 unsupported |
| Model tokens on the one-call reference | 3,048 across 8 calls |

The authored mutations toggle exclusivity (7), exchange actions between scope blocks (5), reverse action order (6), duplicate (8) or omit (8). Six omissions leave an empty heading and fall outside the renderer's grammar. Eight intentionally corrupted notices lack at least one expected term, leaving 26 that would pass the all-terms check. This does not estimate precision on natural errors. The seven scope edits flipped the first nonuniversal modality while recovering its heading span from text, including when multiple blocks were presented out of plan order. Scope audits rejected each edited text against its previous plan and accepted each against the changed plan. A further automated case changes the audience and verifies an independent block stays under its original modality.

The free-form model received the same prepared facts. It grouped actions coherently in multiple notices. In the five exclusivity cases, grouping or an audience salutation did not explicitly convey exclusion to other audiences. The PREORDER notice also omitted the advance-order audience altogether. The two clear notices were not covered by the finite surface grammar. These are one-investigator judgments, not observed misunderstandings by readers.

## Decision

Reuse the finite group structure when a scope list is acceptable. It is a useful comparator for the broader KSGT goal, as the earlier KRC v0.6 explicitly managed marked source identities for partitive expressions. Mann and Thompson's account of discourse relations also supports distinguishing a text's relation from the presence of an isolated word. Document quality and human preference remain open. Zero model tokens applies to the rendering, editing and readback of prepared plans and does not include extraction of those plans.

The next generation test should allow two independently authored Korean realizations per source action and test explicit scope evidence against fresh paraphrases. Investigate open-text coverage separately from errors of scope. Add the parallel same-actor experiment by holding the action and participant IDs fixed while varying available referents and permitted implicit actor mentions. Use human reading outcomes before claiming that one rendering is clearer than a well-formed alternative.
