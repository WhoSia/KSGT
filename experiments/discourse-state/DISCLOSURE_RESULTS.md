# R9.37 — Disclosure in generated Korean paragraphs

Four synthetic briefs (two literary scenes and two notices) were composed for two disclosure placements and three generation conditions. The protocol and initial prompts were frozen at 3264a291528e8d7e23c6ce1c7dcee4a90be0b6e6. Live execution 13cc7f042a8cb490e2239cd2c89f3277c97c7f60 used GPT-OSS 20B at temperature zero, [run 44793732798](https://github.com/WhoSia/KSGT/actions/runs/44793732798). All 32 calls completed normally. The first phase plan matches byte for byte. Attempt, model response and plan identities and text hashes matched for 24 first-phase and 8 second-phase calls. The scorer recomputed each second-phase prompt hash from the actual first line. The provider ZIP matches SHA-256 ba5ef591a46a2b8e11d594ba2972560011e9c0a8b6cde842d4fd4904a2266ff5.

| Condition | Strict order and anchor / 8 | Both placements pass strict check / 4 | First disclosure in the requested line / 8 | Author fidelity preserved / loss / unclear | Model tokens |
| --- | ---: | ---: | ---: | --- | ---: |
| Direct instruction, one call | 3 | 1 | 4 | 4 / 2 / 2 | 4,088 |
| Sentence-level plan, one call | 5 | 2 | 7 | 3 / 0 / 5 | 4,138 |
| Incoming facts, actual first sentence, follow-up call | 4 | 1 | 8 | 4 / 2 / 2 | 6,914 |

The first-disclosure column was added after inspection. It requires two lines and the first occurrence of the specified reveal phrase in the requested line; it allows later repetitions and does not verify semantic disclosure. The fidelity counts are a single-author screen of the requested facts, actors, and scope. It separately records unclear cases. It is not a naturalness, preference or blinded reader outcome.

## Results that change the design

- First-disclosure and whole-paragraph quality differ. In LABEL, the one-call plan kept the specified mail envelope but repeated the name on the second line after already revealing it. The strict check penalized that repetition. The staged renderer weakened the mail envelope to a generic envelope in both order variants, despite having the specific object in its second request.
- A shared constraint should survive movement. In late HALL_NOTICE, one-call baselines said only that “this procedure” applied to first-time participants. The referent could be the immediately preceding move to the waiting room. The staged renderer wrote “these two procedures,” explicitly scoping both. Its second request contains guidance to do so, and the arms use different instructions and request counts. This is an observed capability of the tested configuration, not evidence that staging itself caused the benefit.
- Staging withholds an unreleased fact from the first model request. The tested complete staged configuration used 69.1% more model tokens than direct prompting. Its common style and constraint preservation were mixed. Do not treat this run as efficiency or quality superiority.

## Decision and next comparison

Keep the single-call plan as the default comparison, and reserve a separate controlled condition for staged rendering. Bind already-known shared scope and protected noun phrases to source facts in both arms. Give the same scope-binding instructions to the single-call reference and the two staged arms. Within the two staged arms, keep the call count and wording contract fixed and vary whether the first request can see the fact it is supposed to defer. Record source fidelity, first disclosure, and reader interpretation separately. Preserve intentionally repeated names as possible realizations. Test additional briefs with scope that cannot be conveyed naturally in one short clause, and remove lexical anchors in a separate reader-facing run.

References used for the next design: Hough (2011), §§3–4 on grounded word paths and rollback after a goal changes; Moryossef, Goldberg & Dagan (2019), §§3–6 for plan/realization and relation-level fidelity; Mann & Thompson (1988), §§2–3 for Condition and scope relation as reader effects independent of a cue word.
